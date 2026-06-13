from django.db import models
from django.conf import settings  # ✅ use this instead of django.contrib.auth.models.User
from django.utils import timezone
import uuid

from system_management.models import User  # For unique listener IDs


class Artist(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    bio = models.TextField(blank=True)
    location = models.CharField(max_length=100, default='Africa')  # Tie to cultural focus
    wallet_address = models.CharField(max_length=42, blank=True,  null=True, unique=True)  # For blockchain payouts (e.g., ETH/Solana)
    is_onboarded = models.BooleanField(default=False)  # ✅ NEW
    onboarding_step = models.PositiveSmallIntegerField(default=1)

    created_at = models.DateTimeField(auto_now_add=True)
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)


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


class CreditAccount(models.Model):
    user     = models.OneToOneField(User, on_delete=models.CASCADE)
    balance  = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    # balance in credits (1 credit = R1)

class CreditTopUp(models.Model):
    user          = models.ForeignKey(User, on_delete=models.CASCADE)
    amount_rands  = models.DecimalField(max_digits=10, decimal_places=2)
    credits_added = models.DecimalField(max_digits=10, decimal_places=2)
    paystack_ref  = models.CharField(max_length=100, unique=True)
    status        = models.CharField(max_length=20, default='pending')
    timestamp     = models.DateTimeField(auto_now_add=True)

class Tip(models.Model):
    track          = models.ForeignKey(Track, on_delete=models.CASCADE, related_name='tips')
    tipper         = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    credits_amount = models.DecimalField(max_digits=10, decimal_places=2)
    platform_fee   = models.DecimalField(max_digits=10, decimal_places=2)
    artist_amount  = models.DecimalField(max_digits=10, decimal_places=2)
    timestamp      = models.DateTimeField(auto_now_add=True)

class ArtistEarnings(models.Model):
    artist          = models.OneToOneField(Artist, on_delete=models.CASCADE)
    balance_credits = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_earned    = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_withdrawn = models.DecimalField(max_digits=10, decimal_places=2, default=0)


class WithdrawalRequest(models.Model):
    STATUS_CHOICES = [
        ('pending',   'Pending'),
        ('approved',  'Approved'),
        ('paid',      'Paid'),
        ('rejected',  'Rejected'),
    ]
    artist        = models.ForeignKey(Artist, on_delete=models.CASCADE, related_name='withdrawals')
    amount        = models.DecimalField(max_digits=10, decimal_places=2)
    status        = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    bank_name     = models.CharField(max_length=100, blank=True)
    account_number = models.CharField(max_length=50, blank=True)
    account_name  = models.CharField(max_length=100, blank=True)
    requested_at  = models.DateTimeField(auto_now_add=True)
    processed_at  = models.DateTimeField(null=True, blank=True)
    admin_notes   = models.TextField(blank=True)

    def __str__(self):
        return f"{self.artist.user.email} — R{self.amount} — {self.status}"