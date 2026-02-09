import json
import secrets
import string
from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.middleware.csrf import get_token
from django.urls import reverse_lazy
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.csrf import csrf_exempt
import requests


from system_management.general_func_classes import api_connection, host_url



# Create your views here.
@ensure_csrf_cookie
def csrf(request):     
    """
    Sets the CSRF cookie and returns the token
    """
    token = get_token(request)
    return JsonResponse({'csrfToken': token})



def get_data_on_success(response_data):
    status = response_data.get('status')
    if status == 'success':
        data = response_data.get('data')
    else:
        data = []
    return data


def generate_password(length=12, include_digits=True, include_special_chars=True):
    letters = string.ascii_letters
    digits = string.digits if include_digits else ''
    special_chars = string.punctuation if include_special_chars else ''

    characters = letters + digits + special_chars

    length = max(length, 8)

    password = ''.join(secrets.choice(characters) for _ in range(length))

    return password



def set_csrf_token(request):
     response = JsonResponse({'detail': 'CSRF cookie set'})
     response.set_cookie('csrftoken', get_token(request)) 
     return response


# View that redirects to Next.js
def login_view(request):
    return redirect("http://localhost:3000/")  # Next.js is running here
    # return redirect('http://52.14.111.23:3000/')  # or your real domain

@csrf_exempt
def register_user(request):
    
    if request.method != 'POST':
        return JsonResponse({
            "status": "error",
            "message": "Method not allowed"
        }, status=405)

    try:
        # Parse request data
        data = json.loads(request.body)

        first_name = data.get('first_name')
        last_name = data.get('last_name')
        email = data.get('email')
        password = data.get('password')
        confirm_password = data.get('confirm_password')

        # Check if all fields are provided
        if not all([first_name, last_name, email, password, confirm_password]):
            return JsonResponse({
                "status": "error",
                "message": "All fields are required."
            }, status=400)

        # Check if password matches confirm_password
        if password != confirm_password:
            return JsonResponse({
                "status": "error",
                "message": "Passwords do not match."
            }, status=400)

        # Prepare API call to register user
        url = f"{host_url(request)}{reverse_lazy('register_api')}"
        payload = json.dumps({
            "first_name": first_name,
            "last_name": last_name,
            "email": email,
            "password": password,
            "confirm_password": confirm_password
        })

        headers = {
            'Content-Type': 'application/json',  # Ensure this is set correctly
        }

        # Make the API call via the api_connection helper
        response_data = api_connection(method="POST", url=url, headers=headers, data=payload)

        # Check the response from the registration API
        if response_data and response_data.get("status") == "success":
            return JsonResponse({
                "status": "success",
                "message": "User registered successfully",
                "user_id": response_data.get("user_id")
            })

        return JsonResponse({
            "status": "error",
            "message": response_data.get("message", "Registration failed"),
            "errors": response_data.get("errors", {})
        }, status=400)

    except json.JSONDecodeError:
        return JsonResponse({
            "status": "error",
            "message": "Invalid JSON data"
        }, status=400)
    except Exception as e:
        return JsonResponse({
            "status": "error",
            "message": f"Server error occurred: {str(e)}"
        }, status=500)
    


@csrf_exempt
def register_artist(request):
    print("🟢 Register Artist view called")
    """
    Public proxy view for Artist registration.
    Forwards request to DRF register_artist_api.
    """

    if request.method != 'POST':
        return JsonResponse({
            "status": "error",
            "message": "Method not allowed"
        }, status=405)

    try:
        data = json.loads(request.body)

        first_name = data.get('first_name')
        last_name = data.get('last_name')
        email = data.get('email')
        password = data.get('password')
        # confirm_password = data.get('confirm_password')

        # ✅ Basic validation
        if not all([first_name, last_name, email, password]):
            return JsonResponse({
                "status": "error",
                "message": "All fields are required."
            }, status=400)

        # if password != confirm_password:
            return JsonResponse({
                "status": "error",
                "message": "Passwords do not match."
            }, status=400)

        # 🔁 Forward to DRF Artist Registration API
        url = f"{host_url(request)}{reverse_lazy('register_artist_api')}"

        payload = json.dumps({
            "first_name": first_name,
            "last_name": last_name,
            "email": email,
            "password": password,
            # Optional fields (safe to pass empty)
            "bio": data.get("bio", ""),
            "location": data.get("location", ""),
            "wallet_address": data.get("wallet_address", "")
        })

        headers = {
            "Content-Type": "application/json"
        }

        response_data = api_connection(
            method="POST",
            url=url,
            headers=headers,
            data=payload
        )

        if response_data and response_data.get("status") == "success":
            return JsonResponse({
                "status": "success",
                "message": "Artist registered successfully",
                "artist": response_data.get("data")
            }, status=201)

        return JsonResponse({
            "status": "error",
            "message": response_data.get("message", "Registration failed"),
            "errors": response_data.get("errors", {})
        }, status=400)

    except json.JSONDecodeError:
        return JsonResponse({
            "status": "error",
            "message": "Invalid JSON data"
        }, status=400)

    except Exception as e:
        return JsonResponse({
            "status": "error",
            "message": f"Server error occurred: {str(e)}"
        }, status=500)


