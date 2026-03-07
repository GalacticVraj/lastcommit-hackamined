import { create } from 'zustand';
import api from './api';

const useAuthStore = create((set, get) => ({
    user: null,
    token: sessionStorage.getItem('erp_token') || null,
    permissions: [],
    isAuthenticated: !!sessionStorage.getItem('erp_token'),
    permissionsLoaded: false,

    login: async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        const { token, user } = res.data.data;

        sessionStorage.setItem('erp_token', token);
        sessionStorage.setItem('erp_uid', user.id);

        set({ user, token, permissions: user.permissions || ['*'], isAuthenticated: true, permissionsLoaded: true });
        return res.data;
    },

    logout: () => {
        sessionStorage.removeItem('erp_token');
        sessionStorage.removeItem('erp_uid');
        set({ user: null, token: null, permissions: [], isAuthenticated: false, permissionsLoaded: false });
        window.location.href = '/login';
    },

    /**
     * Re-hydrate user + permissions from backend when we have a token
     * but permissions[] is empty (e.g. after page refresh).
     */
    rehydrate: async () => {
        const token = sessionStorage.getItem('erp_token');
        if (!token) return;
        try {
            const res = await api.get('/auth/me');
            const user = res.data.data;
            set({
                user,
                token,
                permissions: user.permissions || ['*'],
                isAuthenticated: true,
                permissionsLoaded: true,
            });
        } catch {
            // Token expired or invalid — force logout
            sessionStorage.removeItem('erp_token');
            sessionStorage.removeItem('erp_uid');
            set({ user: null, token: null, permissions: [], isAuthenticated: false, permissionsLoaded: true });
        }
    },

    hasPermission: (permission) => {
        const { permissions, permissionsLoaded } = get();
        // While permissions haven't loaded yet, allow everything
        // (backend still validates on every request)
        if (!permissionsLoaded) return true;
        return permissions.includes('*') || permissions.includes(permission);
    }
}));

export default useAuthStore;
