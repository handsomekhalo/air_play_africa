import json
import secrets
import string
from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.middleware.csrf import get_token
from django.urls import reverse_lazy
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.csrf import csrf_exempt


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