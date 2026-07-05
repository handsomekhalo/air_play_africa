"""Urls for the api views of system_management app"""
from django.urls import path
import media_streaming_management.api.views as views
from django.urls import re_path

from system_management.api.api_helpers import send_email_api


# 1. initiate_topup        ← listener buys credits via Paystack
# 2. verify_topup_webhook  ← Paystack calls this to confirm payment
#                             credits land in CreditAccount after this
# 3. send_tip              ← instant, no Paystack, just moves credits
# 4. get_artist_earnings   ← artist sees their balance
# 5. request_withdrawal    ← artist cashes out (later)

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
    path('get_listener_play_token/<int:track_id>/',views.get_listener_play_token_api,name='get_listener_play_token_api'),
    path('get_all_tracks_admin_api/', views.get_all_tracks_admin_api, name='get_all_tracks_admin_api'),
    path('moderate_track_api/<int:track_id>/', views.moderate_track_api, name='moderate_track_api'),
    re_path(r'^play_with_token_api/(?P<token>.+)/$',views.play_with_token_api,name='play_with_token_api'),
    path('initiate_topup_api/', views.initiate_topup_api, name='initiate_topup_api'),
    path('send_tip_api/', views.send_tip_api, name='send_tip_api'),
    path('verify_topup_webhook/', views.verify_topup_webhook, name='verify_topup_webhook'),
    path('get_artist_earnings_api/', views.get_artist_earnings_api, name='get_artist_earnings_api'),
    path('get_credit_balance_api/', views.get_credit_balance_api, name='get_credit_balance_api'),
    path('request_withdrawal_api/', views.request_withdrawal_api, name='request_withdrawal_api'),
    path('get_my_withdrawals_api/', views.get_my_withdrawals_api, name='get_my_withdrawals_api'),
    path('admin_process_withdrawal_api/<int:withdrawal_id>/', views.admin_process_withdrawal_api, name='admin_process_withdrawal_api'),
    path('get_artist_revenue_timeseries_api/', views.get_artist_revenue_timeseries_api, name='get_artist_revenue_timeseries_api'),
    path('get_artist_track_earnings_api/', views.get_artist_track_earnings_api, name='get_artist_track_earnings_api'),
    path('get_public_track_api/<int:track_id>/', views.get_public_track_api, name='get_public_track_api'),
    path('admin_list_withdrawals_api/', views.admin_list_withdrawals_api, name='admin_list_withdrawals_api'),
    ]
    