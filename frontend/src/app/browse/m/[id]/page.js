import PublicMixPage from './PublicMixPage';


export async function generateMetadata({ params }) {
  const { id } = await params;  // ← await params first

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/dj_mix_management_api/get_public_mix_api/${id}/`,
      { cache: 'no-store' }
    );
    const json = await res.json();
    const mix = json?.data;

    if (!mix) return { title: 'AirPlay Africa' };

    return {
      title:       `${mix.title} — ${mix.dj_name} | AirPlay Africa`,
      description: mix.description || `Listen to ${mix.title} by ${mix.dj_name} on AirPlay Africa`,
      openGraph: {
        title:       `${mix.title} by ${mix.dj_name}`,
        description: mix.description || `Stream ${mix.title} on AirPlay Africa`,
        images:      mix.cover_image_url ? [{ url: mix.cover_image_url }] : [],
        type:        'music.song',
        siteName:    'AirPlay Africa',
      },
      twitter: {
        card:        'summary_large_image',
        title:       `${mix.title} by ${mix.dj_name}`,
        description: mix.description || `Stream ${mix.title} on AirPlay Africa`,
        images:      mix.cover_image_url ? [mix.cover_image_url] : [],
      },
    };
  } catch {
    return { title: 'AirPlay Africa' };
  }
}

export default async function Page({ params }) {
  const { id } = await params;  // ← await here too
  return <PublicMixPage mixId={id} />;
}