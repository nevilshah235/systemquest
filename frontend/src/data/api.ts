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

// ── Sprint 2: Spaced Repetition (F-005) ──────────────────────────────────────────

export const reviewApi = {
  /** Items due right now (nextReviewAt <= now) */
  getQueue: () => api.get('/review/queue').then((r) => r.data),
  /** All active items including future ones (for queue count) */
  getFullQueue: () => api.get('/review/queue/all').then((r) => r.data),
  /** Snooze a review item by 3 days */
  snooze: (missionSlug: string) => api.post(`/review/${missionSlug}/snooze`).then((r) => r.data),
};

// ── Sprint 2: Mistake Patterns (F-003) ────────────────────────────────────────

export const patternsApi = {
  /** Fetch pattern report (auto-refreshes on server side) */
  get: () => api.get('/patterns').then((r) => r.data),
  /** Force a full pattern recompute */
  refresh: () => api.post('/patterns/refresh').then((r) => r.data),
};

/** Typed API client that unwraps axios responses automatically */
export const apiClient = {
  get: <T>(url: string) => api.get<T>(url).then((r) => r.data),
  post: <T>(url: string, data?: unknown) => api.post<T>(url, data).then((r) => r.data),
};

// ── Sprint 3: Concept Advisor (F-007) ─────────────────────────────────────────

export const conceptsApi = {
  /** Fetch personalised concept recommendations based on mistake patterns */
  getRecommendations: () => api.get('/concepts/recommendations').then((r) => r.data),
};

export default api;
