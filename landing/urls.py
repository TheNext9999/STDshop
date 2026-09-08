from django.urls import path
from . import views

app_name = 'landing'

urlpatterns = [
    path('', views.landing_home, name='landing_home'),
    path('user/', views.landing_user, name='landing_user'),
    path('seller/', views.landing_seller, name='landing_seller'),
]