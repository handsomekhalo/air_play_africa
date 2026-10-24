
import axios from "axios";

const backendApi = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000",

  withCredentials: true,
});

backendApi.interceptors.request.use(
  (config) => {
    const publicEndpoints = [
      "/system_management_api/login_api/",
      "/system_management/csrf/",
      "/system_management_api/register_api/",
    ];

    const isPublicEndpoint = publicEndpoints.some(
      (endpoint) => config.url?.split("?")[0] === endpoint
    );

    // Handle file uploads separately from JSON requests.
    if (config.data instanceof FormData) {
      // Let the browser/Axios set the multipart boundary.
      config.headers.setContentType(undefined);
    }

    // Public endpoints should not receive an old token.
    if (isPublicEndpoint) {
      delete config.headers.Authorization;
      return config;
    }

    const token = localStorage.getItem("authToken");

    if (token) {
      config.headers.Authorization = `Token ${token}`;
    } else {
      delete config.headers.Authorization;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default backendApi;
