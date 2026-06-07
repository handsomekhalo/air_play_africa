from django.db import models
from django.conf import settings  # ✅ use this instead of django.contrib.auth.models.User
from django.utils import timezone
import uuid  # For unique listener IDs


class Artist(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    bio = models.TextField(blank=True)
    location = models.CharField(max_length=100, default='Africa')  # Tie to cultural focus
    wallet_address = models.CharField(max_length=42, blank=True)  # For blockchain payouts (e.g., ETH/Solana)
    is_onboarded = models.BooleanField(default=False)  # ✅ NEW
    onboarding_step = models.PositiveSmallIntegerField(default=1)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.user.email  # ✅ safer, since you removed username from your custom User


class Track(models.Model):
    STATUS_CHOICES = [
        ('uploading', 'Uploading'),
        ('processing', 'Processing'),
        ('ready', 'Ready'),
        ('failed', 'Failed'),
    ]
    
    artist = models.ForeignKey(Artist, on_delete=models.CASCADE, related_name='tracks')
    title = models.CharField(max_length=255)
    genre = models.CharField(max_length=100, blank=True)
    album = models.CharField(max_length=255, blank=True)
    
    # Backblaze URLs
    stream_url = models.URLField(blank=True)
    cover_image_url = models.URLField(blank=True)
    
    # AI-generated metadata
    ai_genre = models.CharField(max_length=100, blank=True)
    ai_mood = models.CharField(max_length=100, blank=True)
    ai_description = models.TextField(blank=True)
    ai_tags = models.JSONField(default=list, blank=True)
    
    # Audio metadata
    duration = models.IntegerField(default=0, help_text="Duration in seconds")
    bpm = models.IntegerField(null=True, blank=True)
    file_size = models.BigIntegerField(default=0)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='uploading')
    
    # Engagement
    play_count = models.IntegerField(default=0)
    like_count = models.IntegerField(default=0)
    download_count = models.IntegerField(default=0)
    merit_score = models.FloatField(default=0.0)  # ✅ ADD THIS LINE
    # Track model additions
    is_split_enabled = models.BooleanField(default=False)
    split_confirmed  = models.BooleanField(default=False)
    
    # Timestamps
    upload_date = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-upload_date']
        indexes = [
            models.Index(fields=['artist', '-upload_date']),
            models.Index(fields=['genre']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.title} by {self.artist.user.first_name} {self.artist.user.last_name}"

class TrackContributor(models.Model):
    ROLE_CHOICES = [
        ('feature',  'Featured Artist'),
        ('producer', 'Producer'),
        ('writer',   'Writer'),
    ]
    STATUS_CHOICES = [
        ('pending',   'Pending'),
        ('accepted',  'Accepted'),
        ('rejected',  'Rejected'),
    ]
    track      = models.ForeignKey(Track, on_delete=models.CASCADE, related_name='contributors')
    user       = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    email      = models.EmailField()  # for invites before they register
    role       = models.CharField(max_length=20, choices=ROLE_CHOICES)
    percentage = models.DecimalField(max_digits=5, decimal_places=2)
    status     = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    class Meta:
        unique_together = ('track', 'email')

class Stream(models.Model):
    track = models.ForeignKey(Track, on_delete=models.CASCADE, related_name='streams')
    listener = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    listen_time = models.FloatField(default=0.0)  # Seconds listened (for merit)
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)  # For anti-fraud (detect bots)
    session_id = models.UUIDField(default=uuid.uuid4)  # Unique per session to prevent duplicates

    class Meta:
        unique_together = ('track', 'session_id')  # Prevent spam streams

    def __str__(self):
        return f"Stream of {self.track.title} at {self.timestamp}"


class Tip(models.Model):
    track = models.ForeignKey(Track, on_delete=models.CASCADE, related_name='tips')
    tipper = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)  # In USD or crypto equivalent
    timestamp = models.DateTimeField(auto_now_add=True)
    tx_hash = models.CharField(max_length=66, blank=True)  # Blockchain transaction hash for verification

    def __str__(self):
        return f"Tip of {self.amount} for {self.track.title}"


class BlockchainLog(models.Model):
    related_model = models.CharField(max_length=50)  # e.g., 'Tip' or 'Payout'
    related_id = models.IntegerField()
    tx_hash = models.CharField(max_length=66)
    chain = models.CharField(max_length=20, default='ethereum')  # Or 'solana'
    status = models.CharField(max_length=20, default='pending')  # pending/confirmed/failed
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Log {self.tx_hash} for {self.related_model} {self.related_id}"
