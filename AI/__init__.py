"""
Module AI của STDShop - trợ lý bán hàng (Chat AI).

Cấu trúc (mỗi file lo đúng 1 việc, muốn nâng cấp chỗ nào chỉ sửa chỗ đó):
  config.py   hằng số cấu hình: mô hình AI, API, giới hạn, thông báo lỗi
  prompts.py  nội dung prompt của trợ lý (giọng điệu, chính sách bán hàng)
  service.py  logic: tìm sản phẩm, dựng tin nhắn, gọi mô hình AI
  views.py    lớp HTTP: nhận request /api/chat/ và trả JSON cho giao diện chat
  urls.py     đường dẫn /api/chat/ của module (được include ở stdshop/urls.py)
"""
