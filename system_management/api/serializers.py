from media_streaming_management.models import Artist,Stream, Tip, Track
from system_management import constants
from system_management.models import  Profile, User

from system_management import constants
from system_management.models import  User

from system_management import constants
from system_management.models import  User

from system_management.general_func_classes import BaseFormSerializer
from rest_framework import serializers
from django.contrib.auth import get_user_model
from system_management.models import UserType
from django.contrib.auth.password_validation import validate_password
from django.db import transaction


class SendEmailSerializer(BaseFormSerializer):
    """Serializer for sending email"""
    context_data = serializers.DictField(
        allow_empty=True,
        required=False,
        read_only=False,
        write_only=False,
        error_messages={
            'required': 'The context data field is required.'
        }
    )
    html_tpl_path = serializers.CharField(
        max_length=100,
        required=True,
        read_only=False,
        write_only=False,
        error_messages={
            'required': 'The html_tpl_path field is required.',
            'max_length': 'The html_tpl_path field must be less than 100 characters.'
        }
    )
    subject = serializers.CharField(
        max_length=100,
        required=True,
        read_only=False,
        write_only=False,
        error_messages={
            'required': 'The subject field is required.',
            'max_length': 'The subject field must be less than 100 characters.'
        }
    )

class UserModelSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    user_type__name = serializers.SerializerMethodField()
    last_login = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", required=False)
    date_joined = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", required=False)

    @staticmethod
    def get_user_type__name(obj):
        return obj.user_type.name if obj.user_type else None

    class Meta:
        model = User
        fields = (
            "id",
            "first_name",
            "last_name",
            "email",
            "is_active",
            "last_login",
            "date_joined",
            "user_type_id",
            "user_type__name",
        )


class ArtistSerializer(serializers.ModelSerializer):
    """Serializer for Artist profile with nested user"""
    user = UserModelSerializer(read_only=True)

    class Meta:
        model = Artist
        fields = '__all__'




class ArtistCreateSerializer(serializers.ModelSerializer):
    """Create Artist together with User"""

    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True, min_length=6)

    # Optional onboarding fields
    bio = serializers.CharField(required=False, allow_blank=True)
    location = serializers.CharField(required=False, allow_blank=True)
    wallet_address = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Artist
        fields = [
            'first_name',
            'last_name',
            'email',
            'password',
            'bio',
            'location',
            'wallet_address',
        ]

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already registered.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        first_name = validated_data.pop('first_name')
        last_name = validated_data.pop('last_name')
        email = validated_data.pop('email')
        password = validated_data.pop('password')

        # Extract optional fields with defaults
        bio = validated_data.get('bio', '')
        location = validated_data.get('location', '')
        wallet_address = validated_data.get('wallet_address', '')

        artist_type = UserType.objects.get(name__iexact='artist')

        user = User.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            user_type=artist_type,
            is_active=True
        )

        artist = Artist.objects.create(
            user=user,
            bio=bio,
            location=location,
            wallet_address=wallet_address,
            is_onboarded=False,  # ✅ critical for onboarding flow
        )

        return artist


class GetArtistProfileSerializer(serializers.ModelSerializer):
    """Serializer for Artist profile with nested user"""
    user = UserModelSerializer(read_only=True)

    class Meta:
        model = Artist
        fields = '__all__'


class UpdateArtistProfileSerializer(serializers.ModelSerializer):
    """Serializer for updating Artist profile with nested user updates"""
    # Writable user fields
    first_name = serializers.CharField(source='user.first_name', required=False)
    last_name = serializers.CharField(source='user.last_name', required=False)
    
    # Read-only user info (for response)
    user = UserModelSerializer(read_only=True)

    class Meta:
        model = Artist
        fields = '__all__'
    
    def update(self, instance, validated_data):
        # Extract user data if present
        user_data = {}
        if 'user' in validated_data:
            user_data = validated_data.pop('user')
        
        # Update user fields
        if user_data:
            user = instance.user
            user.first_name = user_data.get('first_name', user.first_name)
            user.last_name = user_data.get('last_name', user.last_name)
            user.save()
        
        # Update artist fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        return instance


class UpdateListenerProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for Listener profile update (updates base User fields).
    We use UserModelSerializer fields for the update data structure.
    """
    first_name = serializers.CharField(required=False)
    last_name = serializers.CharField(required=False)
    # Exclude fields like email and password for security/separate flow

    class Meta:
        model = User
        fields = ['first_name', 'last_name']
        
    def update(self, instance, validated_data):
        # Update User fields directly
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.save()
        return instance

# In your serializers.py

class AdminUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for Admin profile update (updates base User fields).
    """
    first_name = serializers.CharField(required=False)
    last_name = serializers.CharField(required=False)

    class Meta:
        model = User
        fields = ['first_name', 'last_name']
        
    def update(self, instance, validated_data):
        # Update User fields directly
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.save()
        return instance
    
class UserTypeModelSerializer(serializers.ModelSerializer):
    """User type model serializer for cleaning user type values"""

    class Meta:
        """Metaclass for user type model serializer."""
        model = UserType
        fields = (
            'id',
            'name'
        )


