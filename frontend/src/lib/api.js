import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
    headers: { 'Content-Type': 'application/json' }
});

import { sanitizePayload } from './sanitizeInterceptor';

// Attach token and sanitize payload
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('erp_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;

    // Deep payload sanitation using external interceptor for XSS protection
    if (config.data && typeof config.data === 'object' && !(config.data instanceof FormData)) {
        config.data = sanitizePayload(config.data);
    }

    return config;
});

// Handle 401 → redirect to login
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('erp_token');
            localStorage.removeItem('erp_uid');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
