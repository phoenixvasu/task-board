const API_URL = import.meta.env.VITE_API_URL;

export const api = {
  async get(path: string, token?: string) {
    const res = await fetch(`${API_URL}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
    });
    return res.json();
  },
  async post(path: string, data: any, token?: string) {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async put(path: string, data: any, token?: string) {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async delete(path: string, token?: string) {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
    });
    return res.json();
  },
};