// Central API config
// VITE_API_URL is set in Vercel dashboard for production.
// Falls back to Render URL, then localhost for dev.
export const BASE_URL = import.meta.env.VITE_API_URL 
  || 'https://careq.onrender.com';

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
