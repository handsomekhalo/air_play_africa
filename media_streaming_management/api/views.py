
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
from media_streaming_management.api.serialziers import ArtistEarningsSerializer, CreditAccountSerializer, GetAllArtistTrackListSerializer, GetAllTracksDetailSerializer, GetSingleTrackListSerializer, TipSerializer, TrackSerializer, UploadTrackSerializer, WithdrawalRequestCreateSerializer, WithdrawalRequestSerializer
from system_management.models import UserType
from system_management.permissions import IsAdminUserType
from system_management.models import UserType
from system_management.models import UserType
User = get_user_model()
from django.db.models import Avg, Count
from media_streaming_management.api.serialziers import AdminCreateSerializer, ArtistCreateSerializer, ArtistSerializer, GetAlltUserModelSerializer, GetArtistProfileSerializer, ListenerCreateSerializer, StreamSerializer, TipSerializer, TrackSerializer, UpdateArtistProfileSerializer, UserModelSerializer, UserTypeModelSerializer,GetArtistSerializer
from media_streaming_management.models import Artist, ArtistEarnings, CreditAccount, CreditTopUp,  Stream, Tip, Track, WithdrawalRequest
from web3 import Web3  # For blockchain placeholder
import os
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.core import signing
from django.utils.timezone import now
from datetime import timedelta, timezone
from django.core import signing
from django.http import StreamingHttpResponse, HttpResponseForbidden
import time
import requests
from django.conf import settings
from django.db import transaction
from decimal import Decimal
from django.core.cache import cache
from system_management import constants

from django.db.models.functions import TruncDate
from django.db.models import Sum
from datetime import timedelta
# from django.utils.timezone import now


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

    return Response({
        'status': 'success',
        'data': serializer.data
    }, status=status.HTTP_200_OK)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_tracks_api(request):
    try:
        artist = Artist.objects.get(user=request.user)
    except Artist.DoesNotExist:
        return Response({
            "status": "success",
            "data": []
        }, status=status.HTTP_200_OK)

    tracks = Track.objects.filter(artist=artist)
    return Response({
        "status": "success",
        "data": TrackSerializer(tracks, many=True).data
    }, status=status.HTTP_200_OK)

# @api_view(['GET'])
# @permission_classes([IsAuthenticated])
# def my_tracks_api(request):
#     artist = request.user.artist
#     queryset = Track.objects.filter(artist=artist).order_by('-upload_date')
    
#     serializer = GetAllArtistTrackListSerializer(queryset, many=True, context={'request': request})
#     return Response({
#         'status': 'success',
#         'data': serializer.data
#     }, status=status.HTTP_200_OK)



