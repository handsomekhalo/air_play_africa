import datetime
from datetime import datetime
import json
import random
from requests import Response

from media_streaming_management.models import Artist
from system_management import constants
from system_management.api.serializers import  AdminCreateSerializer, AdminUpdateSerializer, AdminUserListSerializer, ArtistCreateSerializer, ArtistOnboardingSerializer, ArtistSerializer, GetAlltUserModelSerializer, GetArtistProfileSerializer, GetArtistSerializer, ListenerCreateSerializer, UpdateArtistProfileSerializer, UserModelSerializer, UserTypeModelSerializer

from system_management import constants
from system_management.api.serializers import  UserModelSerializer

from system_management import constants
from system_management.api.serializers import  UserModelSerializer
from system_management.models import User, UserType
from rest_framework.permissions import AllowAny
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from rest_framework.response import Response
from rest_framework import status

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model

from system_management.models import UserType
from system_management.permissions import IsAdminUserType
User = get_user_model()





from rest_framework.decorators import api_view, permission_classes

from rest_framework import (
    status,
    permissions,
    authentication
)

from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes
)

from system_management.permissions import IsAdminUserType



# @api_view(["POST"])
# @permission_classes((AllowAny,))
# def login_api(request):
#     """
#     Login API for user authentication
#     """
#     body = json.loads(request.body)
#     email = body.get("email")
#     password = body.get("password")

#     if not email or not password:
#         return Response(
#             {"status": "error", "message": "Please provide both email and password"},
#             status=status.HTTP_400_BAD_REQUEST,
#         )

#     user = authenticate(email=email, password=password)

#     if not user:
#         return Response(
#             {"status": "error", "message": "Invalid Credentials"},
#             status=status.HTTP_400_BAD_REQUEST,
#         )

#     if not user.is_active:
#         return Response(
#             {"status": "error", "message": "User is inactive, please contact admin"},
#             status=status.HTTP_400_BAD_REQUEST,
#         )

#     token, _ = Token.objects.get_or_create(user=user)

#     otp = "".join([str(random.randint(0, 9)) for _ in range(5)])  # temporary if needed

#     user.last_login = datetime.now()
#     user.save()

#     user_serializer = UserModelSerializer(user)

#     return Response(
#         {
#             "status": "success",
#             "token": token.key,
#             "otp": otp,
#             "user": user_serializer.data,
#         },
#         status=status.HTTP_200_OK,
#     )


# @api_view(["POST"])
# @permission_classes([AllowAny])
# def login_api(request):
#     """
#     Login API for user authentication.
#     Returns onboarding state if user is an artist.
#     """
#     body = json.loads(request.body)
#     email = body.get("email")
#     password = body.get("password")

#     if not email or not password:
#         return Response(
#             {
#                 "status": "error",
#                 "message": "Please provide both email and password"
#             },
#             status=status.HTTP_400_BAD_REQUEST,
#         )

#     user = authenticate(email=email, password=password)

#     if not user:
#         return Response(
#             {
#                 "status": "error",
#                 "message": "Invalid credentials"
#             },
#             status=status.HTTP_400_BAD_REQUEST,
#         )

#     if not user.is_active:
#         return Response(
#             {
#                 "status": "error",
#                 "message": "User is inactive, please contact admin"
#             },
#             status=status.HTTP_403_FORBIDDEN,
#         )

#     token, _ = Token.objects.get_or_create(user=user)

#     user.last_login = datetime.now()
#     user.save(update_fields=["last_login"])
#     artist = Artist.objects.filter(user=user).first()


#     response_data = {
#         "status": "success",
#         "token": token.key,
#         "user": UserModelSerializer(user).data,
#          "artist": {
#         "onboarding_step": artist.onboarding_step if artist else None,
#         "is_onboarded": artist.is_onboarded if artist else False
#     }
#     }

#     # 🔑 Artist-specific onboarding state
#     if user.user_type and user.user_type.name.lower() == "artist":

