import { create } from 'zustand';
import api from './api';

const useAuthStore = create((set, get) => ({
    user: JSON.parse(localStorage.getItem('erp_user') || 'null'),
    token: localStorage.getItem('erp_token') || null,
    permissions: JSON.parse(localStorage.getItem('erp_permissions') || '[]'),
    isAuthenticated: !!localStorage.getItem('erp_token'),

    login: async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        const { token, user } = res.data.data;
        localStorage.setItem('erp_token', token);
        localStorage.setItem('erp_user', JSON.stringify(user));
        localStorage.setItem('erp_permissions', JSON.stringify(user.permissions));
        set({ user, token, permissions: user.permissions, isAuthenticated: true });
        return res.data;
    },

    logout: () => {
        localStorage.removeItem('erp_token');
        localStorage.removeItem('erp_user');
        localStorage.removeItem('erp_permissions');
        set({ user: null, token: null, permissions: [], isAuthenticated: false });
    },

    hasPermission: (permission) => {
        const perms = get().permissions;
        return perms.includes('*') || perms.includes(permission);
    }
}));

export default useAuthStore;
