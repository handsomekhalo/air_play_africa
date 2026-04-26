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




export const toggleUserActive = async (userId) => {
  const csrfToken = await getCsrfToken(); 

  const res = await backendApi.patch(
    `/system_management/toggle_user_active/${userId}/`,
    {},
    {
      headers: {
        "X-CSRFToken": csrfToken,
      },
    }
  );

  return res.data;
};


// export const toggleUserActive = async (userId) => {
//   console.log(`Toggling active status for user ID ${userId}...`);

//   const csrfToken = await getCsrfToken(); 
//   const res = await backendApi.patch(
//     `/system_management/toggle_user_active/${userId}/`,
//     {
//       headers: {
//         "X-CSRFToken": csrfToken,
//       },
//     }
//   );
//   return res.data;
// };



export const handleToggleAdmin = async (adminId) => {
  try {
    const res = await toggleUserActive(adminId);

    setArtists((prev) =>
      prev.map((a) =>
        a.id === adminId ? { ...a, is_active: res.is_active } : a
      )
    );
  } catch (err) {
    console.error("Failed to toggle user", err);
  }
};

// ADD these two functions to your existing helpers file
// (same file as getAllArtists, toggleUserActive, etc.)
 
export const getArtistProfile = async () => {
  console.log("Fetching artist profile...");
 
  const csrfToken = await getCsrfToken();
 
  const response = await backendApi.get(
    "/system_management/get_artist_profile/",
    {
      headers: {
        "X-CSRFToken": csrfToken,
      },
    }
  );
 
  console.log("Fetched artist profile:", response.data);
  return response.data;
};
 
export const updateArtistProfile = async (profileData) => {
  console.log("Updating artist profile...", profileData);
 
  const csrfToken = await getCsrfToken();
 
  const response = await backendApi.patch(
    "/system_management/update_profile/",
    profileData,
    {
      headers: {
        "X-CSRFToken": csrfToken,
      },
    }
  );
 
  console.log("Updated artist profile:", response.data);
  return response.data;
};



export const handleToggleArtist = async (artistId) => {
  try {
    const res = await toggleUserActive(artistId);

    setArtists((prev) =>
      prev.map((a) =>
        a.id === artistId ? { ...a, is_active: res.is_active } : a
      )
    );
  } catch (err) {
    console.error("Failed to toggle user", err);
  }
};
