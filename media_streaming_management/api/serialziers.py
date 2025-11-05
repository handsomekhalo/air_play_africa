from rest_framework import serializers

from media_streaming_management.models import BlockchainLog, Stream, Tip, Track


class TrackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Track
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


# UserModelSerializer   


