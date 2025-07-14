from django.db import models

# Create your models here.
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.core.exceptions import ObjectDoesNotExist
from django.utils.translation import gettext_lazy as _
import system_management.constants as constants

class UserType(models.Model):
    name = models.CharField(max_length=50)

    def __str__(self):
        return self.name

class UserManager(BaseUserManager):
    def create_user(self, email, password, first_name, last_name, **extra_fields):
        if not email:
            raise ValueError(_('The Email must be set'))
        email = self.normalize_email(email)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('first_name', first_name)
        extra_fields.setdefault('last_name', last_name)
        user = self.model(email=email, **extra_fields)
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
    user_created_by = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='created_users')

    objects = UserManager()
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    def __str__(self):
        return self.email

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    id_number = models.CharField(max_length=13, null=True, blank=True)
    passport_number = models.CharField(max_length=255, null=True, blank=True)
    phone_number = models.CharField(max_length=10)
    street_address = models.CharField(max_length=255)
    suburb = models.CharField(max_length=255)
    city = models.CharField(max_length=255)
    province = models.CharField(max_length=255)
    postal_code = models.CharField(max_length=5, default="")
    date_created = models.DateTimeField(auto_now_add=True)
    date_modified = models.DateTimeField(auto_now=True)
    first_login = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user}'s profile"

class Province(models.Model):
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name
