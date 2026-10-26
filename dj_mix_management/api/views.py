from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from django.db.models import Avg, Count
from django.core.signing import TimestampSigner, BadSignature, SignatureExpired
from django.core.cache import cache
from decimal import Decimal
from django.db.models import Sum, Avg, Count, Value, FloatField, DecimalField
from django.db.models.functions import Coalesce
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from dj_mix_management.models import Mix, MixTrack, MixStream, MixTip
from dj_mix_management.api.serializers import (
    DJAnalyticsSerializer, MixSerializer, MixStreamUpdateSerializer, MixUploadSerializer, MixTrackSerializer,
    MixStreamSerializer, MixTipSerializer, PublicMixSerializer
)
from system_management.backblazes3 import upload_to_backblaze_s3
from system_management.models import User
from media_streaming_management.models import CreditAccount, ArtistEarnings
from system_management import constants
from mutagen.mp3 import MP3


# ─── Upload Mix ──────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_mix_api(request):
    """DJ uploads a mix file to Backblaze B2."""
    if not request.user.is_dj:
        return Response({
            'status': 'error',
            'message': 'DJ access is required to upload mixes.'
        }, status=status.HTTP_403_FORBIDDEN)
    # if request.user.user_type.name not in ['Artist', 'DJ']:
    #     return Response({
    #         'status': 'error',
    #         'message': 'Only DJs and Artists can upload mixes.'
    #     }, status=status.HTTP_403_FORBIDDEN)

    serializer = MixUploadSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({
            'status': 'error',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    mix_file = request.FILES.get('mix_file')
    cover    = request.FILES.get('cover_image')

    try:          
            mix_file.seek(0)
            audio = MP3(mix_file)
            duration_seconds = round(audio.info.length)
            mix_file.seek(0)
    except Exception as e:
        return Response({
                'status': 'error',
                'message': f'Could not read MP3 duration: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)

    if not mix_file:
        return Response({
            'status': 'error',
            'message': 'Mix file is required.'
        }, status=status.HTTP_400_BAD_REQUEST)
        

    # Create mix record first
    mix = Mix.objects.create(
        dj          = request.user,
        title       = serializer.validated_data['title'],
        description = serializer.validated_data.get('description', ''),
        genre       = serializer.validated_data.get('genre', ''),
        duration=duration_seconds,
        status      = 'uploading',
    )

    try:
        dj_slug = f"{request.user.first_name}_{request.user.last_name}".lower().replace(' ', '_')

        # Upload mix file
        mix_key      = f"mixes/{dj_slug}/{mix.id}.mp3"
        mix_file_url = upload_to_backblaze_s3(mix_file, mix_key)

        mix.mix_file_url = mix_file_url
        mix.file_size    = mix_file.size
        mix.status       = 'ready'

        # Upload cover if provided
        if cover:
            cover_key           = f"mix_covers/{dj_slug}/{mix.id}"
            mix.cover_image_url = upload_to_backblaze_s3(cover, cover_key)

        mix.is_published = True
        mix.save()

        return Response({
            'status':  'success',
            'message': 'Mix uploaded successfully.',
            'data':    MixSerializer(mix).data
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        mix.status = 'failed'
        mix.save(update_fields=['status'])
        return Response({
            'status':  'error',
            'message': f'Upload failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_mix_detail_api(request, mix_id):
    """Returns full mix detail for the DJ who owns it."""
    try:
        mix = Mix.objects.get(id=mix_id, dj=request.user)
    except Mix.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Mix not found or you do not own this mix.'
        }, status=status.HTTP_404_NOT_FOUND)

    return Response({
        'status': 'success',
        'data': MixSerializer(mix).data
    }, status=status.HTTP_200_OK)


# ─── Get My Mixes (DJ) ───────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_my_mixes_api(request):

    if not request.user.is_dj:
        return Response({
            'status': 'error',
            'message': 'DJ access is required.'
        }, status=status.HTTP_403_FORBIDDEN)

    mixes = Mix.objects.filter(
        dj=request.user
    ).order_by('-upload_date')

    return Response({
        'status': 'success',
        'data': MixSerializer(mixes, many=True).data
    }, status=status.HTTP_200_OK)
# @api_view(['GET'])
# @permission_classes([IsAuthenticated])
# def get_my_mixes_api(request):
#     """Returns all mixes uploaded by the logged-in DJ."""
#     mixes = Mix.objects.filter(dj=request.user, status='ready')
#     return Response({
#         'status': 'success',
#         'data':   MixSerializer(mixes, many=True).data
#     }, status=status.HTTP_200_OK)


# ─── Get All Mixes (Public Browse) ───────────────────────────────
@api_view(['GET'])
@permission_classes([AllowAny])
def get_all_mixes_api(request):
    """Public — returns all published ready mixes ordered by merit score."""
    genre  = request.GET.get('genre')
    search = request.GET.get('search')

    mixes = Mix.objects.filter(status='ready', is_published=True)

    if genre:
        mixes = mixes.filter(genre__iexact=genre)
    if search:
        mixes = mixes.filter(title__icontains=search) | \
                mixes.filter(dj__first_name__icontains=search) | \
                mixes.filter(dj__last_name__icontains=search)

    mixes = mixes.order_by('-merit_score', '-upload_date')

    return Response({
        'status': 'success',
        'data':   PublicMixSerializer(mixes, many=True).data
    }, status=status.HTTP_200_OK)


# ─── Get Public Mix Detail ────────────────────────────────────────
@api_view(['GET'])
@permission_classes([AllowAny])
def get_public_mix_api(request, mix_id):
    """Public mix detail for share page."""
    try:
        mix = Mix.objects.get(id=mix_id, status='ready', is_published=True)
    except Mix.DoesNotExist:
        return Response({
            'status':  'error',
            'message': 'Mix not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    return Response({
        'status': 'success',
        'data':   PublicMixSerializer(mix).data
    }, status=status.HTTP_200_OK)


# ─── Get Mix Play Token ───────────────────────────────────────────
@api_view(['GET'])
@permission_classes([AllowAny])
def get_mix_play_token_api(request, mix_id):
    """Returns a signed play URL for a mix — same pattern as track play token."""
    try:
        mix = Mix.objects.get(id=mix_id, status='ready', is_published=True)
    except Mix.DoesNotExist:
        return Response({
            'status':  'error',
            'message': 'Mix not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    signer   = TimestampSigner()
    token    = signer.sign(str(mix_id))
    # play_url = f"/dj_mix_management_api/play_mix_with_token_api/{token}/"
    play_url = f"/dj_mix_management/play_mix_with_token/{token}/"

    return Response({
        'status':   'success',
        'play_url': play_url
    }, status=status.HTTP_200_OK)


# ─── Play Mix With Token (Backblaze Proxy) ────────────────────────
@api_view(['GET'])
@permission_classes([AllowAny])
def play_mix_with_token_api(request, token):
    """Proxies mix audio from Backblaze B2 using a signed token."""
    import requests as req

    signer = TimestampSigner()
    try:
        # mix_id = signer.unsign(token, max_age=60)
        mix_id = signer.unsign(token, max_age=600)  # 10 minutes for testing
    except (BadSignature, SignatureExpired):
        return Response({
            'status':  'error',
            'message': 'Invalid or expired play token.'
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        # mix = Mix.objects.get(id=mix_id, status='ready')
        mix = Mix.objects.get(
        id=mix_id,
        status='ready',
        is_published=True
            )
    except Mix.DoesNotExist:
        return Response({
            'status':  'error',
            'message': 'Mix not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    from django.http import StreamingHttpResponse
    headers = {}
    if 'HTTP_RANGE' in request.META:
        headers['Range'] = request.META['HTTP_RANGE']

    b2_response = req.get(mix.mix_file_url, headers=headers, stream=True)

    response = StreamingHttpResponse(
        b2_response.iter_content(chunk_size=8192),
        status=b2_response.status_code,
        content_type=b2_response.headers.get('Content-Type', 'audio/mpeg'),
    )

    for header in ['Content-Length', 'Content-Range', 'Accept-Ranges']:
        if header in b2_response.headers:
            response[header] = b2_response.headers[header]

    return response


# ─── Record Mix Stream ────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def record_mix_stream_api(request):
    """Records a mix stream session — same anti-fraud pattern as track streams."""
    ip        = request.META.get('REMOTE_ADDR')
    cache_key = f'mix_stream_rate_{ip}'
    req_count = cache.get(cache_key, 0)

    if req_count > 30:
        return Response({
            'status':  'error',
            'message': 'Rate limit exceeded.'
        }, status=status.HTTP_429_TOO_MANY_REQUESTS)

    cache.set(cache_key, req_count + 1, timeout=60)

    data = request.data.copy()
    data['ip_address'] = ip
    if request.user.is_authenticated:
        data['listener'] = request.user.id

    serializer = MixStreamSerializer(data=data)
    if serializer.is_valid():
        try:
            stream = serializer.save()

            # Update mix play count + merit score
            mix = stream.mix
            mix.play_count = (mix.play_count or 0) + 1
            avg_time         = mix.streams.aggregate(Avg('listen_time'))['listen_time__avg'] or 0
            unique_listeners = mix.streams.values('session_id').distinct().count()
            tips_count       = mix.tips.count()
            mix.merit_score  = (unique_listeners * avg_time) + tips_count
            mix.save(update_fields=['play_count', 'merit_score'])

            return Response({
                'status': 'success',
                'data':   serializer.data
            }, status=status.HTTP_201_CREATED)

        except Exception:
            return Response({
                'status':  'error',
                'message': 'Stream already recorded for this session.'
            }, status=status.HTTP_400_BAD_REQUEST)

    return Response({
        'status': 'error',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


# ─── Update Mix Stream Listen Time ───────────────────────────────
@api_view(['PATCH'])
@permission_classes([AllowAny])
def update_mix_stream_api(request, session_id):
    """Updates listen time for a mix stream session."""
    try:
        stream = MixStream.objects.get(session_id=session_id)
    except MixStream.DoesNotExist:
        return Response({
            'status':  'error',
            'message': 'Stream not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    # new_listen_time = request.data.get('listen_time', stream.listen_time)
    serializer = MixStreamUpdateSerializer(data=request.data)

    if not serializer.is_valid():
                return Response({
                    'status': 'error',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)

    new_listen_time = serializer.validated_data['listen_time']

    if new_listen_time <= stream.listen_time:
        return Response({
            'status':      'success',
            'listen_time': stream.listen_time
        }, status=status.HTTP_200_OK)

    with transaction.atomic():
        stream.listen_time = new_listen_time
        stream.save(update_fields=['listen_time'])

        # Recalculate merit score
        mix              = stream.mix
        avg_time         = mix.streams.aggregate(Avg('listen_time'))['listen_time__avg'] or 0
        unique_listeners = mix.streams.aggregate(
            Count('session_id', distinct=True)
        )['session_id__count']
        mix.merit_score  = (unique_listeners * avg_time) + mix.tips.count()
        mix.save(update_fields=['merit_score'])

    return Response({
        'status':      'success',
        'listen_time': stream.listen_time
    }, status=status.HTTP_200_OK)


# ─── Send Mix Tip ─────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_mix_tip_api(request):
    """
    Listener tips a DJ for a mix.
    DJ gets 82% after 18% platform fee. No split — Option A.
    """
    mix_id         = request.data.get('mix_id')
    credits_amount = request.data.get('credits_amount')

    if not mix_id or not credits_amount:
        return Response({
            'status':  'error',
            'message': 'mix_id and credits_amount are required.'
        }, status=status.HTTP_400_BAD_REQUEST)

    credits_amount = Decimal(str(credits_amount))

    if credits_amount < Decimal(str(constants.MINIMUM_MIX_TIP_AMOUNT)):
        return Response({
            'status':  'error',
            'message': f'Minimum tip is R{constants.MINIMUM_MIX_TIP_AMOUNT}.'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        mix = Mix.objects.get(id=mix_id, status='ready', is_published=True)
    except Mix.DoesNotExist:
        return Response({
            'status':  'error',
            'message': 'Mix not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    try:
        with transaction.atomic():
            # Deduct from tipper
            tipper_account = CreditAccount.objects.select_for_update().get(
                user=request.user
            )
            if tipper_account.balance < credits_amount:
                return Response({
                    'status':  'error',
                    'message': 'Insufficient credits.'
                }, status=status.HTTP_400_BAD_REQUEST)

            tipper_account.balance -= credits_amount
            tipper_account.save(update_fields=['balance'])

            # Calculate splits
            platform_fee = (credits_amount * Decimal('0.18')).quantize(Decimal('0.01'))
            dj_amount    = (credits_amount - platform_fee).quantize(Decimal('0.01'))

            # Credit DJ earnings
            dj_earnings, _ = ArtistEarnings.objects.select_for_update().get_or_create(
                artist__user=mix.dj
            )
            dj_earnings.balance_credits += dj_amount
            dj_earnings.total_earned    += dj_amount
            dj_earnings.save(update_fields=['balance_credits', 'total_earned'])

            # Record tip
            tip = MixTip.objects.create(
                mix            = mix,
                tipper         = request.user,
                credits_amount = credits_amount,
                dj_amount      = dj_amount,
                platform_fee   = platform_fee,
            )

            # Update merit score
            mix.merit_score = mix.merit_score + 1
            mix.save(update_fields=['merit_score'])

        return Response({
            'status':      'success',
            'message':     f'Tip of R{credits_amount} sent to {mix.dj.first_name}!',
            'new_balance': str(tipper_account.balance),
            'tip_id':      tip.id,
        }, status=status.HTTP_200_OK)

    except CreditAccount.DoesNotExist:
        return Response({
            'status':  'error',
            'message': 'Credit account not found. Please top up your wallet first.'
        }, status=status.HTTP_404_NOT_FOUND)


# ─── Get DJ Mix Tips History ─────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_dj_mix_tips_api(request):
    """Returns tip history for the logged-in DJ's mixes."""
    tips = MixTip.objects.filter(
        mix__dj=request.user
    ).select_related('mix', 'tipper').order_by('-timestamp')

    return Response({
        'status': 'success',
        'data':   MixTipSerializer(tips, many=True).data
    }, status=status.HTTP_200_OK)


# ─── Get Mix Charts ──────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([AllowAny])
def get_mix_charts_api(request):
    """Weekly mix charts ordered by merit score."""
    from django.utils.timezone import now
    from datetime import timedelta
    from django.db.models import Sum

    today      = now().date()
    start_date = today - timedelta(days=6)
    limit      = int(request.GET.get('limit', 20))

    mixes  = Mix.objects.filter(status='ready', is_published=True)
    scored = []

    for mix in mixes:
        weekly_streams = mix.streams.filter(
            timestamp__date__gte=start_date
        ).aggregate(
            unique=Count('session_id', distinct=True),
            avg_time=Avg('listen_time')
        )
        weekly_tips = mix.tips.filter(
            timestamp__date__gte=start_date
        ).count()

        weekly_score = (
            (weekly_streams['unique'] or 0) *
            (weekly_streams['avg_time'] or 0)
        ) + weekly_tips

        if weekly_score > 0:
            scored.append((weekly_score, mix))

    scored.sort(key=lambda x: x[0], reverse=True)
    scored = scored[:limit]

    result = []
    for i, (score, mix) in enumerate(scored, start=1):
        result.append({
            'rank':            i,
            'id':              mix.id,
            'title':           mix.title,
            'dj_name':         f"{mix.dj.first_name} {mix.dj.last_name}",
            'genre':           mix.genre or '',
            'cover_image_url': mix.cover_image_url or '',
            'duration':        mix.duration or 0,
            'play_count':      mix.play_count or 0,
            'merit_score':     round(score, 1),
        })

    return Response({
        'status': 'success',
        'data':   result
    }, status=status.HTTP_200_OK)


# ─── Admin — Get All Mixes ───────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_get_all_mixes_api(request):
    """Admin — view all mixes regardless of status."""
    if request.user.user_type.name != 'Admin':
        return Response({
            'status':  'error',
            'message': 'Unauthorized.'
        }, status=status.HTTP_403_FORBIDDEN)

    mixes = Mix.objects.all().order_by('-upload_date')
    return Response({
        'status': 'success',
        'data':   MixSerializer(mixes, many=True).data
    }, status=status.HTTP_200_OK)


# ─── Admin — Moderate Mix ────────────────────────────────────────
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def admin_moderate_mix_api(request, mix_id):
    """Admin approves or rejects a mix."""
    if request.user.user_type.name != 'Admin':
        return Response({
            'status':  'error',
            'message': 'Unauthorized.'
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        mix = Mix.objects.get(id=mix_id)
    except Mix.DoesNotExist:
        return Response({
            'status':  'error',
            'message': 'Mix not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    action = request.data.get('action')

    if action == 'approve':
        mix.status       = 'ready'
        mix.is_published = True
        mix.save(update_fields=['status', 'is_published'])
        message = 'Mix approved and published.'
    elif action == 'reject':
        mix.status       = 'failed'
        mix.is_published = False
        mix.save(update_fields=['status', 'is_published'])
        message = 'Mix rejected.'
    else:
        return Response({
            'status':  'error',
            'message': 'Invalid action. Use approve or reject.'
        }, status=status.HTTP_400_BAD_REQUEST)

    return Response({
        'status':  'success',
        'message': message,
        'data':    MixSerializer(mix).data
    }, status=status.HTTP_200_OK)



@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_mix_api(request, mix_id):
    """DJ deletes their own mix."""
    try:
        mix = Mix.objects.get(id=mix_id, dj=request.user)
    except Mix.DoesNotExist:
        return Response({
            'status':  'error',
            'message': 'Mix not found or you do not own this mix.'
        }, status=status.HTTP_404_NOT_FOUND)

    mix.delete()
    return Response({
        'status':  'success',
        'message': 'Mix deleted successfully.'
    }, status=status.HTTP_200_OK)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_dj_analytics_api(request):
    """Return analytics for the authenticated DJ's mixes."""

    if not request.user.is_dj:
        return Response({
            'status': 'error',
            'message': 'DJ access required.'
        }, status=status.HTTP_403_FORBIDDEN)

    mixes = Mix.objects.filter(dj=request.user)
    streams = MixStream.objects.filter(mix__dj=request.user)
    tips = MixTip.objects.filter(mix__dj=request.user)

    mix_stats = mixes.aggregate(
        total_plays=Coalesce(Sum('play_count'), 0)
    )

    stream_stats = streams.aggregate(
        total_listening_seconds=Coalesce(
            Sum('listen_time'),
            0.0
        ),
        average_listening_seconds=Coalesce(
            Avg('listen_time'),
            0.0
        ),
        unique_listeners=Count('listener', distinct=True)
    )

    tip_stats = tips.aggregate(
        total_tips=Count('id'),
        total_earnings=Coalesce(
            Sum('dj_amount'),
            Value(
                Decimal('0.00'),
                output_field=DecimalField(
                    max_digits=12,
                    decimal_places=2
                )
            )
        )
    )

    top_mixes_query = (
        mixes
        .annotate(
            total_listening_seconds=Coalesce(
                Sum('streams__listen_time'),
                0.0
            )
        )
        .order_by('-play_count', '-total_listening_seconds')[:5]
    )

    top_mixes = []

    for mix in top_mixes_query:
        mix_tip_stats = mix.tips.aggregate(
            total_tips=Count('id'),
            dj_earnings=Coalesce(
                Sum('dj_amount'),
                Value(
                    Decimal('0.00'),
                    output_field=DecimalField(
                        max_digits=12,
                        decimal_places=2
                    )
                )
            )
        )

        top_mixes.append({
            'id': mix.id,
            'title': mix.title,
            'play_count': mix.play_count or 0,
            'total_listening_seconds': mix.total_listening_seconds,
            'total_tips': mix_tip_stats['total_tips'],
            'dj_earnings': mix_tip_stats['dj_earnings']
        })

    analytics = {
        'total_mixes': mixes.count(),
        'total_plays': mix_stats['total_plays'],
        'total_listening_seconds': stream_stats[
            'total_listening_seconds'
        ],
        'average_listening_seconds': stream_stats[
            'average_listening_seconds'
        ],
        'unique_listeners': stream_stats['unique_listeners'],
        'total_tips': tip_stats['total_tips'],
        'total_earnings': tip_stats['total_earnings'],
        'top_mixes': top_mixes
    }

    serializer = DJAnalyticsSerializer(analytics)

    return Response({
        'status': 'success',
        'data': serializer.data
    }, status=status.HTTP_200_OK)
