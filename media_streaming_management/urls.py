"""Urls for the api views of system_management app"""
from django.urls import path
# from system_management.api.api_helpers import send_email_api
import media_streaming_management.views as views


urlpatterns = [

    path('upload_track/', views.upload_track, name="upload_track"),
    path("retrieve_all_tracks/", views.retrieve_all_tracks, name="retrieve_all_tracks"),
    path('my_tracks/', views.my_tracks, name="my_tracks"),
    path('proxy_get_play_token/<int:track_id>/', views.proxy_get_play_token, 
         name="proxy_get_play_token"),
    path('retrieve_all_tracks/', views.retrieve_all_tracks, name='retrieve_all_tracks'),

]
