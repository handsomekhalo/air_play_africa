import backendApi from "./backendApi";

export const getAdminOverview = async () => {
  const response = await backendApi.get("/system_management/get_admin_overview/");
  return response.data.data;  // ← note .data.data — response wraps in { status, data: {...} }
};
// import backendApi from "./backendApi";

// export const getAdminOverview = async () => {
//   const response = await backendApi.get("/admin/overview/");
//   return response.data;
// };
