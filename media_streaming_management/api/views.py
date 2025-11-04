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
User = get_user_model()


from django.db.models import Avg, Count
from media_streaming_management.api.serialziers import AdminCreateSerializer, ArtistCreateSerializer, ArtistSerializer, BlockchainLogSerializer, GetAlltUserModelSerializer, GetArtistProfileSerializer, ListenerCreateSerializer, StreamSerializer, TipSerializer, TrackSerializer, UpdateArtistProfileSerializer, UserModelSerializer, UserTypeModelSerializer,GetArtistSerializer
from media_streaming_management.models import Artist, BlockchainLog, Track
from web3 import Web3  # For blockchain placeholder
import os


# Blockchain setup (placeholder - load from env in production)
WEB3_PROVIDER = os.getenv('WEB3_PROVIDER', 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY')  # Replace with your key
w3 = Web3(Web3.HTTPProvider(WEB3_PROVIDER))
# Mock smart contract address/ABI - replace with real one for payouts
CONTRACT_ADDRESS = '0xYourContractAddress'
CONTRACT_ABI = []  # ABI here


@api_view(['POST'])
@permission_classes([AllowAny]) # ✅ Public endpoint
def register_artist_api(request):
    """
    Public artist registration using ArtistCreateSerializer.
    """
    try:
        # Use ArtistCreateSerializer(data=request.data)
        serializer = ArtistCreateSerializer(data=request.data)
        
        # call serializer.is_valid(raise_exception=True)
        serializer.is_valid(raise_exception=True)
        
        # then serializer.save()
        artist = serializer.save() 
        
        # and return ArtistSerializer(artist).data for response.
        return Response(
            ArtistSerializer(artist).data, 
            status=status.HTTP_201_CREATED
        )
        
    except Exception as e:
        # This will catch internal errors (e.g., UserType not found) 
        # that weren't covered by the serializer validation.
        return Response({
            'status': 'error',
            'message': 'Artist registration failed due to an internal server error or configuration issue.',
            'details': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


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


@api_view(['PUT', 'PATCH'])  # ✅ Changed from POST
@permission_classes([IsAuthenticated])
def update_artist_profile_api(request):
    """
    Update logged-in artist's profile.
    Only the artist themselves can update their profile.
    
    PUT/PATCH data:
    {
        "bio": "Updated bio...",
        "location": "Accra, Ghana",
        "wallet_address": "0x..."
    }
    """
    user_type_name = request.user.user_type.name if request.user.user_type else None
    
    # Only artists can update their profile
    if user_type_name != 'Artist':
        data = {
            'status': 'error',
            'message': 'Only artists can update artist profiles.'
        }
        return Response(data, status=status.HTTP_403_FORBIDDEN)
    
    try:
        artist = Artist.objects.get(user=request.user)
    except Artist.DoesNotExist:
        data = {
            'status': 'error',
            'message': 'Artist profile not found.'
        }
        return Response(data, status=status.HTTP_404_NOT_FOUND)
    
    # Partial update
    serializer = UpdateArtistProfileSerializer(artist, data=request.data, partial=True)
    
    if serializer.is_valid():
        serializer.save()
        data = {
            'status': 'success',
            'message': 'Artist profile updated successfully.',
            'data': serializer.data
        }
        return Response(data, status=status.HTTP_200_OK)
    else:
        data = {
            'status': 'error',
            'message': 'Validation failed',
            'errors': serializer.errors
        }
        return Response(data, status=status.HTTP_400_BAD_REQUEST)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_track_api(request):
    """Upload a new track (artist only)."""
    try:
        artist = request.user.artist
    except Artist.DoesNotExist:
        return Response({'error': 'Not an artist'}, status=status.HTTP_403_FORBIDDEN)
    serializer = TrackSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(artist=artist)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])  # Fans can stream anonymously, but track for anti-fraud
def record_stream_api(request):
    """Record a stream (with anti-fraud check)."""
    serializer = StreamSerializer(data=request.data)
    if serializer.is_valid():
        stream = serializer.save(ip_address=request.META.get('REMOTE_ADDR'))
        # Update merit score (simple calc)
        track = stream.track
        avg_time = track.streams.aggregate(Avg('listen_time'))['listen_time__avg'] or 0
        unique_listeners = track.streams.aggregate(Count('session_id', distinct=True))['session_id__count']
        track.merit_score = (unique_listeners * avg_time) + track.tips.count()
        track.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_tip_api(request):
    """Send a tip to a track (with blockchain log)."""
    serializer = TipSerializer(data=request.data)
    if serializer.is_valid():
        tip = serializer.save(tipper=request.user)
        # Blockchain placeholder: Simulate tx (replace with real contract call)
        if w3.is_connected():
            # Mock tx - in real: call smart contract to transfer funds
            tx_hash = '0xMockHash'  # w3.eth.send_transaction({...})
            BlockchainLog.objects.create(
                related_model='Tip', related_id=tip.id, tx_hash=tx_hash, status='confirmed'
            )
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def artist_dashboard(request):
    """Get earnings/transparency dashboard for artist."""
    try:
        artist = request.user.artist
    except Artist.DoesNotExist:
        return Response({'error': 'Not an artist'}, status=status.HTTP_403_FORBIDDEN)
    tracks = TrackSerializer(artist.tracks.all(), many=True).data
    total_earnings = sum(tip.amount for tip in Tip.objects.filter(track__artist=artist))
    logs = BlockchainLogSerializer(BlockchainLog.objects.filter(related_id__in=[t.id for t in artist.tracks.all()]), many=True).data
    return Response({
        'tracks': tracks,
        'total_earnings': total_earnings,
        'blockchain_logs': logs  # For transparency
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def discover_tracks(request):
    """Merit-based discovery (top by score)."""
    tracks = Track.objects.order_by('-merit_score')[:10]
    return Response(TrackSerializer(tracks, many=True).data)