@api_view(['POST'])
@permission_classes([AllowAny])
def record_stream_api(request):
    """Record a stream (with anti-fraud check)."""

    ip = request.META.get('REMOTE_ADDR')
    cache_key = f'stream_rate_{ip}'

    request_count = cache.get(cache_key, 0)
    if request_count > 30:  # max 30 stream-starts per minute per IP
        return Response({'status': 'error', 'message': 'Rate limit exceeded.'}, status=429)
    
    cache.set(cache_key, request_count + 1, timeout=60)
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
            # Increment play_count on the track
            track.play_count = (track.play_count or 0) + 1
            track.save(update_fields=['play_count', 'merit_score'])
            track = stream.track
            avg_time = track.streams.aggregate(Avg('listen_time'))['listen_time__avg'] or 0
            unique_listeners = track.streams.values('session_id').distinct().count()
            
            # Check if tips relation exists
            tips_count = track.tips.count() if hasattr(track, 'tips') else 0
            
            track.merit_score = (unique_listeners * avg_time) + tips_count
            # track.save(update_fields=['merit_score'])
            
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
        data = signing.loads(token, max_age=30)

        if time.time() > data["exp"]:
            return HttpResponseForbidden("Token expired")

        track = get_object_or_404(Track, id=data["track_id"])

        if not track.stream_url:
            return HttpResponseForbidden("No stream")

        headers = {}
        if "HTTP_RANGE" in request.META:
            headers["Range"] = request.META["HTTP_RANGE"]

        r = requests.get(
            track.stream_url,
            headers=headers,
            stream=True,
        )

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
    """Update listen time for an existing stream. Credits artist on first qualifying threshold."""
    try:
        stream = Stream.objects.get(session_id=session_id)
        new_listen_time = request.data.get('listen_time', stream.listen_time)

        # Only update if new time is greater (prevent fraud)
        if new_listen_time <= stream.listen_time:
            return Response({
                'status': 'success',
                'listen_time': stream.listen_time
            }, status=status.HTTP_200_OK)

        previously_qualified = stream.listen_time >= constants.STREAM_MIN_LISTEN_SECONDS
        now_qualifies        = new_listen_time    >= constants.STREAM_MIN_LISTEN_SECONDS

        with transaction.atomic():
            stream.listen_time = new_listen_time
            stream.save(update_fields=['listen_time'])

            # Credit artist exactly once — when stream first crosses the threshold
            if not previously_qualified and now_qualifies:
                try:
                    artist   = stream.track.artist
                    earnings = ArtistEarnings.objects.select_for_update().get_or_create(artist=artist)[0]
                    rate     = Decimal(str(constants.STREAM_ARTIST_RATE))
                    earnings.balance_credits += rate
                    earnings.total_earned    += rate
                    earnings.save(update_fields=['balance_credits', 'total_earned'])
                    print(f"✅ Stream credit: R{rate} → {artist.user.first_name} for track '{stream.track.title}'")
                except Exception as e:
                    # Don't let earnings failure break the stream update
                    print(f"⚠️ Earnings credit failed: {e}")

            # Recalculate merit score
            track = stream.track
            avg_time         = track.streams.aggregate(Avg('listen_time'))['listen_time__avg'] or 0
            unique_listeners = track.streams.aggregate(Count('session_id', distinct=True))['session_id__count']
            track.merit_score = (unique_listeners * avg_time) + track.tips.count()
            track.save(update_fields=['merit_score'])

        return Response({
            'status': 'success',
            'listen_time': stream.listen_time
        }, status=status.HTTP_200_OK)

    except Stream.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Stream not found'
        }, status=status.HTTP_404_NOT_FOUND)


# @api_view(['PATCH'])
# @permission_classes([AllowAny])
# def update_stream_api(request, session_id):
#     """Update listen time for an existing stream."""
#     try:
#         stream = Stream.objects.get(session_id=session_id)
#         listen_time = request.data.get('listen_time', stream.listen_time)
        
#         # Only update if new time is greater (prevent fraud)
#         if listen_time > stream.listen_time:
#             stream.listen_time = listen_time
#             stream.save()
            
#             # Recalculate merit score
#             track = stream.track
#             avg_time = track.streams.aggregate(Avg('listen_time'))['listen_time__avg'] or 0
#             unique_listeners = track.streams.aggregate(Count('session_id', distinct=True))['session_id__count']
#             track.merit_score = (unique_listeners * avg_time) + track.tips.count()
#             track.save()
        
#         return Response({
#             'status': 'success',
#             'listen_time': stream.listen_time
#         }, status=status.HTTP_200_OK)
        
#     except Stream.DoesNotExist:
#         return Response({
#             'status': 'error',
#             'message': 'Stream not found'
#         }, status=status.HTTP_404_NOT_FOUND)
    


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




