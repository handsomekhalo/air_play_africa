from rest_framework import serializers

from media_streaming_management.models import Artist, BlockchainLog, Stream, Tip, Track
from system_management.api.serializers import UserModelSerializer
from system_management.models import Profile, User, UserType


# UserModelSerializer   


class ArtistSerializer(serializers.ModelSerializer):
    """Serializer for Artist profile with nested user"""
    user = UserModelSerializer(read_only=True)

    class Meta:
        model = Artist
        fields = '__all__'


class ArtistCreateSerializer(serializers.ModelSerializer):
    """Serializer to create Artist along with User"""
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = Artist
        fields = ['first_name', 'last_name', 'email', 'password', 'bio', 'location', 'wallet_address']

    def create(self, validated_data):
        first_name = validated_data.pop('first_name')
        last_name = validated_data.pop('last_name')
        email = validated_data.pop('email')
        password = validated_data.pop('password')
        artist_type = UserType.objects.get(name='Artist')

        user = User.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            user_type=artist_type,
            is_active=True
        )
        artist = Artist.objects.create(user=user, **validated_data)
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



class UserTypeModelSerializer(serializers.ModelSerializer):
    """User type model serializer for cleaning user type values"""

    class Meta:
        """Metaclass for user type model serializer."""
        model = UserType
        fields = (
            'id',
            'name'
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

class TrackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Track
        fields = '__all__'

class StreamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stream
        fields = '__all__'

class TipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tip
        fields = '__all__'

class BlockchainLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlockchainLog
        fields = '__all__'