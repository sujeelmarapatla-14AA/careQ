// Central API config — reads from env var in production, falls back to localhost in dev
export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('careq_token') || ''}`,
});

export const apiFetch = async (path, options = {}) => {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  });
  return res.json();
};
