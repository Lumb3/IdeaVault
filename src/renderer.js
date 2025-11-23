// renderer.js
const newNoteBtn = document.getElementById("newNoteBtn");
const deleteBtn = document.getElementById("deleteBtn");
const notesList = document.getElementById("notesList");
const noteTitle = document.getElementById("noteTitle");
const noteContent = document.getElementById("noteContent");
const searchInput = document.getElementById("searchInput");
const wordCount = document.getElementById("wordCount");
const lastSaved = document.getElementById("lastSaved");
const toggle = document.querySelector('.toggle-wrap');
const darkMode = document.getElementById("darkModeLink");

// toggle dark or light mode
const userTheme = localStorage.getItem('theme'); // gets the current theme
if (userTheme == 'dark') {
  darkMode.disabled = false; // darkMode is applied
  toggle.classList.add('active');
}
toggle.addEventListener("click", (event) => {
  if (darkMode.disabled) { // If darkMode disabled 
    darkMode.disabled = false; // then enable the darkmode, enable the darkMode.css 
    toggle.classList.add('active');
    localStorage.setItem('theme', 'dark'); // setting the current theme to dark in the local storage
  } else {
    darkMode.disabled = true;
    toggle.classList.remove('active');
    localStorage.setItem('theme', 'light'); // setting the current theme to light in the local storage
  }
})


// State
let notes = [];
let currentNoteId = null;
let saveTimeout = null;

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadNotes();
  setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
  newNoteBtn.addEventListener("click", createNewNote);
  deleteBtn.addEventListener("click", deleteCurrentNote);
  noteTitle.addEventListener("input", handleNoteEdit);
  noteContent.addEventListener("input", handleNoteEdit);
  searchInput.addEventListener("input", handleSearch);
  noteContent.addEventListener("input", updateWordCount);
  document.querySelector(".reset-btn").addEventListener("click", exit);
}

// Save and exit
async function exit() {
  try {
    await saveNotes();
    window.authAPI.quit();
  } catch (e) {
    console.log("Error in quitting: ", e);
  }
}

// Load Notes from Storage
async function loadNotes() {
  try {
    const data = await window.authAPI.load(); // returns array of dataf
    notes = data || [];
    renderNotesList();
    if (notes.length > 0) {
      selectNote(notes[0].id);
    }
  } catch (error) {
    console.error("Failed to load notes:", error);
    // Optionally, show user-friendly message
  }
}

// Save Notes to Storage
async function saveNotes() {
  try {
    await window.authAPI.save(notes);
    updateLastSaved();
  } catch (error) {
    console.error("Failed to save notes:", error);
  }
}

// Create New Note
function createNewNote() {
  clearTimeout(saveTimeout);
  const newNote = {
    id: Date.now().toString(),
    title: "Untitled",
    content: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  notes.unshift(newNote);
  renderNotesList();
  selectNote(newNote.id);
  saveNotes();

  noteTitle.focus();
}

// Delete Current Note
async function deleteCurrentNote() {
  if (!currentNoteId) return;

  const index = notes.findIndex((n) => n.id === currentNoteId);
  if (index === -1) return;

  // Clear any pending saves
  clearTimeout(saveTimeout);

  try {
    await window.authAPI.delete(currentNoteId);
    notes.splice(index, 1);
    renderNotesList();
    if (notes.length > 0) {
      selectNote(notes[0].id);
    } else {
      clearEditor();
    }
  } catch (error) {
    console.error("Failed to delete note: ", error);
  }
}

// Select Note
function selectNote(id) {
  currentNoteId = id;
  const note = notes.find((n) => n.id === id);

  if (note) {
    noteTitle.value = note.title;
    noteContent.value = note.content;
    updateWordCount();

    // Update active state in list
    document.querySelectorAll(".note-item").forEach((item) => {
      item.classList.toggle("active", item.dataset.id === id);
    });
  }
}

// Handle Note Edit
function handleNoteEdit() {
  if (!currentNoteId) return;

  const note = notes.find((n) => n.id === currentNoteId);
  if (!note) return;

  note.title = noteTitle.value || "Untitled";
  note.content = noteContent.value;
  note.updatedAt = new Date().toISOString();

  // Update the note item in the list
  const noteItem = document.querySelector(
    `.note-item[data-id="${currentNoteId}"]`
  );
  if (noteItem) {
    noteItem.querySelector(".note-item-title").textContent = note.title;
    noteItem.querySelector(".note-item-preview").textContent =
      note.content.substring(0, 60) || "No content";
  }

  // Debounce save
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveNotes();
  }, 500);
}

// Render Notes List
function renderNotesList(filter = "") {
  notesList.innerHTML = "";

  const filteredNotes = filter
    ? notes.filter(
        (n) =>
          n.title.toLowerCase().includes(filter.toLowerCase()) ||
          n.content.toLowerCase().includes(filter.toLowerCase())
      )
    : notes;

  if (filteredNotes.length === 0) {
    notesList.innerHTML =
      '<div class="empty-state"><p>No notes found</p></div>';
    return;
  }

  filteredNotes.forEach((note) => {
    const noteItem = document.createElement("div");
    noteItem.className = "note-item";
    noteItem.dataset.id = note.id;

    const date = new Date(note.updatedAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    noteItem.innerHTML = `
            <div class="note-item-title">${note.title || "Untitled"}</div>
            <div class="note-item-preview">${
              note.content.substring(0, 60) || "No content"
            }</div>
            <div class="note-item-date">${date}</div>
        `;

    noteItem.addEventListener("click", () => selectNote(note.id));
    notesList.appendChild(noteItem);
  });
}

// Handle Search
function handleSearch(e) {
  renderNotesList(e.target.value);
}

// Update Word Count
function updateWordCount() {
  const text = noteContent.value.trim();
  const words = text ? text.split(/\s+/).length : 0;
  wordCount.textContent = `${words} word${words !== 1 ? "s" : ""}`;
}

// Update Last Saved Time
function updateLastSaved() {
  const now = new Date();
  const time = now.toLocaleTimeString("en-US", {
    hour: "numeric", // shows the hour without leading zero
    minute: "2-digit", // two digits for minutes
  });
  lastSaved.textContent = `Saved at ${time}`;
}

// Clear Editor
function clearEditor() {
  currentNoteId = null;
  noteTitle.value = "";
  noteContent.value = "";
  wordCount.textContent = "0 words";
  lastSaved.textContent = "";
}
