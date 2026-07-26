from rest_framework import serializers
from dj_mix_management.models import Mix, MixTrack, MixStream, MixTip


class MixSerializer(serializers.ModelSerializer):
    dj_name = serializers.SerializerMethodField()

    class Meta:
        model = Mix
        fields = '__all__'
        read_only_fields = [
            'id', 'dj', 'mix_file_url', 'cover_image_url',
            'duration', 'file_size', 'status', 'play_count',
            'merit_score', 'upload_date', 'last_modified',
        ]

    def get_dj_name(self, obj):
        return f"{obj.dj.first_name} {obj.dj.last_name}"


class MixUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mix
        fields = ['title', 'description', 'genre']


class MixTrackSerializer(serializers.ModelSerializer):
    track_title     = serializers.SerializerMethodField()
    track_artist    = serializers.SerializerMethodField()

    class Meta:
        model  = MixTrack
        fields = '__all__'
        read_only_fields = ['id']

    def get_track_title(self, obj):
        return obj.track.title

    def get_track_artist(self, obj):
        return f"{obj.track.artist.user.first_name} {obj.track.artist.user.last_name}"


class MixStreamSerializer(serializers.ModelSerializer):
    class Meta:
        model  = MixStream
        fields = '__all__'
        read_only_fields = ['id', 'timestamp']


class MixTipSerializer(serializers.ModelSerializer):
    tipper_name = serializers.SerializerMethodField()
    mix_title   = serializers.SerializerMethodField()

    class Meta:
        model  = MixTip
        fields = '__all__'
        read_only_fields = [
            'id', 'dj_amount', 'platform_fee', 'timestamp'
        ]

    def get_tipper_name(self, obj):
        if obj.tipper:
            return f"{obj.tipper.first_name} {obj.tipper.last_name}"
        return 'Anonymous'

    def get_mix_title(self, obj):
        return obj.mix.title


class PublicMixSerializer(serializers.ModelSerializer):
    """For public browse and share pages — safe fields only."""
    dj_name = serializers.SerializerMethodField()

    class Meta:
        model = Mix
        fields = [
            'id', 'title', 'dj_name', 'description',
            'cover_image_url', 'duration', 'file_size',
            'genre', 'play_count', 'merit_score', 'upload_date',
        ]

    def get_dj_name(self, obj):
        return f"{obj.dj.first_name} {obj.dj.last_name}"