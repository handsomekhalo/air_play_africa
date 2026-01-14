// src/api/artist.js
'use client';


export const registerArtist = async (payload) => {
  const response = await api.post(
    '/media_streaming_management/register_artist/',
    payload,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
};