class AdminUserListSerializer(serializers.ModelSerializer):
    user_type__name = serializers.SerializerMethodField()
    last_login = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S")
    date_joined = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S")
    profile = serializers.SerializerMethodField()

    def get_user_type__name(self, obj):
        return obj.user_type.name

    def get_profile(self, obj):
        try:
            profile = Profile.objects.get(user_id=obj.id)
            return ProfileModelSerializer(profile).data
        except Profile.DoesNotExist:
            return None

    class Meta:
        model = User
        fields = (
            "id",
            "first_name",
            "last_name",
            "email",
            "is_active",
            "last_login",
            "date_joined",
            "user_type_id",
            "user_type__name",
            "profile",
        )

class GetAlltUserModelSerializer(serializers.ModelSerializer):
    """User model serializer for cleaning user values"""
    user_type__name = serializers.SerializerMethodField()
    last_login = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S")
    date_joined = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S")
    profile = serializers.SerializerMethodField()

    @staticmethod
    def get_user_type__name(obj):
        """
        Get user type name
        
        :param obj:
            object type instance
        :return:
            user type name
        """
        return obj.user_type.name

    @staticmethod
    def get_profile(obj):
        """
        Get user profile
        
        :param obj:
            object type instance
        :return:
            user profile
        """
        try:
            profile = Profile.objects.get(user_id=obj.id)
            profile = ProfileModelSerializer(profile).data
        except Profile.DoesNotExist:
            profile = ''
        return profile

    class Meta:
        """Metaclass for user model serializer."""
        model = User
        fields = (
            'id',
            'first_name',
            'last_name',
            'email',
            'is_active',
            'last_login',
            'date_joined',
            'user_type_id',
            'user_type__name',
            'profile'
        )

class ProfileModelSerializer(serializers.ModelSerializer):
    # lockout_start_time = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S")
    class Meta:
        """Metaclass for profile model serializer."""
        model = Profile
        fields = (
            'phone_number',
            'city',
            'suburb',
            'province',
            # 'first_login',
            # 'lockout_start_time',
            # 'remaining_attempts'
        )
class ListenerCreateSerializer(serializers.ModelSerializer):
    """Serializer to create Listener user"""
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'password']

    def create(self, validated_data):
        first_name = validated_data.pop('first_name')
        last_name = validated_data.pop('last_name')
        email = validated_data.pop('email')
        password = validated_data.pop('password')
        listener_type = UserType.objects.get(name='Listener')

        user = User.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            user_type=listener_type,
            is_active=True
        )
        return user


class AdminCreateSerializer(serializers.ModelSerializer):
    """Serializer to create Admin user"""
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'password']

    def create(self, validated_data):
        request_user = self.context.get('request').user
        first_name = validated_data.pop('first_name')
        last_name = validated_data.pop('last_name')
        email = validated_data.pop('email')
        password = validated_data.pop('password')
        admin_type = UserType.objects.get(name='Admin')

        user = User.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            user_type=admin_type,
            user_created_by=request_user,
            is_active=True,
            is_staff=True
        )
        return user
class GetArtistSerializer(serializers.ModelSerializer):
    user = UserModelSerializer(read_only=True)

    class Meta:
        model = Artist
        fields = '__all__'

class ListArtistSerializer(serializers.ModelSerializer):
    user = UserModelSerializer(read_only=True)
    class Meta:
        model = Artist
        fields = '__all__'


class ArtistOnboardingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Artist
        fields = [
            'bio',
            'location',
            'wallet_address',
        ]

    def validate_wallet_address(self, value):
        if value and len(value) < 10:
            raise serializers.ValidationError("Invalid wallet address.")
        return value


class ListenerRegisterSerializer(serializers.ModelSerializer):
    """
    Serializer for registering a new Listener user.
    Handles password confirmation, hashing, and UserType assignment.
    """
    confirm_password = serializers.CharField(write_only=True)
    password         = serializers.CharField(write_only=True, min_length=8)
    first_name       = serializers.CharField(required=True)
    last_name        = serializers.CharField(required=True)
    email            = serializers.EmailField(required=True)
 
    class Meta:
        model  = User
        fields = (
            'id',
            'first_name',
            'last_name',
            'email',
            'password',
            'confirm_password',
        )
 
    # ── Validation ───────────────────────────────────────────────
 
    def validate_email(self, value):
        """Reject duplicate emails with a clear message."""
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "An account with this email already exists."
            )
        return value.lower()
 
    def validate(self, attrs):
        """Passwords must match."""
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': "Passwords do not match."
            })
        return attrs
 
    # ── Create ───────────────────────────────────────────────────
 
    def create(self, validated_data):
        validated_data.pop('confirm_password')
 
        # Resolve the Listener UserType — must exist in DB
        try:
            listener_type = UserType.objects.get(name=constants.LISTENER)
        except UserType.DoesNotExist:
            raise serializers.ValidationError(
                "Listener user type is not configured. Contact support."
            )
 
        # Create user with hashed password
        user = User.objects.create_user(
            email      = validated_data['email'],
            password   = validated_data['password'],
            first_name = validated_data['first_name'],
            last_name  = validated_data['last_name'],
            user_type  = listener_type,
        )
 
        return user