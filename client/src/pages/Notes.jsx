import { useState, useEffect } from "react";
import {
  FiSun,
  FiMoon,
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiLogOut,
  FiSearch,
  FiCalendar, // <--- ADDED THIS
} from "react-icons/fi";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

export default function NotesPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
    isPublic: false,
    startTime: "",
    endTime: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const toggleDarkMode = () => setDarkMode(!darkMode);

  // --- NEW FUNCTION TO LINK GOOGLE ---
  const handleGoogleLink = () => {
    if (!token) return alert("Please login first");
    // Open backend auth route in new tab
    // NOTE: Ensure this matches your backend URL (localhost:9000)
    window.open(`https:/auth/google?token=${token}`, "_blank");
  };

  const fetchNotes = async () => {
    try {
      const res = await api.get("/api/v1/notes/getmynotes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotes(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch notes", err.message);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewNote((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic Validation for Time
    if (newNote.startTime && newNote.endTime) {
      if (new Date(newNote.startTime) >= new Date(newNote.endTime)) {
        alert("End time must be after start time");
        return;
      }
    }

    // Convert datetime-local to ISO string for backend
    const payload = {
      ...newNote,
      startTime: newNote.startTime
        ? new Date(newNote.startTime).toISOString()
        : null,
      endTime: newNote.endTime ? new Date(newNote.endTime).toISOString() : null,
    };

    try {
      if (editingId) {
        const res = await api.put(`/api/v1/notes/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const updated = res.data.data.note || res.data.data || res.data;
        setNotes(
          notes.map((note) => (note._id === editingId ? updated : note))
        );
      } else {
        const res = await api.post("/api/v1/notes/createnote", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const createdNote = res.data.data.note || res.data.data || res.data;
        setNotes([...notes, createdNote]);
      }

      setNewNote({
        title: "",
        content: "",
        isPublic: false,
        startTime: "",
        endTime: "",
      });
      setEditingId(null);
    } catch (err) {
      console.error("Error submitting note:", err.message);
      alert("Something went wrong while saving the note.");
    }
  };

  const handleEdit = (note) => {
    setNewNote({
      title: note.title,
      content: note.content,
      isPublic: note.isPublic,
      startTime: note.startTime
        ? new Date(note.startTime).toISOString().slice(0, 16)
        : "",
      endTime: note.endTime
        ? new Date(note.endTime).toISOString().slice(0, 16)
        : "",
    });
    setEditingId(note._id);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/v1/notes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotes(notes.filter((note) => note._id !== id));
    } catch (err) {
      console.error("Error deleting note:", err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post(
        "/api/v1/users/logout",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      localStorage.removeItem("token");
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err.message);
    }
  };

  const filteredNotes = notes.filter((note) => {
    const title = note.title || "";
    const content = note.content || "";
    return (
      title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setSuggestions([]);
    } else {
      const matched = notes
        .filter((n) => n.title.toLowerCase().includes(searchTerm.toLowerCase()))
        .map((n) => n.title);
      setSuggestions([...new Set(matched)].slice(0, 5));
    }
  }, [searchTerm, notes]);

  return (
    <div
      className={`fixed inset-0 overflow-y-auto ${
        darkMode ? "bg-black/65" : "bg-gradient-to-b from-black/30 to-black/70"
      }`}
    >
      <nav className="fixed top-0 left-0 z-20 p-4 sm:p-6 flex flex-wrap justify-between w-full items-center gap-4">
        <div className="flex gap-4 flex-grow flex-wrap">
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-full flex items-center gap-2"
          >
            <FiLogOut /> Logout
          </button>

          {/* --- NEW GOOGLE BUTTON --- */}
          <button
            onClick={handleGoogleLink}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-full flex items-center gap-2"
          >
            <FiCalendar /> Link Google Calendar
          </button>

          <button onClick={toggleDarkMode} className="p-2 rounded-full">
            {darkMode ? (
              <FiSun className="w-5 h-5 text-white" />
            ) : (
              <FiMoon className="w-5 h-5 text-black" />
            )}
          </button>
        </div>

        <div className="flex gap-4 items-center">
          <button
            onClick={() => navigate("/publicnotes")}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-full flex items-center gap-2"
          >
            🌍 Public Notes
          </button>

          <div className="relative flex-grow max-w-xs ml-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 pl-9 rounded-full border dark:bg-white dark:text-black"
              />
              <FiSearch className="absolute left-2.5 top-2.5 text-gray-500" />
            </div>
            {suggestions.length > 0 && (
              <div className="absolute mt-1 w-full bg-white text-white dark:bg-black/20 shadow-lg rounded-lg z-50">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-white/10"
                    onClick={() => setSearchTerm(suggestion)}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="relative z-10 pt-24 pb-4 px-4 sm:px-6 min-h-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`max-w-3xl mx-auto p-6 rounded-xl shadow-xl ${
            darkMode ? "bg-black/20" : "bg-white/80"
          } backdrop-blur-sm`}
        >
          <h1
            className={`text-2xl sm:text-3xl font-bold mb-6 ${
              darkMode ? "text-white" : "text-black"
            }`}
          >
            My Notes
          </h1>

          <form onSubmit={handleSubmit} className="mb-8 space-y-4">
            <input
              type="text"
              name="title"
              placeholder="Note title"
              value={newNote.title}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode ? "bg-white/80 text-black" : "bg-white text-black"
              }`}
              required
            />
            <textarea
              name="content"
              placeholder="Note content"
              value={newNote.content}
              onChange={handleInputChange}
              rows="3"
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode ? "bg-white/80 text-black" : "bg-white text-black"
              }`}
              required
            />
            <div className="flex gap-4">
              <div className="flex flex-col flex-grow">
                <label className={`${darkMode ? "text-white" : "text-black"}`}>
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  name="startTime"
                  value={newNote.startTime}
                  onChange={handleInputChange}
                  className="px-4 py-2 rounded-lg border"
                />
              </div>
              <div className="flex flex-col flex-grow">
                <label className={`${darkMode ? "text-white" : "text-black"}`}>
                  End Time
                </label>
                <input
                  type="datetime-local"
                  name="endTime"
                  value={newNote.endTime}
                  onChange={handleInputChange}
                  className="px-4 py-2 rounded-lg border"
                />
              </div>
            </div>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="isPublic"
                checked={newNote.isPublic}
                onChange={handleInputChange}
                className="mr-2"
              />
              <span className={`${darkMode ? "text-white" : "text-black"}`}>
                Make Public
              </span>
            </label>
            <button
              type="submit"
              className={`w-full py-3 px-4 rounded-full font-medium transition-all ${
                darkMode
                  ? "bg-white text-black hover:bg-white/70"
                  : "bg-black text-white hover:bg-black/80"
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                {editingId ? "Update Note" : "Add Note"} <FiPlus />
              </span>
            </button>
          </form>

          <div className="space-y-4 md:max-h-[400px] md:overflow-y-auto">
            {filteredNotes.map((note, index) => (
              <motion.div
                key={note._id || index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className={`p-4 rounded-lg ${
                  darkMode ? "bg-black/80 text-white" : "bg-white text-black"
                } shadow`}
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-bold">{note.title}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(note)}
                      className="hover:text-blue-500"
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      onClick={() => handleDelete(note._id)}
                      className="hover:text-red-500"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
                <p className="mt-2">{note.content}</p>
                {note.startTime && note.endTime && (
                  <p className="text-sm mt-1 italic text-gray-400">
                    {new Date(note.startTime).toLocaleString()} -{" "}
                    {new Date(note.endTime).toLocaleString()}
                  </p>
                )}
                {note.isPublic && (
                  <p className="text-sm mt-1 italic text-green-400">Public</p>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
