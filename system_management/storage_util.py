# storage_utils.py
import boto3
from django.conf import settings
from botocore.exceptions import ClientError
import mimetypes
import pathlib

import logging
import mimetypes
from urllib.parse import quote

from django.conf import settings
from boto3.s3.transfer import TransferConfig

logger = logging.getLogger(__name__)

def get_backblaze_client():
    """Get configured Backblaze B2 client"""
    return boto3.client(
        's3',endpoint_url='https://s3.us-east-005.backblazeb2.com',
        aws_access_key_id=settings.BACK_BLAZE_KEY_ID,
        aws_secret_access_key=settings.BACK_BLAZE_APLLICATION_KEY,region_name='us-east-005'
    )



def upload_track_to_backblaze(audio_file, track_id, artist_name):
    """
    Upload and verify a completed audio object in Backblaze B2.

    Returns the public URL only after verification.
    Raises an exception if upload or verification fails.
    """

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

    s3 = get_backblaze_client()

    # Use the original uploaded file size.
    expected_size = audio_file.size

    if expected_size <= 0:
        raise ValueError("Cannot upload an empty audio file.")

    # Keep smaller audio files in a single PUT.
    # Larger files use managed multipart uploads.
    transfer_config = TransferConfig(
        multipart_threshold=64 * 1024 * 1024,
        multipart_chunksize=16 * 1024 * 1024,
        max_concurrency=2,
        use_threads=True,
        preferred_transfer_client="classic",
    )

    upload_completed = False

    try:
        audio_file.seek(0)

        logger.info(
            "Starting B2 upload: track=%s size=%s",
            track_id,
            expected_size
        )

        s3.upload_fileobj(
            Fileobj=audio_file,
            Bucket=bucket,
            Key=key,
            ExtraArgs={
                "ContentType": content_type,
                "ContentDisposition": "inline",
                "CacheControl": "public, max-age=3600",
            },
            Config=transfer_config,
        )

        upload_completed = True

        # Verify completed object
        metadata = s3.head_object(
            Bucket=bucket,
            Key=key,
        )

        actual_size = metadata["ContentLength"]

        if actual_size != expected_size:
            raise RuntimeError(
                f"Upload size mismatch: "
                f"expected={expected_size}, "
                f"actual={actual_size}"
            )

        logger.info(
            "B2 upload verified: track=%s bytes=%s",
            track_id,
            actual_size
        )

        encoded_key = quote(key, safe="/")

        url = (
            f"https://s3.us-east-005.backblazeb2.com/"
            f"{bucket}/{encoded_key}"
        )

        return url

    except Exception:
        logger.exception(
            "B2 upload or verification failed: track=%s",
            track_id
        )

        # Delete only a completed object created by this
        # attempt. Do not blindly delete an existing object.
        if upload_completed:
            try:
                s3.delete_object(
                    Bucket=bucket,
                    Key=key
                )
            except Exception:
                logger.exception(
                    "B2 cleanup failed: track=%s",
                    track_id
                )

        raise

    finally:
        audio_file.seek(0)

# def upload_track_to_backblaze(audio_file, track_id, artist_name):
#     """
#     Upload audio track to Backblaze B2.
#     Returns: Public URL or None if failed
#     """
#     bucket = settings.BACK_BLAZE_BUCKET_NAME
    
#     # Organize by artist
#     sanitized_artist = artist_name.replace(' ', '_').lower()
#     file_extension = pathlib.Path(audio_file.name).suffix
#     key = f"tracks/{sanitized_artist}/{track_id}{file_extension}"
    
#     # Guess content type
#     content_type, _ = mimetypes.guess_type(audio_file.name)
#     if not content_type:
#         content_type = 'audio/mpeg'  # Default for MP3
    
#     try:
#         s3 = get_backblaze_client()
        
#         # Upload with streaming support
#         s3.upload_fileobj(
#             audio_file,
#             bucket,
#             key,
#             ExtraArgs={
#                 'ContentType': content_type,
#                 'CacheControl': 'max-age=31536000',  # Cache for 1 year
#                 'ContentDisposition': 'inline'  # Allow streaming
#             }
#         )
        
#         # Return public URL
#         url = f"https://s3.us-east-005.backblazeb2.com/{bucket}/{key}"
#         return url
        
#     except ClientError as e:
#         print(f"[UPLOAD ERROR] {e}")
#         return None


def upload_cover_image_to_backblaze(image_file, track_id, artist_name):
    """
    Upload cover image to Backblaze B2.
    Returns: Public URL or None if failed
    """
    bucket = settings.BACK_BLAZE_BUCKET_NAME
    
    sanitized_artist = artist_name.replace(' ', '_').lower()
    file_extension = pathlib.Path(image_file.name).suffix
    key = f"covers/{sanitized_artist}/{track_id}{file_extension}"
    
    content_type, _ = mimetypes.guess_type(image_file.name)
    if not content_type:
        content_type = 'image/jpeg'
    
    try:
        s3 = get_backblaze_client()
        
        s3.upload_fileobj(
            image_file,
            bucket,
            key,
            ExtraArgs={
                'ContentType': content_type,
                'CacheControl': 'max-age=31536000',
                'ContentDisposition': 'inline'
            }
        )
        
        url = f"https://s3.us-east-005.backblazeb2.com/{bucket}/{key}"
        return url
        
    except ClientError as e:
        print(f"[UPLOAD ERROR] {e}")
        return None


def generate_presigned_stream_url(track_url, expiry=3600):
    """
    Generate presigned URL for streaming (optional, for private tracks).
    For public tracks, you can stream directly.
    """
    bucket = settings.BACK_BLAZE_BUCKET_NAME
    
    # Extract key from URL
    if bucket in track_url:
        key = track_url.split(f"{bucket}/")[-1]
    else:
        return track_url
    
    try:
        s3 = get_backblaze_client()
        
        url = s3.generate_presigned_url(
            ClientMethod='get_object',
            Params={
                'Bucket': bucket,
                'Key': key,
                'ResponseContentType': 'audio/mpeg',
                'ResponseContentDisposition': 'inline'
            },
            ExpiresIn=expiry
        )
        return url
        
    except ClientError as e:
        print(f"[PRESIGN ERROR] {e}")
        return track_url


def delete_track_from_backblaze(track_url):
    """Delete track from Backblaze B2"""
    bucket = settings.BACK_BLAZE_BUCKET_NAME
    
    if bucket not in track_url:
        return False
    
    key = track_url.split(f"{bucket}/")[-1]
    
    try:
        s3 = get_backblaze_client()
        s3.delete_object(Bucket=bucket, Key=key)
        return True
        
    except ClientError as e:
        print(f"[DELETE ERROR] {e}")
        return False