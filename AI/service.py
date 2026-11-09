"""
AI/service.py
Logic của Chat AI, tách khỏi lớp HTTP (views.py) để dễ kiểm thử và nâng cấp.
"""

import os
import re
import unicodedata

from openai import OpenAI

from shop.models import Product

from . import config


STOP_WORDS = {
    "anh", "ban", "bao", "bao nhieu", "cac", "cho", "co", "gi", "giup",
    "hay", "la", "minh", "mua", "nao", "nhe", "nhung", "oi", "sao",
    "san", "pham", "toi", "tim", "tu", "van", "va", "voi", "em", "can",
    "muon", "gia", "re", "duoi", "tren", "khoang", "tam", "tien",
    "sinh", "vien",
}


def _normalize(value):
    value = unicodedata.normalize("NFD", str(value or "").lower())
    value = "".join(char for char in value if unicodedata.category(char) != "Mn")
    return value.replace("đ", "d")


def _tokens(value):
    return {
        token for token in re.findall(r"[a-z0-9]+", _normalize(value))
        if len(token) > 1 and not token.isdigit() and token not in STOP_WORDS
    }


def _extract_budget(message):
    normalized = _normalize(message)
    if not re.search(r"\b(duoi|toi da|khong qua|trong tam|tam gia|budget)\b", normalized):
        return None

    match = re.search(
        r"(?:duoi|toi da|khong qua|trong tam|tam gia|budget)\s*"
        r"([0-9]+(?:[.,][0-9]+)?)\s*(trieu|tr|nghin|ngan|k)?",
        normalized,
    )
    if not match:
        return None

    raw_amount = match.group(1)
    if re.fullmatch(r"\d{1,3}(?:[.,]\d{3})+", raw_amount):
        amount = float(re.sub(r"[.,]", "", raw_amount))
    else:
        amount = float(raw_amount.replace(",", "."))
    unit = match.group(2)
    if unit in {"trieu", "tr"}:
        amount *= 1_000_000
    elif unit in {"nghin", "ngan", "k"}:
        amount *= 1_000
    elif amount < 10_000:
        amount *= 1_000
    return int(amount)


def _product_text(product):
    categories = [category.name or "" for category in product.catergory.all()]
    return {
        "name": _normalize(product.name),
        "detail": _normalize(product.detail),
        "categories": _normalize(" ".join(categories)),
        "category_names": categories,
    }


def _rank_product(text, keywords, phrase):
    name_tokens = _tokens(text["name"])
    category_tokens = _tokens(text["categories"])
    detail_tokens = _tokens(text["detail"])
    score = 0
    matched = 0

    for keyword in keywords:
        if keyword in name_tokens:
            score += 4
            matched += 1
        elif keyword in category_tokens:
            score += 3
            matched += 1
        elif keyword in detail_tokens:
            score += 1
            matched += 1

    if phrase and phrase in text["name"]:
        score += 5

    required_matches = min(2, len(keywords))
    if score < 3 or matched < required_matches:
        return 0
    return score


FOLLOW_UP_MARKERS = (
    "cai nay", "cai do", "cai nao", "loai nay", "loai do", "mon nay",
    "mon do", "san pham nay", "san pham do", "con hang", "gia bao nhieu",
    "re nhat", "gia thap nhat", "dat nhat", "so sanh", "chi tiet",
)


