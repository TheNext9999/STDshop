"""
AI/views.py
Lớp HTTP của Chat AI: nhận POST /api/chat/ từ khung chat và trả JSON.

Request : {"message": "...", "history": [{"role": "user|assistant", "content": "..."}]}
Response: {"status": "success", "reply": "...", "products": [{id, name, price, image}]}
          hoặc {"status": "error", "message": "..."}
"""

import json
import logging

from django.http import JsonResponse

from . import config, prompts, service

logger = logging.getLogger(__name__)


def chat_ai(request):
    if request.method != "POST":
        return JsonResponse(
            {"status": "error", "message": "Method not allowed!"},
            status=405,
        )

    try:
        data = json.loads(request.body or b"{}")
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse(
            {"status": "error", "message": "Dữ liệu gửi lên không hợp lệ."},
            status=400,
        )

    if not isinstance(data, dict):
        return JsonResponse(
            {"status": "error", "message": "Dữ liệu gửi lên không hợp lệ."},
            status=400,
        )

    try:
        user_message = data.get("message")
        if not isinstance(user_message, str) or not user_message.strip():
            return JsonResponse(
                {"status": "error", "message": "Vui lòng nhập nội dung cần tư vấn."},
                status=400,
            )
        if len(user_message) > 4000:
            return JsonResponse(
                {"status": "error", "message": "Tin nhắn quá dài, vui lòng rút gọn."},
                status=400,
            )

        history = data.get("history", [])
        if not isinstance(history, list):
            history = []
        matched_products, show_products = service.find_products(user_message, history)
        system_prompt = prompts.build_system_prompt(
            service.format_product_info(matched_products)
        )
        reply = service.ask_ai(system_prompt, history, user_message)
        products_list = service.products_payload(matched_products) if show_products else []
        return JsonResponse({"status": "success", "reply": reply, "products": products_list})
    except Exception:
        logger.exception("AI chat request failed")
        return JsonResponse({"status": "error", "message": config.ERROR_MESSAGE})
