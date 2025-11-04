"""Urls for the api views of system_management app"""
from django.urls import path
import system_management.api.views as views
from system_management.api.api_helpers import send_email_api



urlpatterns = [

    # path('register_api/', views.register_api, name='register_api'),
    path('login_api/', views.login_api, name="login_api"),

]
