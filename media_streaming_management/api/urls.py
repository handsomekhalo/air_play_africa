"""Urls for the api views of system_management app"""
from django.urls import path
import media_streaming_management.api.views as views

from system_management.api.api_helpers import send_email_api



urlpatterns = [

<<<<<<< HEAD
    path('upload_track_api/', views.upload_track_api, name='upload_track_api'),
  
=======
    path('register_artist_api/', views.register_artist_api, name='register_artist_api'),
    path('register_listener_api/', views.register_listener_api, name='register_listener_api'),
    path('get_artist_api/', views.get_artist_api, name="get_artist_api"),
    path('get_user_types_api/', views.get_user_types_api, name="get_user_types_api"),
    path('get_all_users_api/', views.get_all_users_api, name="get_all_users_api"),
    path('get_artist_profile_api/', views.get_artist_profile_api, name="get_artist_profile_api"),
    path('update_artist_profile_api/', views.update_artist_profile_api, name="update_artist_profile_api"),




   
>>>>>>> 7c24009ebcb6078cb604e4141a1f3d139bbf393e

]
