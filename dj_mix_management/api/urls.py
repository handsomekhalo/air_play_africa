"""Urls for the api views of system_management app"""
from django.urls import path
import media_streaming_management.api.views as views
from django.urls import re_path

from . import views


# 1. initiate_topup        ← listener buys credits via Paystack
# 2. verify_topup_webhook  ← Paystack calls this to confirm payment
#                             credits land in CreditAccount after this
# 3. send_tip              ← instant, no Paystack, just moves credits
# 4. get_artist_earnings   ← artist sees their balance
# 5. request_withdrawal    ← artist cashes out (later)

urlpatterns = [

    path('upload_mix_api/', views.upload_mix_api, name='upload_mix_api'),
    path('get_my_mixes_api/', views.get_my_mixes_api, name='get_my_mixes_api'),
    path('get_all_mixes_api/', views.get_all_mixes_api, name='get_all_mixes_api'),
    path('get_public_mix_api/<int:mix_id>/', views.get_public_mix_api, name='get_public_mix_api'),
    path('get_mix_play_token_api/<int:mix_id>/', views.get_mix_play_token_api, name='get_mix_play_token_api'),    
    path('get_mix_detail_api/<int:mix_id>/', views.get_mix_detail_api, name='get_mix_detail_api'),
    path('play_mix_with_token_api/<str:token>/', views.play_mix_with_token_api, name='play_mix_with_token_api'),
    #check above api 
    path('record_mix_stream_api/', views.record_mix_stream_api, name='record_mix_stream_api'),
    path('update_mix_stream_api/<str:session_id>/', views.update_mix_stream_api, name='update_mix_stream_api'),
    path('send_mix_tip_api/', views.send_mix_tip_api, name='send_mix_tip_api'),
    path('get_dj_mix_tips_api/', views.get_dj_mix_tips_api, name='get_dj_mix_tips_api'),
    path('get_mix_charts_api/', views.get_mix_charts_api, name='get_mix_charts_api'),
    path('admin_moderate_mix_api/<int:mix_id>/', views.admin_moderate_mix_api, name='admin_moderate_mix_api'),
    path('delete_mix_api/<int:mix_id>/', views.delete_mix_api, name='delete_mix_api'),




    ]