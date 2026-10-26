'use client';

import backendApi from "@/utils/backendApi";
import { getCsrfToken } from "./csrf";

// =====================
// DJ Mixes — mirrors tracks_api_helper.js / inline calls in
// BrowseTracksComponent, TipModal, PublicTrackPage, charts/page.js
//
// All calls hit the Django PROXY layer under /dj_mix_management/
// (never /dj_mix_management_api/ directly from the frontend) —
// same non-negotiable proxy pattern used for tracks.
// =====================

// ─── Public Browse ─────────────────────────────────────────────

export const getAllMixes = async ({ genre, search } = {}) => {
  const params = new URLSearchParams();
  if (genre)  params.append('genre', genre);
  if (search) params.append('search', search);

  const query = params.toString() ? `?${params.toString()}` : '';

  const response = await backendApi.get(`/dj_mix_management/get_all_mixes/${query}`);
  return response.data;
};

export const getPublicMix = async (mixId) => {
  const response = await backendApi.get(`/dj_mix_management/get_public_mix/$    {mix_id}/`);
  return response.data;
};

export const getMixCharts = async ({ limit } = {}) => {
  const query = limit ? `?limit=${limit}` : '';
  const response = await backendApi.get(`/dj_mix_management/get_mix_charts/${query}`);
  return response.data;
};

// ─── Playback ──────────────────────────────────────────────────

export const getMixPlayToken = async (mixId) => {
  const response = await backendApi.get(`/dj_mix_management/get_mix_play_token/${mixId}/`);
  return response.data;
};

export const recordMixStream = async ({ mixId, sessionId }) => {
  const csrfToken = await getCsrfToken();
  const response = await backendApi.post(
    '/dj_mix_management/record_mix_stream/',
    { mix: mixId, session_id: sessionId, listen_time: 0 },
    { headers: { "X-CSRFToken": csrfToken } }
  );
  return response.data;
};

export const updateMixStream = async (sessionId, listenTime) => {
  const csrfToken = await getCsrfToken();
  const response = await backendApi.patch(
    `/dj_mix_management/update_mix_stream/${sessionId}/`,
    { listen_time: listenTime },
    { headers: { "X-CSRFToken": csrfToken } }
  );
  return response.data;
};

// ─── Tipping ───────────────────────────────────────────────────

export const sendMixTip = async ({ mixId, creditsAmount }) => {
  const csrfToken = await getCsrfToken();
  const response = await backendApi.post(
    '/dj_mix_management/send_mix_tip/',
    { mix_id: mixId, credits_amount: creditsAmount },
    { headers: { "X-CSRFToken": csrfToken } }
  );
  return response.data;
};

// ─── DJ (authenticated) ────────────────────────────────────────

export const uploadMix = async ({ title, description, genre, mixFile, coverImage }) => {
  const formData = new FormData();
  formData.append('title', title);
  if (description) formData.append('description', description);
  if (genre)       formData.append('genre', genre);
  formData.append('mix_file', mixFile);
  if (coverImage)  formData.append('cover_image', coverImage);

  const response = await backendApi.post('/dj_mix_management/upload_mix/', formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const getMyMixes = async () => {
  const response = await backendApi.get('/dj_mix_management/get_my_mixes/');
  return response.data;
};

export const getMixDetail = async (mixId) => {
  const response = await backendApi.get(`/dj_mix_management/get_mix_detail/${mixId}/`);
  return response.data;
};

export const getDjMixTips = async () => {
  const response = await backendApi.get('/dj_mix_management/get_dj_mix_tips/');
  return response.data;
};

export const deleteMix = async (mixId) => {
  const csrfToken = await getCsrfToken();
  const response = await backendApi.delete(`/dj_mix_management/delete_mix/${mixId}/`, {
    headers: { "X-CSRFToken": csrfToken },
  });
  return response.data;
};

// ─── Admin ─────────────────────────────────────────────────────

export const adminGetAllMixes = async () => {
  const response = await backendApi.get('/dj_mix_management/admin_get_all_mixes/');
  return response.data;
};

export const adminModerateMix = async (mixId, action) => {
  const csrfToken = await getCsrfToken();
  const response = await backendApi.patch(
    `/dj_mix_management/admin_moderate_mix/${mixId}/`,
    { action },
    { headers: { "X-CSRFToken": csrfToken } }
  );
  return response.data;
};

export const getDJAnalytics = async () => {
  const response = await backendApi.get(
    '/dj_mix_management/get_dj_analytics/'
  );

  return response.data;
};