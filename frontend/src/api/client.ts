import axios from 'axios';

const api = axios.create({
  baseURL: 'https://localhost:7299/api',
});

// Antes de cada request, agrega el JWT si existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('oviq_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Si el server responde 401, limpia la sesión y redirige al login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('oviq_token');
      localStorage.removeItem('oviq_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
