import { useEffect } from 'react';
import useAuthStore from '../lib/auth';
import toast from 'react-hot-toast';

export default function useSessionTimeout(timeoutMinutes = 60) {
    const { logout, isAuthenticated } = useAuthStore();

    useEffect(() => {
        if (!isAuthenticated) return;

        let timeoutId;
        const timeoutMs = timeoutMinutes * 60 * 1000;

        const resetTimeout = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                toast.error('Session expired. Please login again.', { duration: 5000 });
                logout();
            }, timeoutMs);
        };

        // Events that indicate user activity
        const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

        // Initial setup
        resetTimeout();

        // Add event listeners
        events.forEach(event => window.addEventListener(event, resetTimeout));

        return () => {
            clearTimeout(timeoutId);
            events.forEach(event => window.removeEventListener(event, resetTimeout));
        };
    }, [isAuthenticated, logout, timeoutMinutes]);
}
