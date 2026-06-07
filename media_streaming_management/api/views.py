
import json

from django.db import IntegrityError
from django.shortcuts import get_object_or_404, redirect
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from django.db.models import Avg, Count

from system_management.storage_util import upload_track_to_backblaze, upload_cover_image_to_backblaze
from system_management.ai_services import analyze_track_with_ai
from mutagen import File as MutagenFile
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import api_view, parser_classes

import os
import tempfile
from media_streaming_management.api.serialziers import BlockchainLogSerializer, GetAllArtistTrackListSerializer, GetAllTracksDetailSerializer, GetSingleTrackListSerializer, TipSerializer, TrackSerializer, UploadTrackSerializer
from system_management.models import UserType
from system_management.permissions import IsAdminUserType
from system_management.models import UserType
from system_management.models import UserType
User = get_user_model()
from django.db.models import Avg, Count
from media_streaming_management.api.serialziers import AdminCreateSerializer, ArtistCreateSerializer, ArtistSerializer, BlockchainLogSerializer, GetAlltUserModelSerializer, GetArtistProfileSerializer, ListenerCreateSerializer, StreamSerializer, TipSerializer, TrackSerializer, UpdateArtistProfileSerializer, UserModelSerializer, UserTypeModelSerializer,GetArtistSerializer
from media_streaming_management.models import Artist, BlockchainLog, Stream, Track
from web3 import Web3  # For blockchain placeholder
import os
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.core import signing
from django.utils.timezone import now
from datetime import timedelta
from django.core import signing
from django.http import StreamingHttpResponse, HttpResponseForbidden
import time
import requests

