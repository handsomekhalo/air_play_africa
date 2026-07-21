import json
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
        return JsonResponse({
            "status": "error",
            "message": f"Request failed: {str(e)}"
        }, status=500)

    except Exception as e:
        return JsonResponse({
            "status": "error",
            "message": f"Server error: {str(e)}"
        }, status=500)



@csrf_exempt
def my_tracks(request):
    """
    Proxy view to fetch authenticated artist's tracks.
    Forwards request to DRF my_tracks_api.
    """


    if request.method != "GET":
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

        # 2. Prepare headers
        headers = {
            "Authorization": f"Token {token}"
        }

        # 3. Build API URL
        url_path = reverse_lazy("my_tracks_api")
        api_url = f"{host_url(request)}{url_path}"

        # 4. Forward request
        response = requests.get(
            api_url,
            headers=headers,
            timeout=30
        )

        # 5. Handle API errors
        if response.status_code != 200:
            return JsonResponse({
                "status": "error",
                "message": f"API returned {response.status_code}",
                "details": response.text
            }, status=response.status_code)

        # 6. Success
        return JsonResponse(
            response.json(),
            status=response.status_code,
            safe=False
        )

    except requests.exceptions.RequestException as e:
        return JsonResponse({
            "status": "error",
            "message": f"Request failed: {str(e)}"
        }, status=500)

    except Exception as e:
        return JsonResponse({
            "status": "error",
            "message": f"Server error: {str(e)}"
        }, status=500)


@csrf_exempt
def proxy_get_play_token(request, track_id):
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        # 1. Extract token
        auth_header = request.headers.get("Authorization", "")
        token = None

        if auth_header.startswith("Token "):
            token = auth_header.split("Token ")[-1]
        elif auth_header.startswith("Bearer "):
            token = auth_header.split("Bearer ")[-1]

        if not token:
            return JsonResponse({"error": "Auth token required"}, status=401)

        # 2. Forward to DRF
        headers = {
            "Authorization": f"Token {token}"
        }

        api_url = (
            f"{host_url(request)}"
            f"{reverse_lazy('get_play_token_api', args=[track_id])}"
        )

        response = requests.get(api_url, headers=headers, timeout=15)

        if response.status_code != 200:
            return JsonResponse({
                "error": "API error",
                "details": response.text
            }, status=response.status_code)

        return JsonResponse(response.json(), safe=False)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)



@csrf_exempt
def retrieve_all_tracks(request):
    """
    Proxy view to retrieve all ready tracks.
    Supports optional query params: ?genre=&mood=&artist=
    """
    if request.method != "GET":
        return JsonResponse({
            "status": "error",
            "message": "Method not allowed"
        }, status=405)

    try:
        # 1️⃣ Build API URL — preserve any query params from the original request
        url_path = reverse_lazy("retrieve_all_tracks_api")
        api_url = f"{host_url(request)}{url_path}"

        # Forward query params (?genre=afrobeat&mood=happy etc.)
        query_params = request.GET.urlencode()
        if query_params:
            api_url = f"{api_url}?{query_params}"

        # 2️⃣ Forward request — no auth header needed (AllowAny)
        response = requests.get(api_url, timeout=30)

        # 3️⃣ Handle errors
        if response.status_code != 200:
            return JsonResponse({
                "status": "error",
                "message": "Failed to retrieve tracks",
                "details": response.text
            }, status=response.status_code)

        # 4️⃣ Success
        return JsonResponse(response.json(), status=200)

    except requests.exceptions.RequestException as e:
        return JsonResponse({
            "status": "error",
            "message": f"Request failed: {str(e)}"
        }, status=500)

    except Exception as e:
        return JsonResponse({
            "status": "error",
            "message": f"Server error: {str(e)}"
        }, status=500)
    

