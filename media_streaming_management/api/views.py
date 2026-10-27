import os
import json
import logging
from datetime import timedelta
from django.core import signing
from django.shortcuts import get_object_or_404
from django.utils.timezone import now

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from mutagen import File as MutagenFile
import time
import logging
import requests

from django.core import signing
from django.http import (
    HttpResponse,
    HttpResponseForbidden,
    StreamingHttpResponse,
)
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from system_management.backblazes3 import get_backblaze_client

logger = logging.getLogger(__name__)

from rest_framework import status
from rest_framework.decorators import (
    api_view,
    permission_classes,
    parser_classes,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser

logger = logging.getLogger(__name__)
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

from system_management.storage_util import upload_cover_image_to_backblaze
from system_management.ai_services import analyze_track_with_ai
from mutagen import File as MutagenFile
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import api_view, parser_classes
from media_streaming_management.api.serialziers import ArtistEarningsSerializer, CreditAccountSerializer, GetAllArtistTrackListSerializer, GetAllTracksDetailSerializer, GetSingleTrackListSerializer, TipSerializer, TrackSerializer, UploadTrackSerializer, WithdrawalRequestCreateSerializer, WithdrawalRequestSerializer
from system_management.models import UserType
from system_management.permissions import IsAdminUserType
from system_management.models import UserType
from system_management.models import UserType
User = get_user_model()
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
import hashlib
import hmac
import json
import requests
import pathlib
import mimetypes
from urllib.parse import quote

from django.conf import settings
from django.db import transaction
from django.db.models import F
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
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


def extract_audio_metadata(audio_file):
    """
    Extract metadata without creating another temporary file.
    """
    audio_file.seek(0)
    metadata = {
        "file_size": audio_file.size,
        "duration": None,
    }

    try:
        audio = MutagenFile(audio_file)

        if audio and audio.info:
            metadata["duration"] = int(audio.info.length)

    except Exception:
        logger.warning(
            "Audio metadata extraction failed",
            exc_info=True
        )

    finally:
        audio_file.seek(0)

    return metadata


def upload_audio_to_b2(audio_file, key, content_type):
    s3 = get_backblaze_client()

    audio_file.seek(0)

    logger.info(
        "[B2] Starting upload: key=%s size=%s",
        key,
        audio_file.size
    )

    s3.upload_fileobj(
        audio_file,
        settings.BACK_BLAZE_BUCKET_NAME,
        key,
        ExtraArgs={
            "ContentType": content_type,
            "ContentDisposition": "inline",
        }
    )

    logger.info("[B2] Transfer completed: %s", key)

    return s3



def verify_b2_upload(s3, key, expected_size):
    metadata = s3.head_object(
        Bucket=settings.BACK_BLAZE_BUCKET_NAME,
        Key=key
    )

    actual_size = metadata["ContentLength"]

    logger.info(
        "[B2] Verification: expected=%s actual=%s",
        expected_size,
        actual_size
    )

    if actual_size != expected_size:
        raise RuntimeError(
            f"Upload verification failed: "
            f"expected {expected_size}, got {actual_size}"
        )

    return True



def upload_track_to_backblaze(audio_file, track_id, artist_name):
    bucket = settings.BACK_BLAZE_BUCKET_NAME
    sanitized_artist = (
        artist_name.strip()
        .replace(" ", "_")
        .lower()
    )

    extension = pathlib.Path(audio_file.name).suffix.lower()

    key = f"tracks/{sanitized_artist}/{track_id}{extension}"

    content_type = (
        mimetypes.guess_type(audio_file.name)[0]
        or "application/octet-stream"
    )

    s3 = upload_audio_to_b2(
        audio_file,
        key,
        content_type
    )

    verify_b2_upload(
        s3,
        key,
        audio_file.size
    )

    encoded_key = quote(key, safe="/")

    return (
        f"https://s3.us-east-005.backblazeb2.com/"
        f"{bucket}/{encoded_key}"
    )

@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_track_api(request):
    start_time = time.monotonic()

    print("[DRF] Upload API entered", flush=True)
    print("[DRF] Files:", list(request.FILES.keys()), flush=True)
    MAX_TRACK_SIZE = 15 * 1024 * 1024

    artist = getattr(request.user, "artist", None)

    if artist is None:
        return Response({
            "status": "error",
            "message": "Only artists can upload tracks."
        }, status=403)

    serializer = UploadTrackSerializer(
        data=request.data,
        context={"request": request}
    )

    serializer.is_valid(raise_exception=True)

    audio_file = request.FILES.get("audio_file")
    print(f"Audio file received: {audio_file.name if audio_file else 'None'}")

    cover_image = request.FILES.get("cover_image")

    if not audio_file:
        return Response({
            "status": "error",
            "message": "Audio file is required."
        }, status=400)

    if audio_file.size > MAX_TRACK_SIZE:
        return Response({
            "status": "error",
            "message": "Maximum track size is 15 MB."
        }, status=413)

    if audio_file.size == 0:
        return Response({
            "status": "error",
            "message": "Audio file cannot be empty."
        }, status=400)
    track = None

    try:
        # Step 1: Create database record
        track = serializer.save(
            artist=artist,
            status="uploading"
        )

        logger.info(
            "[TRACK %s] Database record created",
            track.id
        )

        # Step 2: Extract metadata
        metadata = extract_audio_metadata(audio_file)

        track.file_size = metadata["file_size"]

        if metadata["duration"] is not None:
            track.duration = metadata["duration"]

        # Step 3: Upload audio
        artist_name = (
            f"{artist.user.first_name} "
            f"{artist.user.last_name}"
        ).strip() or f"Artist-{artist.id}"

        logger.info(
            "[TRACK %s] Starting Backblaze upload",
            track.id
        )

        print("[DRF] Starting Backblaze upload", flush=True)

        stream_url = upload_track_to_backblaze(
            audio_file,
            track.id,
            artist_name
        )
        print(
            "[DRF] Backblaze upload completed in:",
            round(time.monotonic() - start_time, 2),
            "seconds",
            flush=True
        )

        logger.info(
            "[TRACK %s] Backblaze upload verified",
            track.id
        )

        track.stream_url = stream_url

        # Step 4: Optional cover
        if cover_image:
            try:
                cover_image.seek(0)

                cover_url = upload_cover_image_to_backblaze(
                    cover_image,
                    track.id,
                    artist_name
                )

                if cover_url:
                    track.cover_image_url = cover_url

            except Exception:
                logger.exception(
                    "[TRACK %s] Cover upload failed",
                    track.id
                )

        # Step 5: Finalize
        track.status = "ready"
        track.save()

        logger.info(
            "[TRACK %s] Upload completed",
            track.id
        )

        print("[DRF] Preparing success response", flush=True)
        return Response({
            "status": "success",
            "message": "Track uploaded successfully.",
            "data": TrackSerializer(
                track,
                context={"request": request}
            ).data
        }, status=201)

    except Exception:
        logger.exception(
            "[UPLOAD] Failed for user %s",
            request.user.id
        )

        if track is not None:
            track.status = "failed"
            track.save(update_fields=["status"])

        return Response({
            "status": "error",
            "message": "Track upload failed."
        }, status=500)



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

    tracks = Track.objects.filter(artist=artist,status="ready")
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
            track = stream.track   # ← move this up first
            track.play_count = (track.play_count or 0) + 1
            avg_time = track.streams.aggregate(Avg('listen_time'))['listen_time__avg'] or 0
            unique_listeners = track.streams.values('session_id').distinct().count()
            tips_count = track.tips.count() if hasattr(track, 'tips') else 0
            track.merit_score = (unique_listeners * avg_time) + tips_count
            track.save(update_fields=['play_count', 'merit_score'])
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

    track = get_object_or_404(
        Track.objects.select_related("artist"),
        id=track_id
    )

    # Determine whether the user owns this track
    artist = getattr(request.user, "artist", None)

    is_owner = (
        artist is not None
        and track.artist_id == artist.id
    )

    # Only ready tracks are playable by other users
    if not is_owner and track.status != "ready":
        return Response({
            "status": "error",
            "message": "This track is not available for playback."
        }, status=403)

    # Ensure an audio file exists
    if not track.stream_url:
        return Response({
            "status": "error",
            "message": "This track has no audio source."
        }, status=404)

    # Generate a 5-minute signed token
    expires_at = now() + timedelta(minutes=5)

    payload = {
        "track_id": track.id,
        "exp": expires_at.timestamp(),
    }

    token = signing.dumps(payload, salt="airplay-track-stream")

    return Response({
        "status": "success",
        "play_url": (
            "/media_streaming_management_api/"
            f"play_with_token_api/{token}/"
        ),
        "expires_at": expires_at.isoformat()
    })




@api_view(["GET"])
@permission_classes([AllowAny])
def play_with_token_api(request, token):

    # 1. Validate signed playback token
    try:
     
        data = signing.loads(
    token,
    salt="airplay-track-stream",
    max_age=300
)

    except signing.SignatureExpired:
        logger.warning("Playback token expired")
        return HttpResponseForbidden("Token expired")

    except signing.BadSignature:
        logger.warning("Invalid playback token")
        return HttpResponseForbidden("Invalid token")

    # 2. Validate token payload
    if not isinstance(data, dict):
        return HttpResponseForbidden("Invalid token payload")

    track_id = data.get("track_id")
    expires_at = data.get("exp")

    if not track_id or expires_at is None:
        return HttpResponseForbidden("Invalid token payload")

    try:
        if time.time() > float(expires_at):
            return HttpResponseForbidden("Token expired")
    except (TypeError, ValueError):
        return HttpResponseForbidden("Invalid expiration")

    # 3. Retrieve track
    track = get_object_or_404(Track, id=track_id)

    if track.status != "ready":
        return HttpResponseForbidden("Track not ready")

    if not track.stream_url:
        return HttpResponseForbidden("No stream")

    # 4. Prepare range headers
    headers = {}

    range_header = request.headers.get("Range")

    if range_header:
        headers["Range"] = range_header

    # 5. Request audio from Backblaze
    try:
        upstream = requests.get(
            track.stream_url,
            headers=headers,
            stream=True,
            timeout=(10, 60),
            allow_redirects=True,
        )

    except requests.RequestException:
        logger.exception(
            "Backblaze request failed for track %s",
            track.id
        )

        return HttpResponse(
            "Audio storage temporarily unavailable",
            status=502
        )

    # 6. Inspect upstream response
    logger.info(
        "Track %s upstream status: %s",
        track.id,
        upstream.status_code
    )

    if upstream.status_code not in (200, 206):
        logger.error(
            "Backblaze rejected track %s with status %s",
            track.id,
            upstream.status_code
        )

        upstream.close()

        return HttpResponse(
            "Audio source unavailable",
            status=502
        )

    # 7. Stream and close upstream connection
    def audio_stream():
        try:
            for chunk in upstream.iter_content(chunk_size=65536):
                if chunk:
                    yield chunk
        finally:
            upstream.close()

    response = StreamingHttpResponse(
        audio_stream(),
        status=upstream.status_code,
        content_type=upstream.headers.get(
            "Content-Type",
            "audio/mpeg"
        ),
    )

    # 8. Forward streaming headers
    for header in (
        "Content-Range",
        "Content-Length",
        "Accept-Ranges",
        "ETag",
        "Last-Modified",
    ):
        if header in upstream.headers:
            response[header] = upstream.headers[header]

    if "Accept-Ranges" not in response:
        response["Accept-Ranges"] = "bytes"

    response["Cache-Control"] = "private, no-store"

    return response

# @api_view(["GET"])
# @permission_classes([AllowAny])
# def play_with_token_api(request, token):
#     try:
#         data = signing.loads(token, max_age=30)

#         if time.time() > data["exp"]:
#             return HttpResponseForbidden("Token expired")

#         track = get_object_or_404(Track, id=data["track_id"])

#         if not track.stream_url:
#             return HttpResponseForbidden("No stream")

#         headers = {}
#         if "HTTP_RANGE" in request.META:
#             headers["Range"] = request.META["HTTP_RANGE"]

#         r = requests.get(
#             track.stream_url,
#             headers=headers,
#             stream=True,
#         )

#         response = StreamingHttpResponse(
#             r.iter_content(chunk_size=8192),
#             status=r.status_code,
#             content_type=r.headers.get("Content-Type", "audio/mpeg"),
#         )

#         response["Accept-Ranges"] = "bytes"

#         if "Content-Range" in r.headers:
#             response["Content-Range"] = r.headers["Content-Range"]
#         if "Content-Length" in r.headers:
#             response["Content-Length"] = r.headers["Content-Length"]

#         return response

#     except signing.BadSignature:
#         return HttpResponseForbidden("Invalid token")


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
            # if not previously_qualified and now_qualifies:
            #     try:
            #         artist   = stream.track.artist
            #         earnings = ArtistEarnings.objects.select_for_update().get_or_create(artist=artist)[0]
            #         rate     = Decimal(str(constants.STREAM_ARTIST_RATE))
            #         earnings.balance_credits += rate
            #         earnings.total_earned    += rate
            #         earnings.save(update_fields=['balance_credits', 'total_earned'])
            #         print(f"✅ Stream credit: R{rate} → {artist.user.first_name} for track '{stream.track.title}'")
            #     except Exception as e:
            #         # Don't let earnings failure break the stream update
            #         print(f"⚠️ Earnings credit failed: {e}")

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



@api_view(['GET'])
@permission_classes([AllowAny])
def discover_tracks_api(request):
    from django.utils.timezone import now
    from datetime import timedelta

    today      = now().date()
    start_date = today - timedelta(days=6)

    # Only count streams and tips from the last 7 days
    tracks = Track.objects.filter(status='ready').prefetch_related('streams', 'tips')

    scored = []
    for track in tracks:
        weekly_streams = track.streams.filter(
            timestamp__date__gte=start_date
        ).aggregate(
            unique=Count('session_id', distinct=True),
            avg_time=Avg('listen_time')
        )
        weekly_tips = track.tips.filter(
            timestamp__date__gte=start_date
        ).count()

        weekly_score = (
            (weekly_streams['unique'] or 0) *
            (weekly_streams['avg_time'] or 0)
        ) + weekly_tips

        if weekly_score > 0:
            scored.append((weekly_score, track))

    scored.sort(key=lambda x: x[0], reverse=True)
    scored = scored[:int(request.GET.get('limit', 20))]

    result = []
    for i, (score, track) in enumerate(scored, start=1):
        result.append({
            'rank':            i,
            'id':              track.id,
            'title':           track.title,
            'artist_name':     f"{track.artist.user.first_name} {track.artist.user.last_name}",
            'genre':           track.ai_genre or track.genre or '',
            'mood':            track.ai_mood  or '',
            'cover_image_url': track.cover_image_url or '',
            'duration':        track.duration or 0,
            'bpm':             track.bpm or None,
            'play_count':      track.play_count or 0,
            'merit_score':     round(score, 1),
        })

    return Response({'status': 'success', 'data': result}, status=200)

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
    from decimal import Decimal, InvalidOperation

    try:
        amount_rands = Decimal(str(request.data.get('amount_rands')))
    except (InvalidOperation, TypeError, ValueError):
        return Response(
            {'status': 'error', 'message': 'Invalid amount'},
            status=400
        )

    if (
        not amount_rands.is_finite()
        or amount_rands <= 0
        or amount_rands.as_tuple().exponent < -2
    ):
        return Response(
            {'status': 'error', 'message': 'Invalid amount'},
            status=400
        )

    credits_to_add = amount_rands

    amount_in_cents = int(amount_rands * Decimal('100'))
    headers = {
        'Authorization': f'Bearer {settings.PAYSTACK_SECRET_KEY}',
        'Content-Type': 'application/json',
    }

    payload = {
        'email': request.user.email,
        'amount': amount_in_cents,
        'currency': 'ZAR',
        # 'callback_url': f'{settings.FRONTEND_URL}/listener/wallet/callback',
        'callback_url': f'{settings.FRONTEND_URL.rstrip("/")}/listener/wallet/callback',
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
                

    # Get reference BEFORE creating the record
        reference = data['data'].get('reference', '')

        if not reference:
            return Response({
                'status': 'error',
                'message': 'Paystack did not return a payment reference.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Create pending top-up record with real reference
        CreditTopUp.objects.create(
            user=request.user,
            amount_rands=amount_rands,
            credits_added=credits_to_add,
            reference=reference,          # ← real reference, never empty
            payment_method='paystack',
            status='pending'
        )


        return Response({
            'status': 'success',
            'authorization_url': data['data']['authorization_url'],
            'reference': reference,
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
@permission_classes([AllowAny])
def verify_topup_webhook(request):

    # 1. Verify Paystack signature using the original request body
    signature = request.headers.get('X-Paystack-Signature', '')

    expected_signature = hmac.new(
        settings.PAYSTACK_SECRET_KEY.encode('utf-8'),
        request.body,
        hashlib.sha512
    ).hexdigest()

    if not hmac.compare_digest(signature, expected_signature):
        return Response(
            {'status': 'error', 'message': 'Invalid signature'},
            status=401
        )

    # 2. Read the webhook event
    try:
        event = json.loads(request.body)
    except (ValueError, UnicodeDecodeError):
        return Response(
            {'status': 'error', 'message': 'Invalid payload'},
            status=400
        )

    if event.get('event') != 'charge.success':
        return Response({'status': 'ignored'}, status=200)

    reference = event.get('data', {}).get('reference')

    if not reference:
        return Response(
            {'status': 'error', 'message': 'Missing reference'},
            status=400
        )

    # 3. Find the pending top-up
    try:
        topup = CreditTopUp.objects.get(reference=reference)
    except CreditTopUp.DoesNotExist:
        return Response(
            {'status': 'error', 'message': 'Top-up not found'},
            status=404
        )

    if topup.status == 'success':
        return Response(
            {'status': 'success', 'message': 'Already processed'},
            status=200
        )

    # 4. Verify the payment directly with Paystack
    headers = {
        'Authorization': f'Bearer {settings.PAYSTACK_SECRET_KEY}'
    }

    try:
        verify_response = requests.get(
            f'{settings.PAYSTACK_BASE_URL}/transaction/verify/{reference}',
            headers=headers,
            timeout=30
        )
        verify_response.raise_for_status()
        verify_data = verify_response.json()

    except (requests.exceptions.RequestException, ValueError):
        return Response(
            {'status': 'error', 'message': 'Verification unavailable'},
            status=503
        )

    payment = verify_data.get('data') or {}

    if (
        verify_data.get('status') is not True
        or payment.get('status') != 'success'
        or payment.get('reference') != reference
    ):
        return Response(
            {'status': 'error', 'message': 'Payment not verified'},
            status=400
        )

    # 5. Check amount and currency
    expected_cents = int(
        Decimal(str(topup.amount_rands)) * Decimal('100')
    )

    if (
        payment.get('amount') != expected_cents
        or payment.get('currency') != 'ZAR'
    ):
        return Response(
            {'status': 'error', 'message': 'Payment details mismatch'},
            status=400
        )

    # 6. Credit the account exactly once
    with transaction.atomic():

        locked_topup = CreditTopUp.objects.select_for_update().get(
            pk=topup.pk
        )

        if locked_topup.status == 'success':
            return Response(
                {'status': 'success', 'message': 'Already processed'},
                status=200
            )

        account, _ = CreditAccount.objects.get_or_create(
            user=locked_topup.user
        )

        CreditAccount.objects.filter(pk=account.pk).update(
            balance=F('balance') + locked_topup.credits_added
        )

        locked_topup.status = 'success'
        locked_topup.save(update_fields=['status'])

    return Response(
        {'status': 'success', 'message': 'Credits added'},
        status=200
    )

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

    print(f"🔍 User: {request.user.email} | Type: {request.user.user_type.name}")
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
        .filter(track_id__in=track_ids, timestamp__date__gte=start_date)
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

    return Response({'status': 'success', 'data': result}, status=200)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_artist_track_earnings_api(request):
    """
    Returns per-track earnings breakdown for the logged-in artist.
    Earnings = qualifying streams * STREAM_ARTIST_RATE + tips received (artist_amount)
    """
    try:
        artist = Artist.objects.get(user=request.user)
    except Artist.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Artist profile not found.'
        }, status=404)

    # tracks = Track.objects.filter(artist=artist, status='ready')
    tracks = Track.objects.filter(artist=artist).order_by('-id')

    result = []
    for track in tracks:
        # Qualifying streams — listen_time >= 30s
        qualifying_streams = track.streams.filter(
            listen_time__gte=constants.STREAM_MIN_LISTEN_SECONDS
        ).count()

        stream_earnings = qualifying_streams * Decimal(str(constants.STREAM_ARTIST_RATE))

        # Tips received by this track (artist's cut after platform fee)
        tip_earnings = track.tips.aggregate(
            total=Sum('artist_amount')
        )['total'] or Decimal('0.00')

        total_earnings = stream_earnings + tip_earnings

        result.append({
            'track_id':           track.id,
            'title':              track.title,
            'play_count':         track.play_count or 0,
            'qualifying_streams': qualifying_streams,
            'stream_earnings':    str(stream_earnings),
            'tip_earnings':       str(tip_earnings),
            'total_earnings':     str(total_earnings),
            'merit_score':        track.merit_score or 0,
            'ai_genre':           track.ai_genre or track.genre or '',
            'ai_mood':            track.ai_mood or '',
        })

    return Response({
        'status': 'success',
        'data': result
    }, status=200)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_public_track_api(request, track_id):
    """
    Public track detail for share page.
    No auth required — returns safe public fields only.
    """
    track = get_object_or_404(Track, id=track_id, status='ready')
    artist = track.artist

    return Response({
        'status': 'success',
        'data': {
            'id':              track.id,
            'title':           track.title,
            'artist_name':     f"{artist.user.first_name} {artist.user.last_name}",
            'artist_id':       artist.id,
            'genre':           track.ai_genre or track.genre or '',
            'mood':            track.ai_mood or '',
            'description':     track.ai_description or '',
            'cover_image_url': track.cover_image_url or '',
            'duration':        track.duration or 0,
            'bpm':             track.bpm or None,
            'play_count':      track.play_count or 0,
            'upload_date':     track.upload_date.isoformat(),
        }
    }, status=200)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_artist_tips_api(request):
    """Returns individual tip history for the logged-in artist."""
    try:
        artist = Artist.objects.get(user=request.user)
    except Artist.DoesNotExist:
        return Response({'status': 'error', 'message': 'Artist profile not found.'}, status=404)

    tips = Tip.objects.filter(
        track__artist=artist
    ).select_related('track', 'tipper').order_by('-timestamp')

    result = []
    for tip in tips:
        result.append({
            'id':             tip.id,
            'track_id':       tip.track.id,
            'track_title':    tip.track.title,
            'tipper_name':    f"{tip.tipper.first_name} {tip.tipper.last_name}" if tip.tipper else 'Anonymous',
            'credits_amount': str(tip.credits_amount),
            'artist_amount':  str(tip.artist_amount),
            'platform_fee':   str(tip.platform_fee),
            'timestamp':      tip.timestamp.isoformat(),
        })

    return Response({'status': 'success', 'data': result}, status=200)