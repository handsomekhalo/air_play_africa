from rest_framework import serializers

from media_streaming_management.models import Artist, BlockchainLog, Stream, Tip, Track


class ArtistSerializer(serializers.ModelSerializer):
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