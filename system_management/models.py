from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.core.exceptions import ObjectDoesNotExist
from django.utils.translation import gettext_lazy as _
import system_management.constants as constants  # Assuming this has 'ADMIN', 'ARTIST', 'LISTENER'

class UserType(models.Model):
    name = models.CharField(max_length=50)

    def __str__(self):
        return self.name

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_('The Email must be set'))
        email = self.normalize_email(email)
        extra_fields.setdefault('is_active', True)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        user.save()
        return user

    def create_superuser(self, email, password, **extra_fields):
        try:
            user_type_id = UserType.objects.get(name=constants.ADMIN).id
        except ObjectDoesNotExist:
            raise ValueError(_(f'{constants.ADMIN} role not found'))
        extra_fields.update({
            'is_staff': True,
            'is_superuser': True,
            'user_type_id': user_type_id
        })
        return self.create_user(email, password, **extra_fields)

class User(AbstractUser):
    username = None
    email = models.EmailField(unique=True)
    user_type = models.ForeignKey(UserType, on_delete=models.CASCADE)

    objects = UserManager()
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []  # Removed first/last name as required; add if needed

    def __str__(self):
        return self.email

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    phone_number = models.CharField(max_length=15, blank=True)  # For M-Pesa, etc.
    location = models.CharField(max_length=255, blank=True)  # e.g., 'Nairobi, Kenya' for cultural royalties
    wallet_address = models.CharField(max_length=42, blank=True)  # For blockchain payouts
    date_created = models.DateTimeField(auto_now_add=True)
    date_modified = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email}'s profile"