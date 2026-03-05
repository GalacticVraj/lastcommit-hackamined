import useAuthStore from '../lib/auth';

export function usePermission(module, action) {
    const hasPermission = useAuthStore(s => s.hasPermission);
    return hasPermission(`${module}.${action}`);
}

export function PermissionGate({ module, action, children, fallback = null }) {
    const hasPermission = useAuthStore(s => s.hasPermission);
    if (!hasPermission(`${module}.${action}`)) return fallback;
    return children;
}
