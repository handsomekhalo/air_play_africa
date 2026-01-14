"""Urls for the api views of system_management app"""
from django.urls import path
import media_streaming_management.api.views as views
from django.urls import re_path

from system_management.api.api_helpers import send_email_api



urlpatterns = [

    path('upload_track_api/', views.upload_track_api, name='upload_track_api'),
    path('retrieve_track_api/<int:track_id>/', views.retrieve_track_api, name='retrieve_track_api'),
    path('retrieve_all_tracks_api/', views.retrieve_all_tracks_api, name='retrieve_all_tracks_api'),
    path('my_tracks_api/', views.my_tracks_api, name='my_tracks_api'),
    path('record_stream_api/', views.record_stream_api, name='record_stream_api'),
    path('update_stream_api/<str:session_id>/', views.update_stream_api, name='update_stream_api'),
    path('proxy_play_track_api/<int:track_id>/', views.proxy_play_track_api, name='proxy_play_track_api'),
    path('get_play_token_api/<int:track_id>/', views.get_play_token_api, name='get_play_token_api'),
    # path('play_with_token_api/<str:token>/', views.play_with_token_api, name='play_with_token_api'),
    re_path(r'^play_with_token_api/(?P<token>.+)/$',views.play_with_token_api,name='play_with_token_api')

]
