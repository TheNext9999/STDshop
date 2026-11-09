"""
AI/urls.py
Đường dẫn của module AI. Được include ở stdshop/urls.py:  path('', include('AI.urls'))
Giữ nguyên đường dẫn /api/chat/ và tên 'chat_ai' như trước nên giao diện chat không phải sửa gì.
"""

from django.urls import path

from . import views

urlpatterns = [
    path('api/chat/', views.chat_ai, name='chat_ai'),
]