def find_products(user_message, history=None):
    """Return relevant approved products and whether to show their cards."""
    message = str(user_message or "").strip()
    normalized_message = _normalize(message)
    search_message = message
    if any(marker in normalized_message for marker in FOLLOW_UP_MARKERS):
        for previous in reversed(history or []):
            if (
                isinstance(previous, dict)
                and previous.get("role") == "user"
                and isinstance(previous.get("content"), str)
                and previous["content"].strip()
            ):
                previous_content = previous["content"]
                normalized_previous = _normalize(previous_content)
                if not any(marker in normalized_previous for marker in FOLLOW_UP_MARKERS):
                    search_message = previous_content
                    break

    keywords = _tokens(search_message)
    budget = _extract_budget(message)
    phrase = _normalize(search_message)
    cheapest_first = any(
        phrase in normalized_message for phrase in ("re nhat", "gia thap nhat")
    )
    most_expensive_first = any(
        phrase in normalized_message for phrase in ("dat nhat", "gia cao nhat")
    )

    if not keywords and budget is None:
        return [], False

    products = (
        Product.objects.filter(is_approved=True)
        .prefetch_related("catergory")
    )
    ranked_products = []
    for product in products:
        price = product.sale_price
        if budget is not None and price > budget:
            continue

        text = _product_text(product)
        if keywords:
            score = _rank_product(text, keywords, phrase)
            if score == 0:
                continue
        else:
            score = 0
        ranked_products.append((score, product))

    ranked_products.sort(
        key=lambda item: (
            item[1].sale_price if cheapest_first else (
                -item[1].sale_price if most_expensive_first else -item[0]
            ),
            -item[0] if cheapest_first or most_expensive_first else 0,
            (item[1].stock or 0) <= 0,
            item[1].sale_price,
            item[1].id,
        )
    )
    matched_products = [product for _, product in ranked_products[:config.MAX_PRODUCTS]]
    return matched_products, bool(matched_products)


def format_product_info(products):
    """Định dạng dữ liệu sản phẩm có thật để AI tư vấn chính xác."""
    formatted = []
    for product in products or []:
        category_names = [category.name for category in product.catergory.all() if category.name]
        price = int(product.price)
        sale_price = int(product.sale_price)
        details = [
            f"- {product.name}",
            f"Giá: {sale_price:,} VNĐ",
        ]
        if sale_price != price:
            details.append(f"Giá gốc: {price:,} VNĐ")
        if category_names:
            details.append(f"Danh mục: {', '.join(category_names)}")
        if product.stock is not None:
            details.append("Còn hàng" if product.stock > 0 else "Tạm hết hàng")
        if product.detail:
            details.append(f"Mô tả: {product.detail[:300]}")
        formatted.append(" | ".join(details))
    return "\n".join(formatted)


def build_messages(system_prompt, history, user_message):
    """Ghép prompt, các lượt hội thoại gần nhất và tin nhắn mới."""
    messages = [{"role": "system", "content": system_prompt}]
    valid_history = []
    for msg in history or []:
        if not isinstance(msg, dict) or msg.get("role") not in {"user", "assistant"}:
            continue
        content = msg.get("content")
        if isinstance(content, str) and content.strip():
            valid_history.append({"role": msg["role"], "content": content[:4000]})
    messages.extend(valid_history[-12:])
    messages.append({"role": "user", "content": str(user_message or "")[:4000]})
    return messages


def ask_ai(system_prompt, history, user_message):
    """Gọi mô hình AI và trả về nội dung câu trả lời đã chuẩn hóa."""
    client = OpenAI(
        api_key=os.environ.get(config.API_KEY_ENV),
        base_url=config.BASE_URL,
    )
    response = client.chat.completions.create(
        model=config.MODEL,
        messages=build_messages(system_prompt, history, user_message),
        max_tokens=config.MAX_TOKENS,
        temperature=config.TEMPERATURE,
    )
    content = response.choices[0].message.content
    return (content or "").strip()


def products_payload(products):
    """Chuyển sản phẩm thành dữ liệu JSON cho thẻ sản phẩm trong khung chat."""
    return [
        {
            "id": product.id,
            "name": product.name,
            "price": product.price,
            "sale_price": product.sale_price,
            "discount_percent": product.discount_percent or 0,
            "stock": product.stock,
            "image": product.ImageURL,
        }
        for product in (products or [])[:config.MAX_PRODUCTS]
    ]
