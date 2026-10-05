import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api',
  timeout: 15000
});

api.interceptors.request.use((config) => {
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');
    if (userInfo?.token) config.headers.Authorization = `Bearer ${userInfo.token}`;
  } catch {
    localStorage.removeItem('userInfo');
  }
  return config;
});

export default api;
