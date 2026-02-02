import backendApi from "./backendApi";

export const getAdminArtists = async () => {
  const response = await backendApi.get("/admin/artists/");
  return response.data;
};
