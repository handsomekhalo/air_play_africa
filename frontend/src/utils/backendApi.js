import axios from 'axios';

// Create an Axios instance with a predefined configuration

const backendApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});
// const backendApi = axios.create({
//   // baseURL: 'http://52.14.111.23',
//   baseURL: "http://127.0.0.1:8000",
//     // 👈 Public IP of your EC2 instance
//   withCredentials: true,          // Ensures cookies (like CSRF token) are sent
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// Request interceptor to add Authorization token
backendApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Token ${token}`;  // ← Token not Bearer
    }
    return config;
  },
  (error) => Promise.reject(error)
);