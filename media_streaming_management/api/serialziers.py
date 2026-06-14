from rest_framework import serializers

from media_streaming_management.models import Artist, ArtistEarnings, CreditAccount, Stream, Tip, Track, WithdrawalRequest
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
        # artist_type = UserType.objects.get(name='Artist')
        artist_type = UserType.objects.get(name__iexact='artist')


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


class UploadTrackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Track
        fields = '__all__'
        read_only_fields = [
            'artist',
            'stream_url',
            'cover_image_url',
            'duration',
            'bpm',
            'file_size',
            'status',
            'play_count',
            'like_count',
            'download_count',
            'upload_date',
            'last_modified',
            'ai_genre',
            'ai_mood',
            'ai_description',
            'ai_tags',
        ]

class GetSingleTrackListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Track
        fields = '__all__'  # This is OK
        read_only_fields = [  # Must be a list, not '__all__'
            'id',
            'title',
            'genre',
            'ai_genre',
            'ai_mood',
            'cover_image_url',
            'stream_url',
            'duration',
            'artist',
        ]
class GetAllTracksDetailSerializer(serializers.ModelSerializer):
    artist_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Track
        fields = '__all__'
        read_only_fields = [
            'id',
            'stream_url',
            'cover_image_url',
            'ai_genre',
            'ai_mood',
            'ai_description',
            'ai_tags',
            'duration',
            'bpm',
            'file_size',
            'status',
            'play_count',
            'like_count',
            'download_count',
            'upload_date',
            'last_modified',
        ]
    
    def get_artist_name(self, obj):
        return f"{obj.artist.user.first_name} {obj.artist.user.last_name}"



class GetAllArtistTrackListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Track
        fields = [
            'id',
            'title',
            'genre',
            'ai_genre',
            'ai_mood',
            'cover_image_url',
            'stream_url',
            'duration',
            'artist',
        ]

class TrackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Track
        fields = '__all__'

# class StreamSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Stream
class StreamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stream
        fields = ['id', 'track', 'listener', 'listen_time', 'timestamp', 'ip_address', 'session_id']
        read_only_fields = ['id', 'timestamp', 'ip_address']

class TipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tip
        fields = '__all__'

class CreditAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = CreditAccount
        fields = ['balance']


class ArtistEarningsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArtistEarnings
        fields = ['balance_credits', 'total_earned', 'total_withdrawn']


class WithdrawalRequestSerializer(serializers.ModelSerializer):
    artist_name = serializers.SerializerMethodField()

    class Meta:
        model = WithdrawalRequest
        fields = [
            'id', 'amount', 'status', 'bank_name', 'account_number',
            'account_name', 'requested_at', 'processed_at', 'admin_notes',
            'artist_name',
        ]
        read_only_fields = ['id', 'status', 'requested_at', 'processed_at']

    def get_artist_name(self, obj):
        return f"{obj.artist.user.first_name} {obj.artist.user.last_name}"


class WithdrawalRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = WithdrawalRequest
        fields = ['amount', 'bank_name', 'account_number', 'account_name']