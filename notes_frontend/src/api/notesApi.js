/**
 * Notes API client.
 *
 * Environment variables (checked in order):
 * - REACT_APP_API_BASE: Base URL for backend API (e.g. https://...:3001)
 * - REACT_APP_BACKEND_URL: Base URL for backend API (fallback)
 * - REACT_APP_API_BASE_URL: Legacy/alternative name (fallback)
 *
 * Note: In Kavia preview, the container env commonly provides REACT_APP_API_BASE.
 */

const DEFAULT_BASE_URL = "http://localhost:8000";

function normalizeBaseUrl(url) {
  // Avoid accidental double slashes when concatenating `${base}${path}`.
  return url.replace(/\/+$/, "");
}

function getBaseUrl() {
  const candidates = [
    process.env.REACT_APP_API_BASE,
    process.env.REACT_APP_BACKEND_URL,
    process.env.REACT_APP_API_BASE_URL
  ];

  const found = candidates.find((v) => typeof v === "string" && v.trim().length > 0);
  return normalizeBaseUrl(found ? found.trim() : DEFAULT_BASE_URL);
}

async function request(path, options = {}) {
  const res = await fetch(`${getBaseUrl()}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  if (res.status === 204) return null;

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json() : await res.text();

  if (!res.ok) {
    const detail = (data && data.detail) ? data.detail : `Request failed (${res.status})`;
    throw new Error(detail);
  }

  return data;
}

// PUBLIC_INTERFACE
export async function listNotes() {
  /** Fetch all notes (server orders by most recently updated). */
  return request("/notes");
}

// PUBLIC_INTERFACE
export async function createNote(note) {
  /** Create a note. */
  return request("/notes", { method: "POST", body: JSON.stringify(note) });
}

// PUBLIC_INTERFACE
export async function updateNote(id, patch) {
  /** Update a note by id. */
  return request(`/notes/${id}`, { method: "PUT", body: JSON.stringify(patch) });
}

// PUBLIC_INTERFACE
export async function deleteNote(id) {
  /** Delete a note by id. */
  return request(`/notes/${id}`, { method: "DELETE" });
}
