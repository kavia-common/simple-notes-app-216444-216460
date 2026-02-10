/**
 * Notes API client.
 *
 * Environment variables:
 * - REACT_APP_API_BASE_URL: Base URL for backend API (e.g. http://localhost:8000)
 */

const DEFAULT_BASE_URL = "http://localhost:8000";

function getBaseUrl() {
  const env = process.env.REACT_APP_API_BASE_URL;
  return (env && env.trim()) ? env.trim() : DEFAULT_BASE_URL;
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
