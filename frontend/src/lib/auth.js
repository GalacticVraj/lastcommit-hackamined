import { create } from 'zustand';
import api from './api';

const useAuthStore = create((set, get) => ({
    user: null, // Transient scope only for full user obj
    token: localStorage.getItem('erp_token') || null,
    permissions: [], // Transient scope only for massive arrays
    isAuthenticated: !!localStorage.getItem('erp_token'),

    login: async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        const { token, user } = res.data.data;

        // Strict Security: Only store opaque token and numeric ID in persistent storage
        localStorage.setItem('erp_token', token);
        localStorage.setItem('erp_uid', user.id);

        // Exclusively transient storage for massive role/permission arrays
        set({ user, token, permissions: user.permissions || [], isAuthenticated: true });
        return res.data;
    },

    logout: () => {
        localStorage.removeItem('erp_token');
        localStorage.removeItem('erp_uid');
        set({ user: null, token: null, permissions: [], isAuthenticated: false });
        // Use standard routing or reload
        window.location.href = '/login';
    },

    hasPermission: (permission) => {
        const perms = get().permissions;
        return perms.includes('*') || perms.includes(permission);
    }
}));

export default useAuthStore;
