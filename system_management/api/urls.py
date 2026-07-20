"""Urls for the api views of system_management app"""
from django.urls import path
import system_management.api.views as views
from system_management.api.api_helpers import send_email_api



urlpatterns = [

    path('login_api/', views.login_api, name="login_api"),
    path('register_user_api/', views.register_user_api, name='register_user_api'),
     path('register_artist_api/', views.register_artist_api, name='register_artist_api'),
    path('register_listener_api/', views.register_listener_api, name='register_listener_api'),
    path('get_artist_api/', views.get_artist_api, name="get_artist_api"),
    path('get_user_types_api/', views.get_user_types_api, name="get_user_types_api"),
    path('get_all_users_api/', views.get_all_users_api, name="get_all_users_api"),
    path('get_artist_profile_api/', views.get_artist_profile_api, name="get_artist_profile_api"),
    # path('update_artist_profile_api/', views.update_artist_profile_api, name="update_artist_profile_api"),
    path('update_profile_api/', views.update_profile_api, name="update_profile_api"),
    path('update_admin_profile_api/', views.update_admin_profile_api, name="update_admin_profile_api"),
    # path('artist_onboarding_api/', views.artist_onboarding_api, name="artist_onboarding_api"),
    path('artist_onboarding_step_1_api/', views.artist_onboarding_step_1_api, name="artist_onboarding_step_1_api"),
    path('artist_onboarding_step_2_api/', views.artist_onboarding_step_2_api, 
         name="artist_onboarding_step_2_api"),
    path('get_all_admins_api/', views.get_all_admins_api, name="get_all_admins_api"),
    path('get_all_artists_api/', views.get_all_artists_api, name="get_all_artists_api"),
    path('toggle_user_active_api/<int:user_id>/', views.toggle_user_active_api, name="toggle_user_active_api"),
    path('get_admin_overview_api/', views.get_admin_overview_api, name='get_admin_overview_api'),
    path('create_admin_api/', views.create_admin_api, name='create_admin_api'),
    path('get_admin_profile_api/', views.get_admin_profile_api, name='get_admin_profile_api'),
    path('logout_api/', views.logout_api, name='logout_api'),
    path('get_listener_profile_api/', views.get_listener_profile_api, name='get_listener_profile_api'),
    # path('get_listener_profile_api/<int:listener_id>/', views.get_listener_profile_api, name="get_listener_profile_api"),

    # path('get_artist_profile_api/<int:artist_id>/', views.ystem_management_api/artist_onboarding_step_1_api/, name="get_artist_profile_api"),
    # path('get_listener_profile_api/<int:listener_id>/', views.get_listener_profile_api, name="get_listener_profile_api"),
    # path('get_users_api/', views.get_users_api, name="get_users_api"),
    # path('get_user_types_api/', views.get_user_types_api, name="get_user_types_api"),
    # path('update_user_api/', views.update_user_api, name="update_user_api"),
    # path('create_users_api/', views.create_users_api, name="create_users_api"),

    # path('logout_api/', views.logout_api, name="logout_api"),
    # path('send_email_api/', send_email_api, name='send_email_api'),
    # path('delete_user_api/', views.delete_user_api, name='delete_user_api'),


]