@csrf_exempt
def get_all_tracks_admin(request):
    """Proxy — get all tracks for admin."""
    if request.method != 'GET':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)
    try:
        auth_header = request.headers.get('Authorization', '')
        token = None
        if auth_header.startswith('Token '):
            token = auth_header.split('Token ')[-1]
        elif auth_header.startswith('Bearer '):
            token = auth_header.split('Bearer ')[-1]
        if not token:
            return JsonResponse({'status': 'error', 'message': 'Authorization token required.'}, status=401)

        url = f"{host_url(request)}{reverse_lazy('get_all_tracks_admin_api')}"
        response = requests.get(url, headers={'Authorization': f'Token {token}'}, timeout=30)
        return JsonResponse(response.json(), status=response.status_code)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@csrf_exempt
def moderate_track(request, track_id):
    """Proxy — approve or reject a track."""
    if request.method != 'PATCH':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)
    try:
        auth_header = request.headers.get('Authorization', '')
        token = None
        if auth_header.startswith('Token '):
            token = auth_header.split('Token ')[-1]
        elif auth_header.startswith('Bearer '):
            token = auth_header.split('Bearer ')[-1]
        if not token:
            return JsonResponse({'status': 'error', 'message': 'Authorization token required.'}, status=401)

        body = json.loads(request.body or '{}')
        url = f"{host_url(request)}{reverse_lazy('moderate_track_api', kwargs={'track_id': track_id})}"
        response = requests.patch(url, json=body, headers={
            'Authorization': f'Token {token}',
            'Content-Type': 'application/json',
        }, timeout=30)
        return JsonResponse(response.json(), status=response.status_code)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    

@csrf_exempt
def initiate_topup(request):
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)
    try:
        auth_header = request.headers.get('Authorization', '')
        token = None
        if auth_header.startswith('Token '):
            token = auth_header.split('Token ')[-1]
        elif auth_header.startswith('Bearer '):
            token = auth_header.split('Bearer ')[-1]
        if not token:
            return JsonResponse({'status': 'error', 'message': 'Authorization token required.'}, status=401)

        body = json.loads(request.body or '{}')
        url = f"{host_url(request)}{reverse_lazy('initiate_topup_api')}"
        response = requests.post(url, json=body, headers={
            'Authorization': f'Token {token}',
            'Content-Type': 'application/json',
        }, timeout=30)
        return JsonResponse(response.json(), status=response.status_code)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    


@csrf_exempt
def send_tip(request):
    """Proxy — listener tips a track using credits."""
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)
    try:
        auth_header = request.headers.get('Authorization', '')
        token = None
        if auth_header.startswith('Token '):
            token = auth_header.split('Token ')[-1]
        elif auth_header.startswith('Bearer '):
            token = auth_header.split('Bearer ')[-1]
        if not token:
            return JsonResponse({'status': 'error', 'message': 'Authorization token required.'}, status=401)

        body = json.loads(request.body or '{}')
        url = f"{host_url(request)}{reverse_lazy('send_tip_api')}"
        response = requests.post(url, json=body, headers={
            'Authorization': f'Token {token}',
            'Content-Type': 'application/json',
        }, timeout=30)
        return JsonResponse(response.json(), status=response.status_code)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@csrf_exempt
def get_credit_balance(request):
    if request.method != 'GET':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)
    try:
        auth_header = request.headers.get('Authorization', '')
        token = None
        if auth_header.startswith('Token '):
            token = auth_header.split('Token ')[-1]
        elif auth_header.startswith('Bearer '):
            token = auth_header.split('Bearer ')[-1]
        if not token:
            return JsonResponse({'status': 'error', 'message': 'Authorization token required.'}, status=401)

        url = f"{host_url(request)}{reverse_lazy('get_credit_balance_api')}"
        response = requests.get(url, headers={'Authorization': f'Token {token}'}, timeout=30)
        return JsonResponse(response.json(), status=response.status_code)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@csrf_exempt