#         try:
#             artist = Artist.objects.get(user=user)
#             response_data["artist"] = {
#                 "is_onboarded": artist.is_onboarded
#             }
#         except Artist.DoesNotExist:
#             response_data["artist"] = {
#                 "is_onboarded": False
#             }

#     return Response(response_data, status=status.HTTP_200_OK)
@api_view(["POST"])
@permission_classes([AllowAny])
def login_api(request):
    body = json.loads(request.body)
    email = body.get("email")
    password = body.get("password")

    if not email or not password:
        return Response(
            {"status": "error", "message": "Please provide both email and password"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = authenticate(email=email, password=password)

    if not user:
        return Response(
            {"status": "error", "message": "Invalid credentials"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not user.is_active:
        return Response(
            {"status": "error", "message": "User is inactive, please contact admin"},
            status=status.HTTP_403_FORBIDDEN,
        )

    token, _ = Token.objects.get_or_create(user=user)

    user.last_login = datetime.now()
    user.save(update_fields=["last_login"])

    response_data = {
        "status": "success",
        "token": token.key,
        "user": UserModelSerializer(user).data,
    }

    # 🎨 Artist onboarding state
    if user.user_type and user.user_type.name.lower() == "artist":
        artist = Artist.objects.filter(user=user).first()

        response_data["artist"] = {
            "is_onboarded": artist.is_onboarded if artist else False,
            "onboarding_step": artist.onboarding_step if artist else 1,
        }

    return Response(response_data, status=status.HTTP_200_OK)



@api_view(['POST'])
@permission_classes([AllowAny])  # ✅ Public endpoint
def register_artist_api(request):
    """
    Public artist registration.
    Creates BOTH User and Artist (is_onboarded = False).
    """
    serializer = ArtistCreateSerializer(data=request.data)

    if not serializer.is_valid():
        print("Invalid registration data:", serializer.errors)
        return Response(
            {
                'status': 'error',
                'message': 'Invalid registration data.',
                'errors': serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        artist = serializer.save()

        return Response(
            {
                'status': 'success',
                'message': 'Artist registered successfully.',
                'data': ArtistSerializer(artist).data
            },
            status=status.HTTP_201_CREATED
        )

    except Exception as e:
        return Response(
            {
                'status': 'error',
                'message': 'Artist registration failed due to a server error.',
                'details': str(e)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


## 🎧 register_listener_api

@api_view(['POST'])
@permission_classes([AllowAny]) # ✅ Public endpoint
def register_listener_api(request):
    """
    Public listener/subscriber registration using ListenerCreateSerializer.
    """
    try:
        # Use ListenerCreateSerializer(data=request.data)
        serializer = ListenerCreateSerializer(data=request.data)
        
        # call serializer.is_valid(raise_exception=True)
        serializer.is_valid(raise_exception=True)
        
        # then serializer.save() (saves the User object)
        user = serializer.save() 
        
        # and return UserModelSerializer(user).data for response.
        return Response(
            UserModelSerializer(user).data,
            status=status.HTTP_201_CREATED
        )
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': 'Listener registration failed due to an internal server error or configuration issue.',
            'details': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


## 👑 create_admin_api

@api_view(['POST'])
@permission_classes([IsAuthenticated]) # ✅ Requires auth
def create_admin_api(request):
    """
    Admin-only: Create new admin accounts using AdminCreateSerializer.
    """
    # Check if requester is admin (best handled by a custom Permission class, 
    # but keeping inline for simplicity based on original code)
    if not request.user.is_authenticated or request.user.user_type.name != 'Admin':
        return Response({
            'status': 'error',
            'message': 'Only authenticated admins can create admin accounts.'
        }, status=status.HTTP_403_FORBIDDEN)
        
    try:
        # Use AdminCreateSerializer with context={'request': request}
        serializer = AdminCreateSerializer(
            data=request.data,
            context={'request': request} # Needed for user_created_by_id in .create()
        )
        
        # call serializer.is_valid(raise_exception=True)
        serializer.is_valid(raise_exception=True)
        
        # then serializer.save() (saves the Admin User object)
        user = serializer.save()
        
        # and return UserModelSerializer(user).data for response.
        return Response(
            UserModelSerializer(user).data,
            status=status.HTTP_201_CREATED
        )
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': 'Admin creation failed due to an internal server error or configuration issue.',
            'details': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)



@permission_classes([AllowAny])
@api_view(['GET'])
def get_user_types_api(request):
    """
    Get all user types in the database

    Args:
        request:
    Returns:
        Response:
            data:
                status:
                message:
                data:
            status code:
    """
 
    if request.method == 'GET':

        user_types = UserType.objects.all()
        serializer = UserTypeModelSerializer(user_types, many=True)

        try:
            data = {
                'status': "success",
                'user_types': serializer.data
            }
            return Response(data, status=status.HTTP_200_OK)

        except KeyError:
            data = {
                'status': "error",
                'message': "Error during getting user types."
            }
            return Response(data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    else:
        data = {
            'status': "error",
            'message': constants.INVALID_REQUEST_METHOD
        }
        return Response(data, status.HTTP_405_METHOD_NOT_ALLOWED)




@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_all_artists_api(request):
    users = User.objects.filter(user_type__name__iexact="artist")

    serializer = AdminUserListSerializer(users, many=True)

    return Response({
        "status": "success",
        "artists": serializer.data
    }, status=status.HTTP_200_OK)


# @api_view(["GET"])
# @permission_classes([IsAuthenticated])
# def get_all_artists_api(request):
#     users = User.objects.filter(user_type__name="Artist")

#     serializer = AdminUserListSerializer(users, many=True)

#     return Response({
#         "status": "success",
#         "artists": serializer.data
#     }, status=status.HTTP_200_OK)




# @api_view(["GET"])
# @permission_classes([IsAuthenticated])
# def get_all_admins_api(request):
#     # print("🟢 Get All Admins API called")

#     # print("ALL USERS:", list(User.objects.values("id", "email", "user_type_id")))

#     users = User.objects.filter(user_type__name="Admin")
#     # users = User.objects.all()


#     serializer = AdminUserListSerializer(users, many=True)

#     return Response({
#         "status": "success",
#         "admins": serializer.data
#     }, status=status.HTTP_200_OK)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_all_admins_api(request):
    users = User.objects.filter(user_type__name__iexact="admin")

    serializer = AdminUserListSerializer(users, many=True)

    return Response({
        "status": "success",
        "admins": serializer.data
    }, status=status.HTTP_200_OK)



@api_view(['GET'])
def get_all_users_api(request):

    """
    Get all users api

    Args:
        request:
    Returns:
        Response:
            data:
                - status
                - message
                - data
            status code:
    """
    if request.method == "GET":
        users = User.objects.all()

        serializer = GetAlltUserModelSerializer(users, many=True).data

        try:
            data = {
                'status': "success",
                'users': serializer
            }
            return Response(data, status=status.HTTP_200_OK)

        except KeyError:
            data = {
                'status': "error",
                'message': "Error during getting users."
            }
            return Response(data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    else:
        data = {
            'status': "error",
            'message': "Invalid request method."
        }
        return Response(data, status.HTTP_405_METHOD_NOT_ALLOWED)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_artist_api(request):
    try:
        artist = Artist.objects.get(user=request.user)
    except Artist.DoesNotExist:
        return Response({'error': 'Artist profile not found'}, status=status.HTTP_404_NOT_FOUND)

    serializer = GetArtistSerializer(artist)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_artist_profile_api(request):
    """Get logged-in artist's profile."""
    try:
        artist = Artist.objects.get(user=request.user)
        data = {
            'status': 'success',
            'data': GetArtistProfileSerializer(artist).data
        }
        return Response(data, status=status.HTTP_200_OK)
    except Artist.DoesNotExist:
        data = {
            'status': 'error',
            'message': 'Artist profile not found.'
        }
        return Response(data, status=status.HTTP_404_NOT_FOUND)



@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def toggle_user_active_api(request, user_id):
    try:
        user = User.objects.get(id=user_id)

        # flip state
        user.is_active = not user.is_active
        user.save()

        return Response({
            "status": "success",
            "user_id": user.id,
            "is_active": user.is_active
        }, status=status.HTTP_200_OK)

    except User.DoesNotExist:
        return Response({
            "status": "error",
            "message": "User not found"
        }, status=status.HTTP_404_NOT_FOUND)



@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_profile_api(request):
    """
    Allows the logged-in user to update their profile based on their user type.
    - Artists update their User and Artist profile.
    - Listeners update their base User profile.
    - Admins are currently blocked.
    """
    user = request.user
    user_type_name = getattr(user.user_type, 'name', None)

    # --- 1. Map User Type to Instance and Serializer ---
    
    if user_type_name == 'Artist':
        try:
            # Instance to update is the Artist object
            instance_to_update = Artist.objects.get(user=user)
            SerializerClass = UpdateArtistProfileSerializer
        except Artist.DoesNotExist:
            return Response({
                'status': 'error',
                'message': 'Artist profile record missing.'
            }, status=status.HTTP_404_NOT_FOUND)
            
    elif user_type_name == 'Listener':
        # Instance to update is the base User object itself
        instance_to_update = user
        SerializerClass = ListenerCreateSerializer
        
    elif user_type_name == 'Admin' or user_type_name is None:
        return Response({
            'status': 'error',
            'message': f'{user_type_name or "Unknown"} users are not permitted to use this generic update API.'
        }, status=status.HTTP_403_FORBIDDEN)
        
    else:
        # For future user types
        return Response({
            'status': 'error',
            'message': f'Update logic for user type "{user_type_name}" is not implemented yet.'
        }, status=status.HTTP_501_NOT_IMPLEMENTED)
        
    # --- 2. Generic Update Logic ---

    # Use partial=True for both PUT (often acts as replace, but partial=True is safer) and PATCH
    serializer = SerializerClass(
        instance_to_update, 
        data=request.data, 
        partial=True,
        context={'request': request} 
    )
    
    try:
        # Validate data and catch errors with raise_exception=True
        serializer.is_valid(raise_exception=True)
        
        # Save the updated instance
        updated_instance = serializer.save()
        
        # --- 3. Return Response ---
        # If the saved object is Artist, its data is already comprehensive.
        # If the saved object is User (Listener), we return UserModelSerializer data.
        
        response_data = serializer.data
        if user_type_name == 'Listener':
            # Re-serialize the updated User object for comprehensive output
            response_data = UserModelSerializer(updated_instance).data
            
        return Response({
            'status': 'success',
            'message': f'{user_type_name} profile updated successfully.',
            'data': response_data
        }, status=status.HTTP_200_OK)

    except Exception as e:
        error_details = getattr(e, 'detail', str(e))
        return Response({
            'status': 'error',
            'message': 'Profile update failed due to validation or internal error.',
            'errors': error_details
        }, status=status.HTTP_400_BAD_REQUEST)
    


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated, IsAdminUserType]) # Only Authenticated Admins allowed
def update_admin_profile_api(request):
    """
    Admin-specific endpoint: Allows the logged-in Admin/Superuser to update their own profile (User fields).
    """
    user = request.user

    # The instance to update is the User object itself
    instance_to_update = user
    SerializerClass = AdminUpdateSerializer # Use the dedicated Admin serializer

    # Use partial=True for flexibility (allowing both PUT and PATCH behavior)
    serializer = SerializerClass(
        instance_to_update, 
        data=request.data, 
        partial=True,
        context={'request': request} 
    )
    
    try:
        # Validate data and execute update
        serializer.is_valid(raise_exception=True)
        updated_instance = serializer.save()
        
        # Return the comprehensive UserModelSerializer data for response
        response_data = UserModelSerializer(updated_instance).data
            
        return Response({
            'status': 'success',
            'message': 'Admin profile updated successfully.',
            'data': response_data
        }, status=status.HTTP_200_OK)

    except Exception as e:
        error_details = getattr(e, 'detail', str(e))
        return Response({
            'status': 'error',
            'message': 'Admin profile update failed due to validation or internal error.',
            'errors': error_details
        }, status=status.HTTP_400_BAD_REQUEST)



# @api_view(['POST'])
# @permission_classes([IsAuthenticated])
# def artist_onboarding_api(request):
#     """
#     Complete artist onboarding after login
#     """
#     try:
#         artist = Artist.objects.get(user=request.user)
#     except Artist.DoesNotExist:
#         return Response(
#             {
#                 'status': 'error',
#                 'message': 'Artist profile not found.'
#             },
#             status=status.HTTP_404_NOT_FOUND
#         )

#     if artist.is_onboarded:
#         return Response(
#             {
#                 'status': 'error',
#                 'message': 'Artist already onboarded.'
#             },
#             status=status.HTTP_400_BAD_REQUEST
#         )

#     serializer = ArtistOnboardingSerializer(
#         artist,
#         data=request.data,
#         partial=True
#     )

#     if not serializer.is_valid():
#         return Response(
#             {
#                 'status': 'error',
#                 'message': 'Invalid data.',
#                 'errors': serializer.errors
#             },
#             status=status.HTTP_400_BAD_REQUEST
#         )

#     serializer.save(is_onboarded=True)

#     return Response(
#         {
#             'status': 'success',
#             'message': 'Artist onboarding completed.',
#             'data': serializer.data
#         },
#         status=status.HTTP_200_OK
#     )
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def artist_onboarding_step_1_api(request):
    print("🟢 Artist API FOR onboarding STEP 1 API called")
    """
    Artist onboarding STEP 1:
    - bio
    - location
    """

    try:
        artist = Artist.objects.get(user=request.user)

        print("Current onboarding step:", artist.onboarding_step)
    except Artist.DoesNotExist:
        return Response(
            {"status": "error", "message": "Artist profile not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    if artist.onboarding_step > 1:
        print("Step 1 already completed, cannot redo.")
        return Response(
            {"status": "error", "message": "Step 1 already completed"},
            status=status.HTTP_400_BAD_REQUEST
        )

    serializer = ArtistOnboardingSerializer(
        artist,
        data=request.data,
        partial=True
    )

    if not serializer.is_valid():
        print("Invalid data:", serializer.errors)
        return Response(
            {
                "status": "error",
                "message": "Invalid data",
                "errors": serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    serializer.save(onboarding_step=2)

    return Response(
        {
            "status": "success",
            "message": "Step 1 completed",
            "next_step": 2,
            "data": serializer.data
        },
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def artist_onboarding_step_2_api(request):
    """
    Artist onboarding STEP 2:
    - wallet_address
    - marks artist as onboarded
    """

    try:
        artist = Artist.objects.get(user=request.user)
    except Artist.DoesNotExist:
        return Response(
            {"status": "error", "message": "Artist profile not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    if artist.onboarding_step < 2:
        return Response(
            {
                "status": "error",
                "message": "Complete step 1 first"
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    if artist.is_onboarded:
        return Response(
            {
                "status": "error",
                "message": "Artist already onboarded"
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    serializer = ArtistOnboardingSerializer(
        artist,
        data=request.data,
        partial=True
    )

    if not serializer.is_valid():
        return Response(
            {
                "status": "error",
                "message": "Invalid data",
                "errors": serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    serializer.save(
        is_onboarded=True,
        onboarding_step=99  # sentinel value = completed
    )

    return Response(
        {
            "status": "success",
            "message": "Artist onboarding completed",
            "data": serializer.data
        },
        status=status.HTTP_200_OK
    )



# @api_view(["POST"])
# @permission_classes([IsAuthenticated])
# def artist_onboarding_api(request):
#     """
#     Completes artist profile after first login
#     """
#     profile = request.user.profile

#     profile.bio = request.data.get("bio")
#     profile.location = request.data.get("location")
#     profile.wallet_address = request.data.get("wallet_address")
#     profile.is_onboarded = True
#     profile.save()

#     return Response({
#         "status": "success",
#         "message": "Artist profile completed"
#     }, status=200)
