from django.urls import path
from . import views

urlpatterns = [
    path('upload_mix/',views.upload_mix, name='upload_mix'),
    path('get_my_mixes/', views.get_my_mixes,name='get_my_mixes'),
    path('get_all_mixes/', views.get_all_mixes,name='get_all_mixes'),
    path('get_public_mix/<int:mix_id>/',views.get_public_mix,name='get_public_mix'),
    path('get_mix_detail/<int:mix_id>/', views.get_mix_detail,name='get_mix_detail'),
    path('get_mix_play_token/<int:mix_id>/',views.get_mix_play_token,name='get_mix_play_token'),
    path('play_mix_with_token/<str:token>/',views.play_mix_with_token,name='play_mix_with_token'),
    path('record_mix_stream/',views.record_mix_stream,name='record_mix_stream'),
    path('update_mix_stream/<str:session_id>/',views.update_mix_stream, name='update_mix_stream'),
    path('send_mix_tip/',views.send_mix_tip,name='send_mix_tip'),
    path('get_dj_mix_tips/',views.get_dj_mix_tips,name='get_dj_mix_tips'),
    path('get_mix_charts/',views.get_mix_charts,name='get_mix_charts'),
    path('admin_get_all_mixes/', views.admin_get_all_mixes,name='admin_get_all_mixes'),
    path('admin_moderate_mix/<int:mix_id>/',views.admin_moderate_mix,name='admin_moderate_mix'),
    path('delete_mix/<int:mix_id>/',views.delete_mix,name='delete_mix'),
    path('get_dj_analytics/',views.get_dj_analytics,name='get_dj_analytics'),
]