@api_view(['POST'])
@permission_classes([IsAuthenticated])
def initiate_topup_api(request):
    """
    Listener wants to buy credits.
    Body: { "amount_rands": 50 }
    Returns Paystack authorization URL to redirect to.
    """
    amount_rands = request.data.get('amount_rands')
    if not amount_rands or float(amount_rands) <= 0:
        return Response({
            'status': 'error',
            'message': 'Please provide a valid amount.'
        }, status=status.HTTP_400_BAD_REQUEST)

    amount_rands = float(amount_rands)
    credits_to_add = amount_rands  # 1 Rand = 1 credit, simple for now

    # Paystack expects amount in kobo/cents (smallest currency unit)
    amount_in_cents = int(amount_rands * 100)

    headers = {
        'Authorization': f'Bearer {settings.PAYSTACK_SECRET_KEY}',
        'Content-Type': 'application/json',
    }

    payload = {
        'email': request.user.email,
        'amount': amount_in_cents,
        'currency': 'ZAR',
        'callback_url': f'{settings.FRONTEND_URL}/listener/wallet/callback',
        'metadata': {
            'user_id': request.user.id,
            'credits_to_add': str(credits_to_add),
            'purpose': 'credit_topup',
        }
    }



    try:
        response = requests.post(
            f'{settings.PAYSTACK_BASE_URL}/transaction/initialize',
            json=payload,
            headers=headers,
            timeout=30
        )


        data = response.json()

        if not data.get('status'):
            return Response({
                'status': 'error',
                'message': data.get('message', 'Failed to initialize payment.')
            }, status=status.HTTP_400_BAD_REQUEST)
        


        # Create pending top-up record
        CreditTopUp.objects.create(
            user=request.user,
            amount_rands=amount_rands,
            credits_added=credits_to_add,
            # paystack_ref=data['data']['reference'],
            payment_method='paystack',                # ← new field
            status='pending'
        )

        return Response({
            'status': 'success',
            'authorization_url': data['data']['authorization_url'],
            'reference': data['data']['reference'],
        }, status=status.HTTP_200_OK)

    except requests.exceptions.RequestException as e:
        return Response({
            'status': 'error',
            'message': f'Payment service error: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_tip_api(request):
    """
    Listener tips a track using credits. Instant, no Paystack.
    Body: { "track_id": 15, "credits_amount": 10 }
    """
    track_id = request.data.get('track_id')
    credits_amount = request.data.get('credits_amount')

    if not track_id or not credits_amount:
        return Response({'status': 'error', 'message': 'track_id and credits_amount required.'}, status=400)

    credits_amount = Decimal(str(credits_amount))

    if credits_amount < Decimal(str(constants.MINIMUM_TIP_AMOUNT)):  # minimum tip

        return Response({'status': 'error', 'message': f'Minimum tip is {constants.MINIMUM_TIP_AMOUNT} credits.'}, status=400)

    try:
        track = Track.objects.get(id=track_id, status='ready')
    except Track.DoesNotExist:
        return Response({'status': 'error', 'message': 'Track not found.'}, status=404)

    # platform_fee  = (credits_amount * Decimal('0.15')).quantize(Decimal('0.01'))
    platform_fee = (credits_amount * Decimal('0.18')).quantize(Decimal('0.01')) 

    artist_amount = credits_amount - platform_fee

    try:
        with transaction.atomic():
            # Lock the tipper's account row to prevent race conditions
            tipper_account = CreditAccount.objects.select_for_update().get(user=request.user)

            if tipper_account.balance < credits_amount:
                return Response({'status': 'error', 'message': 'Insufficient credits.'}, status=400)

            # Deduct from tipper
            tipper_account.balance -= credits_amount
            tipper_account.save(update_fields=['balance'])

            # Credit the artist
            earnings, _ = ArtistEarnings.objects.select_for_update().get_or_create(artist=track.artist)
            earnings.balance_credits += artist_amount
            earnings.total_earned    += artist_amount
            earnings.save(update_fields=['balance_credits', 'total_earned'])

            # Record the tip
            tip = Tip.objects.create(
                track=track,
                tipper=request.user,
                credits_amount=credits_amount,
                platform_fee=platform_fee,
                artist_amount=artist_amount,
            )

        return Response({
            'status': 'success',
            'message': f'Tipped {credits_amount} credits!',
            'new_balance': str(tipper_account.balance),
            'tip_id': tip.id,
        }, status=201)

    except CreditAccount.DoesNotExist:
        return Response({'status': 'error', 'message': 'Credit account not found.'}, status=404)



# Now register this webhook URL with Paystack:

# Go to Paystack Dashboard → Settings → API Keys & Webhooks
# Set Webhook URL to: https://your-domain.com/media_streaming_management_api/verify_topup_webhook/
# For local testing, you'll need a tunnel — use ngrok: ngrok http 8000 gives you a public URL pointing to your local server

# No proxy needed for this one — Paystack calls it directly, not through your frontend, so the standard proxy pattern doesn't apply here.

@api_view(['POST'])
@permission_classes([AllowAny])  # Paystack calls this, not a logged-in user
def verify_topup_webhook(request):
    """
    Paystack calls this after a payment completes.
    Must be idempotent — Paystack may retry this call.
    """

    event = request.data
    event_type = event.get('event')

    event = request.data
    event_type = event.get('event')

    if event_type != 'charge.success':
        # Ignore other event types for now
        return Response({'status': 'ignored'}, status=200)

    reference = event.get('data', {}).get('reference')

    if not reference:
        return Response({'status': 'error', 'message': 'No reference provided.'}, status=400)

    try:
        # topup = CreditTopUp.objects.get(paystack_ref=reference)
        topup = CreditTopUp.objects.get(reference=reference)
    except CreditTopUp.DoesNotExist:
        return Response({'status': 'error', 'message': 'Top-up record not found.'}, status=404)

    # Idempotency guard — if already processed, don't double-credit
    if topup.status == 'success':
        return Response({'status': 'success', 'message': 'Already processed.'}, status=200)

    # Verify with Paystack directly (don't trust webhook payload alone)
    headers = {'Authorization': f'Bearer {settings.PAYSTACK_SECRET_KEY}'}
    verify_url = f'{settings.PAYSTACK_BASE_URL}/transaction/verify/{reference}'

    try:
        verify_response = requests.get(verify_url, headers=headers, timeout=30)
        verify_data = verify_response.json()
    except requests.exceptions.RequestException as e:
        return Response({'status': 'error', 'message': f'Verification failed: {str(e)}'}, status=500)

    if not verify_data.get('status') or verify_data['data']['status'] != 'success':
        topup.status = 'failed'
        topup.save(update_fields=['status'])
        return Response({'status': 'error', 'message': 'Payment not verified as successful.'}, status=400)

    # Payment confirmed — credit the account atomically
    with transaction.atomic():
        topup.status = 'success'
        topup.save(update_fields=['status'])

        account, _ = CreditAccount.objects.select_for_update().get_or_create(user=topup.user)
        account.balance += topup.credits_added
        account.save(update_fields=['balance'])
    
    return Response({'status': 'success', 'message': 'Credits added.'}, status=200)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_credit_balance_api(request):
    """Returns the logged-in user's credit balance."""
    account, _ = CreditAccount.objects.get_or_create(user=request.user)
    serializer = CreditAccountSerializer(account)
    return Response({
        'status': 'success',
        'data': serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_artist_earnings_api(request):
    """Returns the logged-in artist's earnings."""
    try:
        artist = Artist.objects.get(user=request.user)
    except Artist.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Artist profile not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    earnings, _ = ArtistEarnings.objects.get_or_create(artist=artist)
    serializer = ArtistEarningsSerializer(earnings)
    return Response({
        'status': 'success',
        'data': serializer.data
    }, status=status.HTTP_200_OK)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_withdrawal_api(request):
    """Artist requests a withdrawal of their earnings."""
    try:
        artist = Artist.objects.get(user=request.user)
    except Artist.DoesNotExist:
        return Response({'status': 'error', 'message': 'Artist profile not found.'}, status=404)

    serializer = WithdrawalRequestCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({'status': 'error', 'errors': serializer.errors}, status=400)

    amount = serializer.validated_data['amount']

    if amount < Decimal(str(constants.MINIMUM_WITHDRAWAL_AMOUNT)):
        return Response({
            'status': 'error',
            'message': f'Minimum withdrawal is R{constants.MINIMUM_WITHDRAWAL_AMOUNT}.'
        }, status=400)

    try:
        with transaction.atomic():
            earnings = ArtistEarnings.objects.select_for_update().get(artist=artist)

            if earnings.balance_credits < amount:
                return Response({
                    'status': 'error',
                    'message': 'Insufficient balance.'
                }, status=400)

            # Lock the funds — deduct immediately
            earnings.balance_credits -= amount
            earnings.save(update_fields=['balance_credits'])

            withdrawal = WithdrawalRequest.objects.create(
                artist=artist,
                amount=amount,
                bank_name=serializer.validated_data.get('bank_name', ''),
                account_number=serializer.validated_data.get('account_number', ''),
                account_name=serializer.validated_data.get('account_name', ''),
                status='pending',
            )

        return Response({
            'status': 'success',
            'message': 'Withdrawal request submitted.',
            'data': WithdrawalRequestSerializer(withdrawal).data,
        }, status=201)

    except ArtistEarnings.DoesNotExist:
        return Response({'status': 'error', 'message': 'No earnings found.'}, status=404)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_my_withdrawals_api(request):
    try:
        artist = Artist.objects.get(user=request.user)
    except Artist.DoesNotExist:
        return Response({'status': 'error', 'message': 'Artist profile not found.'}, status=404)

    withdrawals = WithdrawalRequest.objects.filter(artist=artist).order_by('-requested_at')
    serializer = WithdrawalRequestSerializer(withdrawals, many=True)
    return Response({'status': 'success', 'data': serializer.data}, status=200)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_list_withdrawals_api(request):
    if request.user.user_type.name != 'Admin':
        return Response({'status': 'error', 'message': 'Unauthorized'}, status=403)

    status_filter = request.GET.get('status')  # optional ?status=pending
    withdrawals = WithdrawalRequest.objects.all().order_by('-requested_at')

    if status_filter:
        withdrawals = withdrawals.filter(status=status_filter)

    serializer = WithdrawalRequestSerializer(withdrawals, many=True)
    return Response({'status': 'success', 'data': serializer.data}, status=200)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def admin_process_withdrawal_api(request, withdrawal_id):
    if request.user.user_type.name != 'Admin':
        return Response({'status': 'error', 'message': 'Unauthorized'}, status=403)

    action = request.data.get('action')  # 'approve', 'reject', 'mark_paid'
    notes  = request.data.get('admin_notes', '')

    try:
        withdrawal = WithdrawalRequest.objects.get(id=withdrawal_id)
    except WithdrawalRequest.DoesNotExist:
        return Response({'status': 'error', 'message': 'Withdrawal not found.'}, status=404)

    if action == 'approve':
        withdrawal.status = 'approved'

    elif action == 'reject':
        # Refund the artist's balance since funds were locked at request time
        with transaction.atomic():
            earnings = ArtistEarnings.objects.select_for_update().get(artist=withdrawal.artist)
            earnings.balance_credits += withdrawal.amount
            earnings.save(update_fields=['balance_credits'])
            withdrawal.status = 'rejected'

    elif action == 'mark_paid':
        if withdrawal.status != 'approved':
            return Response({'status': 'error', 'message': 'Withdrawal must be approved first.'}, status=400)
        withdrawal.status = 'paid'
        withdrawal.processed_at = timezone.now()
        # Update lifetime totals
        earnings = ArtistEarnings.objects.get(artist=withdrawal.artist)
        earnings.total_withdrawn += withdrawal.amount
        earnings.save(update_fields=['total_withdrawn'])

    else:
        return Response({'status': 'error', 'message': 'Invalid action.'}, status=400)

    withdrawal.admin_notes = notes
    withdrawal.save()

    return Response({
        'status': 'success',
        'message': f'Withdrawal {action}d.',
        'data': WithdrawalRequestSerializer(withdrawal).data,
    }, status=200)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_artist_revenue_timeseries_api(request):
    """
    Returns last 7 days of stream count and tip earnings per day for the
    logged-in artist's tracks. Used to power the dashboard revenue chart.
    """
    try:
        artist = Artist.objects.get(user=request.user)
    
    except Artist.DoesNotExist:
        return Response({'status': 'error', 'message': 'Artist profile not found.'}, status=404)

    today = now().date()
    start_date = today - timedelta(days=6)  # last 7 days inclusive

    track_ids = Track.objects.filter(artist=artist).values_list('id', flat=True)

    # Streams per day
    stream_qs = (
        Stream.objects
        .filter(track_id__in=track_ids, timestamp__date__gte=start_date)
        .annotate(day=TruncDate('timestamp'))
        .values('day')
        .annotate(stream_count=Count('id'))
    )
    streams_by_day = {row['day']: row['stream_count'] for row in stream_qs}

    # Tips per day (artist_amount, post-fee)
    tip_qs = (
        Tip.objects
        .filter(track_id__in=track_ids, timestamp=start_date)
        .annotate(day=TruncDate('timestamp'))
        .values('day')
        .annotate(tip_total=Sum('artist_amount'))
    )
    tips_by_day = {row['day']: row['tip_total'] for row in tip_qs}

    # Build 7-day series, oldest to newest
    result = []
    for i in range(7):
        day = start_date + timedelta(days=i)
        result.append({
            'date': day.strftime('%a'),
            'full_date': day.isoformat(),
            'streams': streams_by_day.get(day, 0),
            'tips': float(tips_by_day.get(day, 0)),
            # 'downloads': 0,  # not tracked yet — placeholder until download feature exists
        })

        print(f"[Revenue Timeseries] {day}: streams={streams_by_day.get(day, 0)}, tips={tips_by_day.get(day, 0)}")
    return Response({'status': 'success', 'data': result}, status=200)