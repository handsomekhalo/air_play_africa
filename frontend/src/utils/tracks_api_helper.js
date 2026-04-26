'useclient';

import backendApi from "@/utils/backendApi";
import { getCsrfToken } from "./csrf";
// =====================
// Tracks — ADD to your existing helpers file
// =====================

export const getAllTracks = async ({ genre, mood, artist } = {}) => {
  console.log("Fetching all tracks...");

  const csrfToken = await getCsrfToken();

  // Build query string from optional filters
  const params = new URLSearchParams();
  if (genre)  params.append('genre', genre);
  if (mood)   params.append('mood', mood);
  if (artist) params.append('artist', artist);

  const query = params.toString() ? `?${params.toString()}` : '';

  const response = await backendApi.get(
    `/media_streaming_management/retrieve_all_tracks/${query}`,
    {
      headers: {
        "X-CSRFToken": csrfToken,
      },
    }
  );

  console.log("Fetched tracks:", response.data);
  return response.data;
};