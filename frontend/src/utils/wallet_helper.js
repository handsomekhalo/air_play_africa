'use client';

import backendApi from './backendApi';
// =====================
// Wallet / Credits
// =====================

export const getCreditBalance = async () => {
  const response = await backendApi.get('/media_streaming_management/get_credit_balance/');
  return response.data;
};

export const initiateTopup = async (amountRands) => {
  const response = await backendApi.post('/media_streaming_management/initiate_topup/', {
    amount_rands: amountRands,
  });
  return response.data;
};

export const getMyWithdrawals = async () => {
  // Only relevant for artists, but harmless if called by listener (returns 404 gracefully handled)
  const response = await backendApi.get('/media_streaming_management/get_my_withdrawals/');
  return response.data;
};