import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const http = axios.create({ baseURL: BASE_URL });

// Attach JWT automatically
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Generic typed GET helper used by components
export const apiClient = {
  get: async <T>(path: string): Promise<T> => {
    const res = await http.get<T>(path);
    return res.data;
  },
  post: async <T>(path: string, body?: unknown): Promise<T> => {
    const res = await http.post<T>(path, body);
    return res.data;
  },
};

export const authApi = {
  login: async (data: { email: string; password: string }) => {
    const res = await http.post('/auth/login', data);
    return res.data;
  },
  register: async (data: { email: string; username: string; password: string }) => {
    const res = await http.post('/auth/register', data);
    return res.data;
  },
  refresh: async (refreshToken: string) => {
    const res = await http.post('/auth/refresh', { refreshToken });
    return res.data;
  },
  me: async () => {
    const res = await http.get('/auth/me');
    return res.data;
  },
};

export const missionApi = {
  getAll: async () => {
    const res = await http.get('/missions');
    return res.data;
  },
  getBySlug: async (slug: string) => {
    const res = await http.get(`/missions/${slug}`);
    return res.data;
  },
  save: async (slug: string, architecture: unknown) => {
    const res = await http.post(`/missions/${slug}/save`, { architecture });
    return res.data;
  },
};

export const simulationApi = {
  run: async (missionSlug: string, architecture: unknown) => {
    const res = await http.post('/simulation/run', { missionSlug, architecture });
    return res.data;
  },
};

export const comparisonApi = {
  compare: async (missionSlug: string) => {
    const res = await http.get(`/comparison/${missionSlug}`);
    return res.data;
  },
};

export const conceptsApi = {
  getRecommendations: async () => {
    const res = await http.get('/concepts/recommendations');
    return res.data;
  },
};

export default http;
