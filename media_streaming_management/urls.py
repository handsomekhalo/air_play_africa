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
    path('get_all_tracks_admin/', views.get_all_tracks_admin, name='get_all_tracks_admin'),
    path('moderate_track/<int:track_id>/', views.moderate_track, name='moderate_track'),
    path('initiate_topup/', views.initiate_topup, name='initiate_topup'),
    path('send_tip/', views.send_tip, name='send_tip'),
    path('request_withdrawal/', views.request_withdrawal, name='request_withdrawal'),
    path('get_my_withdrawals/', views.get_my_withdrawals, name='get_my_withdrawals'),
    path('admin_list_withdrawals/', views.admin_list_withdrawals, name='admin_list_withdrawals'),
    path('admin_process_withdrawal/<int:withdrawal_id>/', views.admin_process_withdrawal, name='admin_process_withdrawal'),
    path('get_credit_balance/', views.get_credit_balance, name='get_credit_balance'),
    path('get_artist_earnings/', views.get_artist_earnings, name='get_artist_earnings'),
    path('get_artist_revenue_timeseries/', views.get_artist_revenue_timeseries, name='get_artist_revenue_timeseries'),
    path('get_artist_track_earnings/', views.get_artist_track_earnings, name='get_artist_track_earnings'),
    path('get_artist_tips/', views.get_artist_tips, name='get_artist_tips'),
    path('merit_score_charts/', views.merit_score_charts, name='merit_score_charts'),


    

]
