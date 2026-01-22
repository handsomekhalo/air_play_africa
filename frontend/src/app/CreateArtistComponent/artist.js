// src/api/artist.js
'use client';


// import api from './axios'; // your existing axios instance

export const getMyArtistProfile = async () => {
  const res = await api.get(
    '/media_streaming_management/artist_profile/me/'
  );
  return res.data;
};

export const createArtistProfile = async (payload) => {
  const res = await api.post(
    '/media_streaming_management/artist_profile/',
    payload,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  return res.data;
};


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
