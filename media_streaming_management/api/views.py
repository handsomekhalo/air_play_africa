import json
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from system_management.storage_util import upload_track_to_backblaze, upload_cover_image_to_backblaze
from system_management.ai_services import analyze_track_with_ai
from mutagen import File as MutagenFile
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import api_view, parser_classes

import os
import tempfile
from media_streaming_management.api.serialziers import BlockchainLogSerializer, TipSerializer, TrackSerializer, UploadTrackSerializer
from system_management.models import UserType
from system_management.permissions import IsAdminUserType
User = get_user_model()


from django.db.models import Avg, Count
from media_streaming_management.models import Artist, BlockchainLog, Track
from web3 import Web3  # For blockchain placeholder
import os


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
    except Artist.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Only artists can upload tracks.'
        }, status=status.HTTP_403_FORBIDDEN)

    # 2. Validate base data with serializer
    serializer = UploadTrackSerializer(data=request.data, context={'request': request})
    if not serializer.is_valid():
        return Response({
            'status': 'error',
            'message': 'Validation failed.',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    audio_file = request.FILES.get('audio_file')
    cover_image = request.FILES.get('cover_image')
    if not audio_file:
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


# @api_view(['POST'])
# @permission_classes([IsAuthenticated])
# def upload_track_api(request):
#     """Upload a new track (artist only)."""
#     try:
#         artist = request.user.artist
#     except Artist.DoesNotExist:
#         return Response({'error': 'Not an artist'}, status=status.HTTP_403_FORBIDDEN)
#     serializer = TrackSerializer(data=request.data)
#     if serializer.is_valid():
#         serializer.save(artist=artist)
#         return Response(serializer.data, status=status.HTTP_201_CREATED)
#     return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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