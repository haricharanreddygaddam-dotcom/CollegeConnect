import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cc_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Remove stale authentication state. Protected routes will redirect
      // to the login page once AuthProvider observes the missing token.
      localStorage.removeItem('cc_token');
      window.dispatchEvent(new Event('cc:auth-expired'));
    }

    return Promise.reject(error);
  },
);

export default api;
