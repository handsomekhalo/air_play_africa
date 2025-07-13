// import axios from 'axios';

// // Create an Axios instance with a predefined configuration
// const backendApi = axios.create({
//   // baseURL: "http://127.0.0.1:8000",
//   // baseURL: "http://52.14.111.23",
//     baseURL: 'http://52.14.111.23', // 👈 Public IP of your EC2 instance




//   // baseURL: "56.228.24.233",


//   // csrfURL 
//   withCredentials: true, // Ensures cookies are sent with requests
//   headers: {
//     'Content-Type': 'application/json',   // The content type header for requests
//   },
//   withCredentials: true,  // Ensures cookies (including CSRF tokens) are sent along with requests
// });

// // You can add interceptors to modify requests globally if needed
// backendApi.interceptors.request.use(
//   (config) => {
//     // Set the authorization token globally
//     const token = localStorage.getItem('authToken');
//     if (token) {
//       config.headers['Authorization'] = `Bearer ${token}`;  // Add token to headers for every request
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// // You can add response interceptors to handle errors or modify response data globally
// backendApi.interceptors.response.use(
//   (response) => {
//     return response;
//   },
//   (error) => {
//     // Handle errors globally
//     return Promise.reject(error);
//   }
// );

// export default backendApi;
import axios from 'axios';

// Create an Axios instance with a predefined configuration
const backendApi = axios.create({
  // baseURL: 'http://52.14.111.23',
  baseURL: "http://127.0.0.1:8000",
    // 👈 Public IP of your EC2 instance
  withCredentials: true,          // Ensures cookies (like CSRF token) are sent
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add Authorization token
backendApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor (optional for global error handling)
backendApi.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default backendApi;
