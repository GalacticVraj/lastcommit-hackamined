import useAuthStore from '../lib/auth';

export default function PermissionGate({ permission, children }) {
    const hasPermission = useAuthStore(s => s.hasPermission);

    if (!hasPermission(permission)) {
        return null;
    }

    return children;
}
