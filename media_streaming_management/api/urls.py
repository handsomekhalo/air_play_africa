"""Urls for the api views of system_management app"""
from django.urls import path
import media_streaming_management.api.views as views

from system_management.api.api_helpers import send_email_api



urlpatterns = [

    path('upload_track_api/', views.upload_track_api, name='upload_track_api'),

]
