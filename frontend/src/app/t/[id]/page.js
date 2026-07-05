import PublicTrackPage from './PublicTrackPage';


export async function generateMetadata({ params }) {
  const { id } = await params;  // ← await params first

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/media_streaming_management_api/get_public_track_api/${id}/`,
      { cache: 'no-store' }
    );
    const json = await res.json();
    const track = json?.data;

    if (!track) return { title: 'AirPlay Africa' };

    return {
      title:       `${track.title} — ${track.artist_name} | AirPlay Africa`,
      description: track.description || `Listen to ${track.title} by ${track.artist_name} on AirPlay Africa`,
      openGraph: {
        title:       `${track.title} by ${track.artist_name}`,
        description: track.description || `Stream ${track.title} on AirPlay Africa`,
        images:      track.cover_image_url ? [{ url: track.cover_image_url }] : [],
        type:        'music.song',
        siteName:    'AirPlay Africa',
      },
      twitter: {
        card:        'summary_large_image',
        title:       `${track.title} by ${track.artist_name}`,
        description: track.description || `Stream ${track.title} on AirPlay Africa`,
        images:      track.cover_image_url ? [track.cover_image_url] : [],
      },
    };
  } catch {
    return { title: 'AirPlay Africa' };
  }
}

export default async function Page({ params }) {
  const { id } = await params;  // ← await here too
  return <PublicTrackPage trackId={id} />;
}