from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status

from django.db.models import Avg, Count
from media_streaming_management.api.serialziers import ArtistSerializer, BlockchainLogSerializer, StreamSerializer, TipSerializer, TrackSerializer
from media_streaming_management.models import Artist, BlockchainLog, Track
from web3 import Web3  # For blockchain placeholder
import os  # For env vars

# Blockchain setup (placeholder - load from env in production)
WEB3_PROVIDER = os.getenv('WEB3_PROVIDER', 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY')  # Replace with your key
w3 = Web3(Web3.HTTPProvider(WEB3_PROVIDER))
# Mock smart contract address/ABI - replace with real one for payouts
CONTRACT_ADDRESS = '0xYourContractAddress'
CONTRACT_ABI = []  # ABI here

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_artist_api(request):
    """Create a new artist profile."""
    serializer = ArtistSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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