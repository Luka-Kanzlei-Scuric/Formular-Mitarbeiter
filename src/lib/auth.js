// Anmeldung der Mitarbeiter. Das Token liegt nur in sessionStorage
// und verschwindet mit dem Schließen des Tabs.

// Empty/unset means same origin (Caddy in production, Vite proxy locally).
export const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL ?? '').replace(/\/$/, '');

const TOKEN_KEY = 'formular_auth_token';
export const AUTH_EXPIRED_EVENT = 'formular-auth-expired';

export const getToken = () => sessionStorage.getItem(TOKEN_KEY);

export const clearToken = () => sessionStorage.removeItem(TOKEN_KEY);

export const logout = () => {
    clearToken();
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
};

export const login = async (password) => {
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.message || `Anmeldung fehlgeschlagen (${response.status})`);
    }
    if (typeof data.token !== 'string') throw new Error('Ungültige Anmeldeantwort');
    sessionStorage.setItem(TOKEN_KEY, data.token);
};

// fetch mit Token; bei 401 wird abgemeldet und die Anmeldemaske gezeigt
export const apiFetch = async (path, options = {}) => {
    const response = await fetch(`${BACKEND_URL}${path}`, {
        ...options,
        headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${getToken()}`
        }
    });
    if (response.status === 401) {
        clearToken();
        window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    return response;
};
