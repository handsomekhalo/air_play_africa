// src/api/artist.js
'use client';


// import api from './axios'; // your existing axios instance
import backendApi from "@/utils/backendApi";

export const getArtistProfile = async () => {
  const res = await backendApi.get(
    '/system_management/get_artist_profile/',
    { withCredentials: true }
  );

  console.log('getArtistProfile response:', res.data); // Debug log
  return res.data;
};

export const updateMyArtistProfile = async (payload, csrfToken) => {
  const res = await backendApi.patch(
    '/system_management/update_profile/',
    payload,
    {
      headers: {
        'X-CSRFToken': csrfToken,
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    }
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
