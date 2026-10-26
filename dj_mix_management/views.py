import json
import requests
from django.http import JsonResponse, StreamingHttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.urls import reverse_lazy
from system_management.general_func_classes import host_url


@csrf_exempt
def upload_mix(request):
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)
    try:
        auth_header = request.headers.get('Authorization', '')
        token = None
        if auth_header.startswith('Token '): token = auth_header.split('Token ')[-1]
        elif auth_header.startswith('Bearer '): token = auth_header.split('Bearer ')[-1]
        if not token:
            return JsonResponse({'status': 'error', 'message': 'Authorization token required.'}, status=401)

        url = f"{host_url()}{reverse_lazy('upload_mix_api')}"
        print(f"🔹 Upload Mix → {url}")

        response = requests.post(
            url,
            files={key: (f.name, f.read(), f.content_type) for key, f in request.FILES.items()},
            data=request.POST,
            headers={'Authorization': f'Token {token}'},
            timeout=300,
        )
        return JsonResponse(response.json(), status=response.status_code)
    except Exception as e:
        print(f"❌ upload_mix error: {e}")
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@csrf_exempt
def get_my_mixes(request):
    if request.method != 'GET':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)
    try:
        auth_header = request.headers.get('Authorization', '')
        token = None
        if auth_header.startswith('Token '): token = auth_header.split('Token ')[-1]
        elif auth_header.startswith('Bearer '): token = auth_header.split('Bearer ')[-1]
        if not token:
            return JsonResponse({'status': 'error', 'message': 'Authorization token required.'}, status=401)

        url = f"{host_url()}{reverse_lazy('get_my_mixes_api')}"
        response = requests.get(url, headers={'Authorization': f'Token {token}'}, timeout=30)
        return JsonResponse(response.json(), status=response.status_code)
    except Exception as e:
        print(f"❌ get_my_mixes error: {e}")
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@csrf_exempt
def get_all_mixes(request):
    if request.method != 'GET':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)
    try:
        url = f"{host_url()}{reverse_lazy('get_all_mixes_api')}"
        query_params = request.GET.urlencode()
        if query_params:
            url = f"{url}?{query_params}"
        response = requests.get(url, timeout=30)
        return JsonResponse(response.json(), status=response.status_code)
    except Exception as e:
        print(f"❌ get_all_mixes error: {e}")
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@csrf_exempt
def get_public_mix(request, mix_id):
    if request.method != 'GET':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)
    try:
        url = f"{host_url()}{reverse_lazy('get_public_mix_api', kwargs={'mix_id': mix_id})}"
        response = requests.get(url, timeout=30)
        return JsonResponse(response.json(), status=response.status_code)
    except Exception as e:
        print(f"❌ get_public_mix error: {e}")
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@csrf_exempt
def get_mix_detail(request, mix_id):
    if request.method != 'GET':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)
    try:
        auth_header = request.headers.get('Authorization', '')
        token = None
        if auth_header.startswith('Token '): token = auth_header.split('Token ')[-1]
        elif auth_header.startswith('Bearer '): token = auth_header.split('Bearer ')[-1]
        if not token:
            return JsonResponse({'status': 'error', 'message': 'Authorization token required.'}, status=401)

        url = f"{host_url()}{reverse_lazy('get_mix_detail_api', kwargs={'mix_id': mix_id})}"
        response = requests.get(url, headers={'Authorization': f'Token {token}'}, timeout=30)
        return JsonResponse(response.json(), status=response.status_code)
    except Exception as e:
        print(f"❌ get_mix_detail error: {e}")
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@csrf_exempt
def get_mix_play_token(request, mix_id):
    if request.method != 'GET':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)
    try:
        url = f"{host_url()}{reverse_lazy('get_mix_play_token_api', kwargs={'mix_id': mix_id})}"
        response = requests.get(url, timeout=30)
        return JsonResponse(response.json(), status=response.status_code)
    except Exception as e:
        print(f"❌ get_mix_play_token error: {e}")
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@csrf_exempt
def play_mix_with_token(request, token):
    """Streams mix audio — proxies directly, no JSON response."""
    if request.method != 'GET':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)
    try:
        url = f"{host_url()}{reverse_lazy('play_mix_with_token_api', kwargs={'token': token})}"
        headers = {}
        if 'HTTP_RANGE' in request.META:
            headers['Range'] = request.META['HTTP_RANGE']

        response = requests.get(url, headers=headers, stream=True, timeout=300)

        streaming_response = StreamingHttpResponse(
            response.iter_content(chunk_size=8192),
            status=response.status_code,
            content_type=response.headers.get('Content-Type', 'audio/mpeg'),
        )
        for header in ['Content-Length', 'Content-Range', 'Accept-Ranges']:
            if header in response.headers:
                streaming_response[header] = response.headers[header]
        return streaming_response
    except Exception as e:
        print(f"❌ play_mix_with_token error: {e}")
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@csrf_exempt
def record_mix_stream(request):
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)
    try:
        url = f"{host_url()}{reverse_lazy('record_mix_stream_api')}"
        body = json.loads(request.body or '{}')
        headers = {'Content-Type': 'application/json'}
        auth_header = request.headers.get('Authorization', '')
        if auth_header:
            headers['Authorization'] = auth_header
        response = requests.post(url, json=body, headers=headers, timeout=30)
        return JsonResponse(response.json(), status=response.status_code)
    except Exception as e:
        print(f"❌ record_mix_stream error: {e}")
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@csrf_exempt
def update_mix_stream(request, session_id):
    if request.method != 'PATCH':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)
    try:
        url = f"{host_url()}{reverse_lazy('update_mix_stream_api', kwargs={'session_id': session_id})}"
        body = json.loads(request.body or '{}')
        response = requests.patch(url, json=body, headers={'Content-Type': 'application/json'}, timeout=30)
        return JsonResponse(response.json(), status=response.status_code)
    except Exception as e:
        print(f"❌ update_mix_stream error: {e}")
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@csrf_exempt
def send_mix_tip(request):
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)
    try:
        auth_header = request.headers.get('Authorization', '')
        token = None
        if auth_header.startswith('Token '): token = auth_header.split('Token ')[-1]
        elif auth_header.startswith('Bearer '): token = auth_header.split('Bearer ')[-1]
        if not token:
            return JsonResponse({'status': 'error', 'message': 'Authorization token required.'}, status=401)

        body = json.loads(request.body or '{}')
        url  = f"{host_url()}{reverse_lazy('send_mix_tip_api')}"
        response = requests.post(
            url, json=body,
            headers={'Authorization': f'Token {token}', 'Content-Type': 'application/json'},
            timeout=30
        )
        return JsonResponse(response.json(), status=response.status_code)
    except Exception as e:
        print(f"❌ send_mix_tip error: {e}")
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@csrf_exempt
def get_dj_mix_tips(request):
    if request.method != 'GET':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)
    try:
        auth_header = request.headers.get('Authorization', '')
        token = None
        if auth_header.startswith('Token '): token = auth_header.split('Token ')[-1]
        elif auth_header.startswith('Bearer '): token = auth_header.split('Bearer ')[-1]
        if not token:
            return JsonResponse({'status': 'error', 'message': 'Authorization token required.'}, status=401)

        url = f"{host_url()}{reverse_lazy('get_dj_mix_tips_api')}"
        response = requests.get(url, headers={'Authorization': f'Token {token}'}, timeout=30)
        return JsonResponse(response.json(), status=response.status_code)
    except Exception as e:
        print(f"❌ get_dj_mix_tips error: {e}")
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@csrf_exempt
def get_mix_charts(request):
    if request.method != 'GET':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)
    try:
        url = f"{host_url()}{reverse_lazy('get_mix_charts_api')}"
        query_params = request.GET.urlencode()
        if query_params:
            url = f"{url}?{query_params}"
        response = requests.get(url, timeout=30)
        return JsonResponse(response.json(), status=response.status_code)
    except Exception as e:
        print(f"❌ get_mix_charts error: {e}")
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@csrf_exempt
def admin_get_all_mixes(request):
    if request.method != 'GET':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)
    try:
        auth_header = request.headers.get('Authorization', '')
        token = None
        if auth_header.startswith('Token '): token = auth_header.split('Token ')[-1]
        elif auth_header.startswith('Bearer '): token = auth_header.split('Bearer ')[-1]
        if not token:
            return JsonResponse({'status': 'error', 'message': 'Authorization token required.'}, status=401)

        url = f"{host_url()}{reverse_lazy('admin_get_all_mixes_api')}"
        response = requests.get(url, headers={'Authorization': f'Token {token}'}, timeout=30)
        return JsonResponse(response.json(), status=response.status_code)
    except Exception as e:
        print(f"❌ admin_get_all_mixes error: {e}")
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@csrf_exempt
def admin_moderate_mix(request, mix_id):
    if request.method != 'PATCH':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)
    try:
        auth_header = request.headers.get('Authorization', '')
        token = None
        if auth_header.startswith('Token '): token = auth_header.split('Token ')[-1]
        elif auth_header.startswith('Bearer '): token = auth_header.split('Bearer ')[-1]
        if not token:
            return JsonResponse({'status': 'error', 'message': 'Authorization token required.'}, status=401)

        body = json.loads(request.body or '{}')
        url  = f"{host_url()}{reverse_lazy('admin_moderate_mix_api', kwargs={'mix_id': mix_id})}"
        response = requests.patch(
            url, json=body,
            headers={'Authorization': f'Token {token}', 'Content-Type': 'application/json'},
            timeout=30
        )
        return JsonResponse(response.json(), status=response.status_code)
    except Exception as e:
        print(f"❌ admin_moderate_mix error: {e}")
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@csrf_exempt
def delete_mix(request, mix_id):
    if request.method != 'DELETE':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)
    try:
        auth_header = request.headers.get('Authorization', '')
        token = None
        if auth_header.startswith('Token '): token = auth_header.split('Token ')[-1]
        elif auth_header.startswith('Bearer '): token = auth_header.split('Bearer ')[-1]
        if not token:
            return JsonResponse({'status': 'error', 'message': 'Authorization token required.'}, status=401)

        url = f"{host_url()}{reverse_lazy('delete_mix_api', kwargs={'mix_id': mix_id})}"
        response = requests.delete(url, headers={'Authorization': f'Token {token}'}, timeout=30)
        return JsonResponse(response.json(), status=response.status_code)
    except Exception as e:
        print(f"❌ delete_mix error: {e}")
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@csrf_exempt
def get_dj_analytics(request):
    if request.method != 'GET':
        return JsonResponse({
            'status': 'error',
            'message': 'Method not allowed'
        }, status=405)

    try:
        url = (
            f"{host_url()}"
            f"{reverse_lazy('get_dj_analytics_api')}"
        )

        headers = {}

        auth_header = request.headers.get('Authorization', '')

        if auth_header:
            headers['Authorization'] = auth_header

        response = requests.get(
            url,
            headers=headers,
            timeout=30
        )

        return JsonResponse(
            response.json(),
            status=response.status_code
        )

    except Exception as e:
        print(f"DJ analytics error: {e}")

        return JsonResponse({
            'status': 'error',
            'message': 'Unable to retrieve DJ analytics.'
        }, status=500)
