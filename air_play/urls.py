"""
URL configuration for air_play project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
# from django.contrib import admin
# from django.urls import path

# urlpatterns = [
#     path('admin/', admin.site.urls),
# ]
from django.contrib import admin
from django.shortcuts import redirect
from django.urls import path , include, re_path, include
from system_management import views


urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.login_view),  # Root URL will redirect to Next.js landing page

    path('system_management/', include('system_management.urls')),
    path('system_management_api/', include('system_management.api.urls')),
    path('media_streaming_management/', include('media_streaming_management.urls')),
    path('media_streaming_management_api/', include('media_streaming_management.api.urls')),


    # path('question_management/', include('question_management.urls')),
    # path('question_management_api/', include('question_management.api.urls')),
    # path('application_management/', include('application_management.urls')),
    #  path('application_management_api/', include('application_management.api.urls')),
    # path('form_portal_management/', include('form_portal_management.urls')),
    # path('form_portal_management_api/', include('form_portal_management.api.urls')),

]