def get_artist_earnings(request):
    if request.method != 'GET':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)
    try:
        auth_header = request.headers.get('Authorization', '')
        token = None
        if auth_header.startswith('Token '):
            token = auth_header.split('Token ')[-1]
        elif auth_header.startswith('Bearer '):
            token = auth_header.split('Bearer ')[-1]
        if not token:
            return JsonResponse({'status': 'error', 'message': 'Authorization token required.'}, status=401)

        url = f"{host_url(request)}{reverse_lazy('get_artist_earnings_api')}"
        response = requests.get(url, headers={'Authorization': f'Token {token}'}, timeout=30)
        return JsonResponse(response.json(), status=response.status_code)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


# ═══════════════════════════════════════════════════════════════
# ADD ALL FOUR to system_management/views.py
# Same pattern as send_tip / get_credit_balance — token extraction,
# forward to media_streaming_management_api, return response.
# ═══════════════════════════════════════════════════════════════

@csrf_exempt
def request_withdrawal(request):
    """Proxy — artist requests a withdrawal."""
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)
    try:
        auth_header = request.headers.get('Authorization', '')
        token = None
        if auth_header.startswith('Token '):
            token = auth_header.split('Token ')[-1]
        elif auth_header.startswith('Bearer '):
            token = auth_header.split('Bearer ')[-1]
        if not token:
            return JsonResponse({'status': 'error', 'message': 'Authorization token required.'}, status=401)

        body = json.loads(request.body or '{}')
        url = f"{host_url(request)}{reverse_lazy('request_withdrawal_api')}"
        response = requests.post(url, json=body, headers={
            'Authorization': f'Token {token}',
            'Content-Type': 'application/json',
        }, timeout=30)
        return JsonResponse(response.json(), status=response.status_code)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@csrf_exempt
def get_my_withdrawals(request):
    """Proxy — artist views their withdrawal history."""
    if request.method != 'GET':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)
    try:
        auth_header = request.headers.get('Authorization', '')
        token = None
        if auth_header.startswith('Token '):
            token = auth_header.split('Token ')[-1]
        elif auth_header.startswith('Bearer '):
            token = auth_header.split('Bearer ')[-1]
        if not token:
            return JsonResponse({'status': 'error', 'message': 'Authorization token required.'}, status=401)

        url = f"{host_url(request)}{reverse_lazy('get_my_withdrawals_api')}"
        response = requests.get(url, headers={'Authorization': f'Token {token}'}, timeout=30)
        return JsonResponse(response.json(), status=response.status_code)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)




@csrf_exempt
def admin_list_withdrawals(request):
    if request.method != 'GET':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)
    try:
        auth_header = request.headers.get('Authorization', '')
        token = None
        if auth_header.startswith('Token '):
            token = auth_header.split('Token ')[-1]
        elif auth_header.startswith('Bearer '):
            token = auth_header.split('Bearer ')[-1]
        if not token:
            return JsonResponse({'status': 'error', 'message': 'Authorization token required.'}, status=401)

        url = f"{host_url()}{reverse_lazy('admin_list_withdrawals_api')}"
        print(f"🔹 Admin List Withdrawals → {url}")

        query_params = request.GET.urlencode()
        if query_params:
            url = f"{url}?{query_params}"

        response = requests.get(url, headers={'Authorization': f'Token {token}'}, timeout=30)
        return JsonResponse(response.json(), status=response.status_code)

    except Exception as e:
        print(f"❌ admin_list_withdrawals error: {e}")  # ← this will show the real cause
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@csrf_exempt
def admin_process_withdrawal(request, withdrawal_id):
    if request.method != 'PATCH':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)
    try:
        auth_header = request.headers.get('Authorization', '')
        token = None
        if auth_header.startswith('Token '):
            token = auth_header.split('Token ')[-1]
        elif auth_header.startswith('Bearer '):
            token = auth_header.split('Bearer ')[-1]
        if not token:
            return JsonResponse({'status': 'error', 'message': 'Authorization token required.'}, status=401)

        body = json.loads(request.body or '{}')
        url = f"{host_url()}{reverse_lazy('admin_process_withdrawal_api', kwargs={'withdrawal_id': withdrawal_id})}"
        print(f"🔹 Admin Process Withdrawal → {url}")

        response = requests.patch(url, json=body, headers={
            'Authorization': f'Token {token}',
            'Content-Type': 'application/json',
        }, timeout=30)
        return JsonResponse(response.json(), status=response.status_code)

    except Exception as e:
        print(f"❌ admin_process_withdrawal error: {e}")
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