@csrf_exempt
def artist_onboarding_step_1(request):
    """
    Proxy view for Artist onboarding STEP 1.
    Saves bio & location, advances onboarding_step → 2.
    """

    print("🟢 Artist onboarding STEP 1 called")

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

        # 2. Parse body
        body = json.loads(request.body or "{}")

        # 3. Prepare headers
        headers = {
            "Authorization": f"Token {token}",
            "Content-Type": "application/json"
        }

        print("Headers:", headers)
        print("Body:", body)
        # 4. Build API URL
        url_path = reverse_lazy("artist_onboarding_step_1_api")
        api_url = f"{host_url(request)}{url_path}"
        print("API URL:", api_url)
        # 5. Forward request
        response = requests.post(
            api_url,
            headers=headers,
            json=body,
            timeout=30
        )

        print("API Response Status:", response.status_code)

        # 6. Handle API errors
        if response.status_code not in [200, 201]:
            return JsonResponse({
                "status": "error",
                "message": "API error",
                "details": response.text
            }, status=response.status_code)

        # 7. Success
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
def artist_onboarding_step_2(request):
    """
    Proxy view for Artist onboarding STEP 2.
    Saves wallet address, completes onboarding.
    """

    print("🟢 Artist onboarding STEP 2 called")

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

        # 2. Parse body
        body = json.loads(request.body or "{}")

        # 3. Prepare headers
        headers = {
            "Authorization": f"Token {token}",
            "Content-Type": "application/json"
        }

        # 4. Build API URL
        url_path = reverse_lazy("artist_onboarding_step_2_api")
        api_url = f"{host_url(request)}{url_path}"

        # 5. Forward request
        response = requests.post(
            api_url,
            headers=headers,
            json=body,
            timeout=30
        )

        # 6. Handle API errors
        if response.status_code not in [200, 201]:
            return JsonResponse({
                "status": "error",
                "message": "API error",
                "details": response.text
            }, status=response.status_code)

        # 7. Success
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
def get_artist_profile(request):
    """
    Proxy view to fetch logged-in artist profile
    """

    print("🟢 Get Artist Profile Proxy called")

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
        url_path = reverse_lazy("get_artist_profile_api")
        api_url = f"{host_url(request)}{url_path}"

        print("API URL:", api_url)

        # 4️⃣ Forward request
        response = requests.get(
            api_url,
            headers=headers,
            timeout=30
        )

        print("API Response Status:", response.status_code)

        # 5️⃣ Handle API errors
        if response.status_code != 200:
            return JsonResponse({
                "status": "error",
                "message": "API error",
                "details": response.text
            }, status=response.status_code)

        # 6️⃣ Success
        print("API Response Data:", response.json())
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
def get_all_artists(request):
    if request.method != "GET":
        return JsonResponse({"status": "error", "message": "Method not allowed"}, status=405)

    try:
        auth_header = request.headers.get("Authorization", "")
        token = None

        if auth_header.startswith("Token "):
            token = auth_header.split("Token ")[-1]
        elif auth_header.startswith("Bearer "):
            token = auth_header.split("Bearer ")[-1]

        if not token:
            return JsonResponse({"status": "error", "message": "Authorization token required"}, status=401)

        headers = {
          "Authorization": f"Token {token}",
            "Content-Type": "application/json"
        }

        url_path = reverse_lazy("get_all_artists_api")
        api_url = f"{host_url(request)}{url_path}"

        response = requests.get(api_url, headers=headers, timeout=30)

        return JsonResponse(response.json(), status=response.status_code)

    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)


@csrf_exempt
def get_all_admins(request):
    if request.method != "GET":
        return JsonResponse({"status": "error", "message": "Method not allowed"}, status=405)

    try:
        auth_header = request.headers.get("Authorization", "")
        token = None
        print("🟢 Get All Admins Proxy called")

        if auth_header.startswith("Token "):
            token = auth_header.split("Token ")[-1]
            print("Extracted Token:******", token)
        elif auth_header.startswith("Bearer "):
            token = auth_header.split("Bearer ")[-1]
            print("Extracted Token------:", token)

        if not token:
            print("❌ No token found in Authorization header")
            return JsonResponse({"status": "error", "message": "Authorization token required"}, status=401)

        headers = {
            # "Authorization": f"Bearer {token}",
            "Authorization": f"Token {token}",

            "Content-Type": "application/json"
        }
        print("Headers for API call:", headers)

        url_path = reverse_lazy("get_all_admins_api")
        api_url = f"{host_url(request)}{url_path}"

        response = requests.get(api_url, headers=headers, timeout=30)

        return JsonResponse(response.json(), status=response.status_code)

    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)


@csrf_exempt
def update_profile(request):
    """
    Proxy view for updating logged-in user profile (Artist / Listener)
    """

    print("🟢 Update Profile Proxy called")

    if request.method not in ["PUT", "PATCH"]:
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

        # 2️⃣ Parse body
        body = json.loads(request.body or "{}")

        # 3️⃣ Prepare headers
        headers = {
            "Authorization": f"Token {token}",
            "Content-Type": "application/json"
        }

        print("Headers:", headers)
        print("Body:", body)

        # 4️⃣ Build API URL
        url_path = reverse_lazy("update_profile_api")
        api_url = f"{host_url(request)}{url_path}"

        print("API URL:", api_url)

        # 5️⃣ Forward request
        response = requests.request(
            method=request.method,   # 👈 preserves PUT vs PATCH
            url=api_url,
            headers=headers,
            json=body,
            timeout=30
        )

        print("API Response Status:", response.status_code)

        # 6️⃣ Handle API errors
        if response.status_code not in [200, 201]:
            return JsonResponse({
                "status": "error",
                "message": "API error",
                "details": response.text
            }, status=response.status_code)

        # 7️⃣ Success
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