# Blockchain setup (placeholder - load from env in production)
WEB3_PROVIDER = os.getenv('WEB3_PROVIDER', 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY')  # Replace with your key
w3 = Web3(Web3.HTTPProvider(WEB3_PROVIDER))
# Mock smart contract address/ABI - replace with real one for payouts
CONTRACT_ADDRESS = '0xYourContractAddress'
CONTRACT_ABI = []  # ABI here
from rest_framework.decorators import api_view, permission_classes, parser_classes




@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_track_api(request):
    print("🚀 upload_track_api called")
    """
    Upload track to Backblaze with AI analysis.
    
    Form-data:
    - title: string
    - genre: string (optional, AI will suggest)
    - album: string (optional)
    - audio_file: file
    - cover_image: file (optional)
    """

    # 1. Ensure user is an artist
    try:
        artist = request.user.artist
        print("🚀 Artist found:", artist)
    except Artist.DoesNotExist:
        print("🚀 User is not an artist")
        return Response({
            'status': 'error',
            'message': 'Only artists can upload tracks.'
        }, status=status.HTTP_403_FORBIDDEN)

    # 2. Validate base data with serializer
    print("🚀 Request data:", request.data)
    serializer = UploadTrackSerializer(data=request.data, context={'request': request})
    if not serializer.is_valid():
        print("🚀 Serializer errors:", serializer.errors)
        return Response({
            'status': 'error',
            'message': 'Validation failed.',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    audio_file = request.FILES.get('audio_file')
    cover_image = request.FILES.get('cover_image')
    if not audio_file:
        print("🚀 No audio file provided")
        return Response({
            'status': 'error',
            'message': 'Audio file is required.'
        }, status=status.HTTP_400_BAD_REQUEST)

    # 3. Create the track record
    track = serializer.save(artist=artist, status='uploading')

    try:
        # 4. Save temporarily for metadata extraction
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as temp_file:
            for chunk in audio_file.chunks():
                temp_file.write(chunk)
            temp_path = temp_file.name

        # 5. Extract basic metadata
        audio = MutagenFile(temp_path)
        if audio and audio.info:
            track.duration = int(audio.info.length)
        track.file_size = os.path.getsize(temp_path)

        # 6. AI analysis (optional)
        artist_name = f"{artist.user.first_name} {artist.user.last_name}"
        try:
            ai_data = analyze_track_with_ai(temp_path, track.title, artist_name)

            print('ai data', ai_data)
            if ai_data:
                track.bpm = ai_data.get('bpm')
                # ai_analysis = json.loads(ai_data.get('ai_analysis', '{}'))
                raw_ai = ai_data.get('ai_analysis', '{}')

                # Remove backticks and "json"
                def clean_json_string(s: str):
                    s = s.strip()
                    if s.startswith("```"):
                        s = s.strip("`")
                        s = s.replace("json", "", 1).strip()
                    return s


                cleaned = clean_json_string(raw_ai)
                ai_analysis = json.loads(cleaned)
                track.ai_genre = ai_analysis.get('genre', '')
                track.ai_mood = ai_analysis.get('mood', '')
                track.ai_description = ai_analysis.get('description', '')
                track.ai_tags = ai_analysis.get('tags', [])
        except Exception as e:
            print(f"[AI Analysis] Failed: {e}")

        # 7. Upload to Backblaze
        audio_file.seek(0)
        stream_url = upload_track_to_backblaze(audio_file, track.id, artist_name)
        if not stream_url:
            track.status = 'failed'
            track.save()
            return Response({
                'status': 'error',
                'message': 'Failed to upload audio file to storage.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        track.stream_url = stream_url

        # 8. Upload cover image (optional)
        if cover_image:
            cover_url = upload_cover_image_to_backblaze(cover_image, track.id, artist_name)
            if cover_url:
                track.cover_image_url = cover_url

        # 9. Finalize
        track.status = 'ready'
        track.save()

        # Cleanup
        os.unlink(temp_path)

        return Response({
            'status': 'success',
            'message': 'Track uploaded successfully!',
            'data': TrackSerializer(track, context={'request': request}).data
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        track.status = 'failed'
        track.save()
        return Response({
            'status': 'error',
            'message': f'Upload failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def retrieve_track_api(request, track_id):
    try:
        track = Track.objects.get(id=track_id)
    except Track.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Track not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    serializer = GetSingleTrackListSerializer(track, context={'request': request})

    print('serizlizer',serializer)
    return Response({
        'status': 'success',
        'data': serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])   # optional — depends on your platform
def retrieve_all_tracks_api(request):
    queryset = Track.objects.filter(status='ready').order_by('-upload_date')

    # Optional filters
    genre = request.GET.get('genre')
    mood = request.GET.get('mood')
    artist = request.GET.get('artist')

    if genre:
        queryset = queryset.filter(genre__icontains=genre)

    if mood:
        queryset = queryset.filter(ai_mood__icontains=mood)

    if artist:
        queryset = queryset.filter(artist__user__first_name__icontains=artist)

    serializer = GetAllTracksDetailSerializer(queryset, many=True, context={'request': request})

    print('serializer data', serializer.data)
    return Response({
        'status': 'success',
        'data': serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_tracks_api(request):
    artist = request.user.artist
    queryset = Track.objects.filter(artist=artist).order_by('-upload_date')
    
    serializer = GetAllArtistTrackListSerializer(queryset, many=True, context={'request': request})
    return Response({
        'status': 'success',
        'data': serializer.data
    }, status=status.HTTP_200_OK)



@api_view(['POST'])
@permission_classes([AllowAny])
def record_stream_api(request):
    """Record a stream (with anti-fraud check)."""
    data = request.data.copy()
    
    # Add IP address automatically
    data['ip_address'] = request.META.get('REMOTE_ADDR')
    
    # Add listener if authenticated
    if request.user.is_authenticated:
        data['listener'] = request.user.id
    
    serializer = StreamSerializer(data=data)
    
    if serializer.is_valid():
        try:
            stream = serializer.save()
            
            # Update merit score
            track = stream.track
            avg_time = track.streams.aggregate(Avg('listen_time'))['listen_time__avg'] or 0
            unique_listeners = track.streams.values('session_id').distinct().count()
            
            # Check if tips relation exists
            tips_count = track.tips.count() if hasattr(track, 'tips') else 0
            
            track.merit_score = (unique_listeners * avg_time) + tips_count
            track.save(update_fields=['merit_score'])
            
            return Response({
                'status': 'success',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except IntegrityError:
            # Handle duplicate session_id (anti-spam)
            return Response({
                'status': 'error',
                'message': 'Stream already recorded for this session'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    return Response({
        'status': 'error',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)



@api_view(["GET"])
@permission_classes([IsAuthenticated])
def proxy_play_track_api(request, track_id):
    try:
        track = Track.objects.get(id=track_id)
    except Track.DoesNotExist:
        return Response({"error": "Not found"}, status=404)

    # 🔐 Ownership check happens HERE
    if track.artist != request.user.artist:
        return Response({"error": "Unauthorized"}, status=403)

    if not track.stream_url:
        return Response({"error": "Audio unavailable"}, status=400)

    return redirect(track.stream_url)





@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_play_token_api(request, track_id):
    artist = request.user.artist
    track = get_object_or_404(Track, id=track_id)

    if track.artist != artist:
        return Response({"error": "Unauthorized"}, status=403)

    payload = {
        "track_id": track.id,
        "exp": (now() + timedelta(seconds=30)).timestamp()
    }

    token = signing.dumps(payload)

    return Response({
        "status": "success",
        # "play_url": f"/media_streaming_management_api/play/{token}/"
        "play_url":f"/media_streaming_management_api/play_with_token_api/{token}/"

    })




@api_view(["GET"])
@permission_classes([AllowAny])
def play_with_token_api(request, token):
    try:
        print('inside Api')
        data = signing.loads(token, max_age=30)

        print('signed in', data)
        if time.time() > data["exp"]:
            return HttpResponseForbidden("Token expired")

        track = get_object_or_404(Track, id=data["track_id"])
        print('track', track)

        if not track.stream_url:
            print('not track')
            return HttpResponseForbidden("No stream")

        headers = {}
        if "HTTP_RANGE" in request.META:
            print('header range inside')
            headers["Range"] = request.META["HTTP_RANGE"]

        r = requests.get(
            track.stream_url,
            headers=headers,
            stream=True,
        )

        print('rrrrrrrrrrrrrr', r)

        response = StreamingHttpResponse(
            r.iter_content(chunk_size=8192),
            status=r.status_code,
            content_type=r.headers.get("Content-Type", "audio/mpeg"),
        )

        response["Accept-Ranges"] = "bytes"

        if "Content-Range" in r.headers:
            response["Content-Range"] = r.headers["Content-Range"]
        if "Content-Length" in r.headers:
            response["Content-Length"] = r.headers["Content-Length"]

        return response

    except signing.BadSignature:
        return HttpResponseForbidden("Invalid token")




@api_view(['PATCH'])
@permission_classes([AllowAny])
def update_stream_api(request, session_id):
    """Update listen time for an existing stream."""
    try:
        stream = Stream.objects.get(session_id=session_id)
        listen_time = request.data.get('listen_time', stream.listen_time)
        
        # Only update if new time is greater (prevent fraud)
        if listen_time > stream.listen_time:
            stream.listen_time = listen_time
            stream.save()
            
            # Recalculate merit score
            track = stream.track
            avg_time = track.streams.aggregate(Avg('listen_time'))['listen_time__avg'] or 0
            unique_listeners = track.streams.aggregate(Count('session_id', distinct=True))['session_id__count']
            track.merit_score = (unique_listeners * avg_time) + track.tips.count()
            track.save()
        
        return Response({
            'status': 'success',
            'listen_time': stream.listen_time
        }, status=status.HTTP_200_OK)
        
    except Stream.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Stream not found'
        }, status=status.HTTP_404_NOT_FOUND)
    

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



@api_view(["GET"])
@permission_classes([AllowAny])  # Listeners don't need auth to play
def get_listener_play_token_api(request, track_id):
    """
    Get a short-lived play token for any ready track.
    No ownership check — any user (or anonymous) can play.
    """
    track = get_object_or_404(Track, id=track_id, status='ready')

    payload = {
        "track_id": track.id,
        # "exp": (now() + timedelta(seconds=60)).isoformat()  # 60s token
        "exp": (now() + timedelta(seconds=60)).timestamp()  # float, not isoformat

    }
    token = signing.dumps(payload)

    return Response({
        "status": "success",
        "play_url": f"/media_streaming_management_api/play_with_token_api/{token}/"
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_tracks_admin_api(request):
    """Admin — get all tracks regardless of status."""
    if request.user.user_type.name != 'Admin':
        return Response({'status': 'error', 'message': 'Unauthorized'}, status=403)
    
    tracks = Track.objects.all().order_by('-upload_date')
    serializer = GetAllTracksDetailSerializer(tracks, many=True, context={'request': request})
    return Response({'status': 'success', 'data': serializer.data}, status=200)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def moderate_track_api(request, track_id):
    """Admin — approve or reject a track."""
    if request.user.user_type.name != 'Admin':
        return Response({'status': 'error', 'message': 'Unauthorized'}, status=403)

    track = get_object_or_404(Track, id=track_id)
    action = request.data.get('action')  # 'approve' or 'reject'

    if action == 'approve':
        track.status = 'ready'
    elif action == 'reject':
        track.status = 'failed'
    else:
        return Response({'status': 'error', 'message': 'Invalid action. Use approve or reject.'}, status=400)

    track.save(update_fields=['status'])
    return Response({
        'status': 'success',
        'message': f'Track {action}d successfully.',
        'track_id': track.id,
        'new_status': track.status,
    }, status=200)