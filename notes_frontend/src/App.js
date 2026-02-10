import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import { createNote, deleteNote, listNotes, updateNote } from "./api/notesApi";

function formatTimestamp(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

// PUBLIC_INTERFACE
function App() {
  /** Notes app UI: list notes, add new, edit existing, delete. */
  const [notes, setNotes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");

  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState("");

  const selectedNote = useMemo(
    () => notes.find((n) => n.id === selectedId) || null,
    [notes, selectedId]
  );

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsBusy(true);
      setError("");
      try {
        const data = await listNotes();
        if (!isMounted) return;
        setNotes(data);
        setSelectedId(data.length ? data[0].id : null);
      } catch (e) {
        if (!isMounted) return;
        setError(e.message || "Failed to load notes");
      } finally {
        if (isMounted) setIsBusy(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedNote) {
      setDraftTitle("");
      setDraftContent("");
      return;
    }
    setDraftTitle(selectedNote.title || "");
    setDraftContent(selectedNote.content || "");
  }, [selectedNote]);

  async function handleNewNote() {
    setIsBusy(true);
    setError("");
    try {
      const created = await createNote({
        title: "Untitled Note",
        content: "Write something..."
      });
      const newNotes = [created, ...notes];
      setNotes(newNotes);
      setSelectedId(created.id);
    } catch (e) {
      setError(e.message || "Failed to create note");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSave() {
    if (!selectedNote) return;
    setIsBusy(true);
    setError("");
    try {
      const updated = await updateNote(selectedNote.id, {
        title: draftTitle,
        content: draftContent
      });
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      setSelectedId(updated.id);
    } catch (e) {
      setError(e.message || "Failed to save note");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDelete() {
    if (!selectedNote) return;
    const ok = window.confirm(`Delete "${selectedNote.title}"?`);
    if (!ok) return;

    setIsBusy(true);
    setError("");
    try {
      await deleteNote(selectedNote.id);
      setNotes((prev) => prev.filter((n) => n.id !== selectedNote.id));
      setSelectedId((prevId) => {
        if (prevId !== selectedNote.id) return prevId;
        const remaining = notes.filter((n) => n.id !== selectedNote.id);
        return remaining.length ? remaining[0].id : null;
      });
    } catch (e) {
      setError(e.message || "Failed to delete note");
    } finally {
      setIsBusy(false);
    }
  }

  const isDirty =
    !!selectedNote &&
    (draftTitle !== (selectedNote.title || "") || draftContent !== (selectedNote.content || ""));

  return (
    <div className="RetroApp">
      <header className="RetroHeader">
        <div className="RetroBrand">
          <span className="RetroBrandMark" aria-hidden="true">
            ▣
          </span>
          <div>
            <h1 className="RetroTitle">Simple Notes</h1>
            <p className="RetroSubtitle">A tiny retro notebook. No login. Just notes.</p>
          </div>
        </div>

        <div className="RetroHeaderActions">
          <button className="RetroBtn" onClick={handleNewNote} disabled={isBusy}>
            + New
          </button>
          <button className="RetroBtn Primary" onClick={handleSave} disabled={isBusy || !selectedNote || !isDirty}>
            Save
          </button>
          <button className="RetroBtn Danger" onClick={handleDelete} disabled={isBusy || !selectedNote}>
            Delete
          </button>
        </div>
      </header>

      <main className="RetroMain">
        <aside className="RetroSidebar" aria-label="Notes list">
          <div className="RetroSidebarHeader">
            <div className="RetroSidebarTitle">Notes</div>
            <div className="RetroSidebarMeta">{notes.length} total</div>
          </div>

          {isBusy && notes.length === 0 ? (
            <div className="RetroEmpty">Loading notes...</div>
          ) : notes.length === 0 ? (
            <div className="RetroEmpty">
              No notes yet.
              <button className="RetroLinkBtn" onClick={handleNewNote} disabled={isBusy}>
                Create your first note
              </button>
            </div>
          ) : (
            <ul className="RetroList">
              {notes.map((n) => (
                <li key={n.id}>
                  <button
                    className={`RetroListItem ${n.id === selectedId ? "active" : ""}`}
                    onClick={() => setSelectedId(n.id)}
                    disabled={isBusy}
                  >
                    <div className="RetroListItemTitle">{n.title}</div>
                    <div className="RetroListItemMeta">
                      <span>Updated</span>
                      <span className="RetroDot" aria-hidden="true">
                        •
                      </span>
                      <span>{formatTimestamp(n.updated_at)}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="RetroEditor" aria-label="Note editor">
          <div className="RetroEditorHeader">
            <div className="RetroStatus">
              {selectedNote ? (
                <>
                  <span className="RetroPill">ID #{selectedNote.id}</span>
                  <span className="RetroPill">Created: {formatTimestamp(selectedNote.created_at)}</span>
                  <span className="RetroPill">Updated: {formatTimestamp(selectedNote.updated_at)}</span>
                </>
              ) : (
                <span className="RetroPill">No note selected</span>
              )}
            </div>

            {error ? (
              <div className="RetroError" role="alert">
                {error}
              </div>
            ) : null}
          </div>

          <div className="RetroEditorBody">
            <label className="RetroLabel" htmlFor="title">
              Title
            </label>
            <input
              id="title"
              className="RetroInput"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              placeholder="Note title..."
              disabled={!selectedNote || isBusy}
            />

            <label className="RetroLabel" htmlFor="content">
              Content
            </label>
            <textarea
              id="content"
              className="RetroTextarea"
              value={draftContent}
              onChange={(e) => setDraftContent(e.target.value)}
              placeholder="Write your note here..."
              disabled={!selectedNote || isBusy}
            />

            <div className="RetroHintRow">
              <div className="RetroHint">
                Tip: create a note, edit it on the right, then click <strong>Save</strong>.
              </div>
              <div className="RetroHint">
                {isDirty && selectedNote ? "Unsaved changes" : selectedNote ? "All changes saved" : ""}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="RetroFooter">
        <span>Backend: set</span>{" "}
        <code>REACT_APP_API_BASE_URL</code>{" "}
        <span>to your FastAPI URL (default: http://localhost:8000)</span>
      </footer>
    </div>
  );
}

export default App;
