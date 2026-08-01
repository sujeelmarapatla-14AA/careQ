// Central API config — reads from env var or auto-detects origin, falls back to localhost:5000
const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined') {
    // If running on port 5000 or production domain, use same origin
    if (window.location.port === '5000' || import.meta.env.PROD) {
      return window.location.origin;
    }
  }
  return 'http://localhost:5000';
};

export const BASE_URL = getBaseUrl();

export const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('careq_token') || 'bypass'}`,
});

export const apiFetch = async (path, options = {}) => {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: { ...authHeaders(), ...(options.headers || {}) },
    });
    if (!res.ok) {
      console.warn(`API ${path} returned ${res.status}`);
      return null;
    }
    return res.json();
  } catch (err) {
    console.warn(`API ${path} unreachable at ${BASE_URL}${path}:`, err.message);
    
    // Retry with relative path if BASE_URL fetch failed
    if (typeof window !== 'undefined' && BASE_URL !== window.location.origin) {
      try {
        const relRes = await fetch(path, {
          ...options,
          headers: { ...authHeaders(), ...(options.headers || {}) },
        });
        if (relRes.ok) return relRes.json();
      } catch (relErr) {}
    }
    return null;
  }
};
