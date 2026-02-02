import backendApi from "./backendApi";

export const getAdminOverview = async () => {
  const response = await backendApi.get("/admin/overview/");
  return response.data;
};
