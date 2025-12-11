const rawBase = import.meta.env.VITE_API_BASE_URL?.trim();
const API_BASE_URL = rawBase ? rawBase.replace(/\/+$/, '') : '';

const absolutePattern = /^https?:\/\//i;

export function apiUrl(path) {
  if (absolutePattern.test(path)) {
    return path;
  }

  if (!path.startsWith('/')) {
    console.warn('apiUrl expected a path starting with "/". Received:', path);
  }

  if (!API_BASE_URL) {
    return path;
  }

  return `${API_BASE_URL}${path}`;
}

export { API_BASE_URL };
