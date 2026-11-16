# ============================================================
#  landing/search.py
#  Lõi tìm kiếm của STD Market (dùng chung cho gợi ý khi gõ và cho thẻ sản phẩm):
#   - tìm KHÔNG DẤU: gõ "ao thun" vẫn ra "Áo thun", gõ "dien thoai" ra "Điện thoại"
#   - nhiều từ khóa: tất cả các từ phải xuất hiện (ở tên, thương hiệu, khu vực...)
#   - xếp hạng: khớp ở tên được ưu tiên hơn khớp ở các trường khác
# ============================================================

import unicodedata


def fold(text):
    """Bỏ dấu tiếng Việt + đưa về chữ thường để so sánh. 'Điện Thoại' -> 'dien thoai'."""
    out = []
    for ch in unicodedata.normalize('NFC', str(text or '')):
        if ch in 'đĐ':
            out.append('d')
            continue
        out.append(''.join(c for c in unicodedata.normalize('NFD', ch) if not unicodedata.combining(c)))
    return ''.join(out).lower()


def tokenize(query):
    """Tách câu tìm kiếm thành các từ khóa đã bỏ dấu."""
    return fold(query).split()


def matches_all(haystack, tokens):
    """Đúng khi MỌI từ khóa đều xuất hiện trong `haystack` (đã fold)."""
    return bool(tokens) and all(t in haystack for t in tokens)


def score(name, tokens):
    """Điểm xếp hạng theo TÊN sản phẩm (càng cao càng lên đầu)."""
    name = fold(name)
    phrase = ' '.join(tokens)
    points = 0
    if phrase and name.startswith(phrase):
        points += 100
    elif phrase and phrase in name:
        points += 60
    for t in tokens:
        if t in name:
            points += 20
            if name.startswith(t) or (' ' + t) in name:   # khớp đầu từ
                points += 10
    return points
