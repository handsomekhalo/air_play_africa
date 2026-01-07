from django.http import JsonResponse
from django.shortcuts import render
from django.urls import reverse
import requests

from system_management.general_func_classes import host_url
from django.views.decorators.csrf import ensure_csrf_cookie
from django.urls import reverse, reverse_lazy
from django.views.decorators.csrf import csrf_exempt
# Create your views here.

@csrf_exempt
def upload_track(request):

    print("🚀 upload_track called")
    """
    Proxy view to upload a track (multipart/form-data).
    Forwards request to DRF upload_track_api.
    """

    if request.method != "POST":
        return JsonResponse({
            "status": "error",
            "message": "Method not allowed"
        }, status=405)

    try:
        # 1. Extract token
        auth_header = request.headers.get("Authorization", "")
        token = None

        if auth_header.startswith("Token "):
            token = auth_header.split("Token ")[-1]
        elif auth_header.startswith("Bearer "):
            token = auth_header.split("Bearer ")[-1]

        if not token:
            return JsonResponse({
                "status": "error",
                "message": "Authorization token is required."
            }, status=401)

        # 2. Prepare headers (DO NOT set Content-Type manually for multipart)
        headers = {
            "Authorization": f"Token {token}"
        }

        # 3. Build API URL
        url_path = reverse_lazy("upload_track_api")
        upload_url = f"{host_url(request)}{url_path}"

        # 4. Forward files
        files = {}
        if "audio_file" in request.FILES:
            audio = request.FILES["audio_file"]
            files["audio_file"] = (audio.name, audio, audio.content_type)

        if "cover_image" in request.FILES:
            cover = request.FILES["cover_image"]
            files["cover_image"] = (cover.name, cover, cover.content_type)

        # 5. Forward form fields
        data = request.POST.dict()

        # 6. Call DRF API
        response = requests.post(
            upload_url,
            headers=headers,
            data=data,
            files=files,
            timeout=120
        )

        # 7. Handle API errors
        if response.status_code not in (200, 201):
            return JsonResponse({
                "status": "error",
                "message": f"API returned {response.status_code}",
                "details": response.text
            }, status=response.status_code)

        # 8. Success response
        return JsonResponse(
            response.json(),
            status=response.status_code,
            safe=False
        )

    except requests.exceptions.RequestException as e:
        print("❌ Request Exception:", str(e))
        return JsonResponse({
            "status": "error",
            "message": f"Request failed: {str(e)}"
        }, status=500)

    except Exception as e:
        print("❌ General Exception:", str(e))
        return JsonResponse({
            "status": "error",
            "message": f"Server error: {str(e)}"
        }, status=500)