from django.db import models
from media_streaming_management.models import Track
from system_management.models import User
from django.utils import timezone
import uuid


class Mix(models.Model):
    STATUS_CHOICES = [
        ('uploading', 'Uploading'),
        ('ready',     'Ready'),
        ('failed',    'Failed'),
    ]

    title           = models.CharField(max_length=255)
    dj              = models.ForeignKey(
                        'system_management.User',
                        on_delete=models.CASCADE,
                        related_name='mixes'
                    )
    description     = models.TextField(blank=True, null=True)
    cover_image_url = models.URLField(blank=True, null=True)
    mix_file_url    = models.URLField(blank=True, null=True)
    duration        = models.IntegerField(default=0, help_text='Duration in seconds')
    file_size       = models.BigIntegerField(default=0, help_text='File size in bytes')
    status          = models.CharField(max_length=20, choices=STATUS_CHOICES, default='uploading')
    play_count      = models.IntegerField(default=0)
    merit_score     = models.FloatField(default=0)
    upload_date     = models.DateTimeField(default=timezone.now)
    last_modified   = models.DateTimeField(auto_now=True)
    is_published    = models.BooleanField(default=False)
    genre           = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        ordering = ['-upload_date']

    def __str__(self):
        return f"{self.title} by {self.dj.first_name} {self.dj.last_name}"


class MixTrack(models.Model):
    """Ordered tracklist for a mix — for display/attribution only."""
    mix            = models.ForeignKey(Mix, on_delete=models.CASCADE, related_name='tracklist')
    track          = models.ForeignKey(Track, on_delete=models.CASCADE, related_name='mix_appearances')
    position       = models.PositiveIntegerField(help_text='Order in the mix')
    start_time     = models.IntegerField(default=0, help_text='Seconds into the mix where this track starts')
    duration_in_mix = models.IntegerField(default=0, help_text='How long this track plays in the mix')

    class Meta:
        ordering = ['position']
        unique_together = ('mix', 'position')

    def __str__(self):
        return f"{self.mix.title} — #{self.position} {self.track.title}"


class MixStream(models.Model):
    """Records a listener session on a mix."""
    mix         = models.ForeignKey(Mix, on_delete=models.CASCADE, related_name='streams')
    listener    = models.ForeignKey(
                    'system_management.User',
                    on_delete=models.SET_NULL,
                    null=True, blank=True,
                    related_name='mix_streams'
                  )
    listen_time = models.FloatField(default=0, help_text='Seconds listened')
    session_id  = models.UUIDField(default=uuid.uuid4, unique=True)
    timestamp   = models.DateTimeField(default=timezone.now)
    ip_address  = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        unique_together = ('mix', 'session_id')

    def __str__(self):
        return f"Stream of {self.mix.title} — {self.session_id}"


class MixTip(models.Model):
    """Tip sent to a DJ for a mix. DJ gets 82% after platform fee."""
    mix            = models.ForeignKey(Mix, on_delete=models.CASCADE, related_name='tips')
    tipper         = models.ForeignKey(
                        'system_management.User',
                        on_delete=models.SET_NULL,
                        null=True,
                        related_name='mix_tips_sent'
                     )
    credits_amount = models.DecimalField(max_digits=10, decimal_places=2)
    dj_amount      = models.DecimalField(max_digits=10, decimal_places=2)
    platform_fee   = models.DecimalField(max_digits=10, decimal_places=2)
    timestamp      = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Tip of R{self.credits_amount} on {self.mix.title}"