from media_streaming_management.models import Artist, ArtistEarnings, CreditAccount


def ensure_creator_accounts(user):
    CreditAccount.objects.get_or_create(user=user)

    artist, _ = Artist.objects.get_or_create(user=user)

    ArtistEarnings.objects.get_or_create(artist=artist)

    return artist