@csrf_exempt
def get_artist_revenue_timeseries(request):
    """
    Proxy view to fetch logged-in artist's 7-day revenue timeseries
    """

    print("🟢 Get Artist Revenue Timeseries Proxy called")

    if request.method != "GET":
        return JsonResponse({
            "status": "error",
            "message": "Method not allowed"
        }, status=405)

    try:
        # 1️⃣ Extract token
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

        # 2️⃣ Prepare headers
        headers = {
            "Authorization": f"Token {token}",
            "Content-Type": "application/json"
        }

        # 3️⃣ Build API URL
        url_path = reverse_lazy("get_artist_revenue_timeseries_api")
        # api_url = f"{host_url()}{url_path}"
        api_url = f"{host_url(request)}{url_path}"


        # 4️⃣ Forward request
        response = requests.get(
            api_url,
            headers=headers,
            timeout=30
        )


        # 5️⃣ Handle API errors
        if response.status_code != 200:
            return JsonResponse({
                "status": "error",
                "message": "API error",
                "details": response.text
            }, status=response.status_code)

        # 6️⃣ Success
        return JsonResponse(response.json(), status=response.status_code)

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


@csrf_exempt
def get_artist_track_earnings(request):
    """
    Proxy view to fetch per-track earnings breakdown for logged-in artist
    """
    print("🟢 Get Artist Track Earnings Proxy called")

    if request.method != "GET":
        return JsonResponse({
            "status": "error",
            "message": "Method not allowed"
        }, status=405)

    try:
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

        headers = {
            "Authorization": f"Token {token}",
            "Content-Type": "application/json"
        }

        url_path = reverse_lazy("get_artist_track_earnings_api")
        api_url = f"{host_url(request)}{url_path}"


        response = requests.get(
            api_url,
            headers=headers,
            timeout=30
        )


        if response.status_code != 200:
            return JsonResponse({
                "status": "error",
                "message": "API error",
                "details": response.text
            }, status=response.status_code)

        return JsonResponse(response.json(), status=response.status_code)

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

@csrf_exempt
def get_artist_tips(request):
    """Proxy — get artist's individual tip history."""
    if request.method != 'GET':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)
    try:
        auth_header = request.headers.get('Authorization', '')
        token = None
        if auth_header.startswith('Token '): token = auth_header.split('Token ')[-1]
        elif auth_header.startswith('Bearer '): token = auth_header.split('Bearer ')[-1]
        if not token:
            return JsonResponse({'status': 'error', 'message': 'Authorization token required.'}, status=401)

        url = f"{host_url()}{reverse_lazy('get_artist_tips_api')}"
        response = requests.get(
            url,
            headers={'Authorization': f'Token {token}'},
            timeout=30
        )
        return JsonResponse(response.json(), status=response.status_code)
    except Exception as e:
        print(f"❌ get_artist_tips error: {e}")
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    

@csrf_exempt
def merit_score_charts(request):
    """Proxy — weekly charts by merit score. No auth required."""
    if request.method != 'GET':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)
    try:
        limit = request.GET.get('limit', '20')
        url   = f"{host_url()}{reverse_lazy('discover_tracks_api')}?limit={limit}"
        response = requests.get(url, timeout=30)
        return JsonResponse(response.json(), status=response.status_code)
    except Exception as e:
        print(f"❌ charts error: {e}")
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)