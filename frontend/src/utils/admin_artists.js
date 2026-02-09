'use client';

import backendApi from "./backendApi";

import { getCsrfToken } from "./csrf";

// =====================
// Artists
// =====================
export const getAllArtists = async () => {
  console.log("Fetching artists from backend...");

  const csrfToken = await getCsrfToken();

  const response = await backendApi.get(
    "/system_management/get_all_artists/",
    {
      headers: {
        "X-CSRFToken": csrfToken,
      },
    }
  );

  console.log("Fetched artists:", response.data);
  return response.data;
};

// =====================
// Admins
// =====================
export const getAllAdmins = async () => {
  console.log("Fetching admins from backend...");

  const csrfToken = await getCsrfToken();

  const response = await backendApi.get(
    "/system_management/get_all_admins/",
    {
      headers: {
        "X-CSRFToken": csrfToken,
      },
    }
  );

  console.log("Fetched admins:", response.data);
  return response.data;
};

// import axios from "axios";
// import { useEffect, useState } from "react";

// // Artists
// export const getAllArtists = async () => {
//   console.log("Fetching artists from backend...");
//   const response = await backendApi.get("/system_management/get_all_artists/");
//   // const response = await axios.get(`system_management/get_all_artists/`);
//   console.log("Fetched artists:", response.data);
//   return response.data;
// };

// // Admins
// export const getAllAdmins = async () => {

//   console.log("Fetching admins from backend...");
//     const response = await backendApi.get("/system_management/get_all_admins/");

//     // const response = await axios.get(`system_management/get_all_admins/`);
//   return response.data;
// };


// // utils/admin_artists.js
// export const getAdminArtists = async () => {
//   const res = await backendApi.get("/admin/artists/");
//   return res.data.artists;
// };

// // utils/admin_admins.js
// export const getAdminAdmins = async () => {
//   const res = await backendApi.get("/admin/admins/");
//   return res.data.admins;
// };

// export const getAdminArtists = async () => {
//   const response = await backendApi.get("/admin/artists/");
//   return response.data;
// };
