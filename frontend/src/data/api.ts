import axios from 'axios';
import { Architecture } from './types';
import { useAuthStore } from '../stores/authStore';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// Attach JWT token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post('/api/auth/refresh', { refreshToken });
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        // Clear both localStorage AND Zustand store, then go to the real login route '/'
        useAuthStore.getState().logout();
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data: { email: string; username: string; password: string }) =>
    api.post('/auth/register', data).then((r) => r.data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
};

export const missionsApi = {
  list: () => api.get('/missions').then((r) => r.data),
  get: (slug: string) => api.get(`/missions/${slug}`).then((r) => r.data),
  save: (slug: string, architecture: Architecture) =>
    api.post(`/missions/${slug}/save`, { architecture }).then((r) => r.data),
};

export const simulationApi = {
  run: (missionSlug: string, architecture: Architecture) =>
    api.post('/simulation/run', { missionSlug, architecture }).then((r) => r.data),
};

export const progressApi = {
  get: () => api.get('/progress').then((r) => r.data),
};

export default api;
