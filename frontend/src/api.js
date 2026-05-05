// Central API config — reads from env var in production, falls back to localhost in dev
export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
    console.warn(`API ${path} unreachable:`, err.message);
    return null;
  }
};
