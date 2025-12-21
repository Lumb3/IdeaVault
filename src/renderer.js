// renderer.js
import { TextDecorationToolbar } from "./decoration.js";
import { image_upload } from "./img_uploader.js";
import { speechToggle } from "./speech_to_text.js";
const newNoteBtn = document.getElementById("newNoteBtn");
const deleteBtn = document.getElementById("deleteBtn");
const notesList = document.getElementById("notesList");
const noteTitle = document.getElementById("noteTitle");
const noteContent = document.getElementById("noteContent");
const searchInput = document.getElementById("searchInput");
const wordCount = document.getElementById("wordCount");
const lastSaved = document.getElementById("lastSaved");
const toggle = document.querySelector(".toggle-wrap");
const darkMode = document.getElementById("darkModeLink");
const download_note = document.querySelector(".download-btn");
const speechBtn = document.querySelector(".speech-to-text-btn");

// Toggle dark or light mode
const userTheme = localStorage.getItem("theme");
if (userTheme == "dark") {
  darkMode.disabled = false;
  toggle.classList.add("active");
}

// State
let notes = [];
let currentNoteId = null;
let saveTimeout = null;


// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadNotes();
  setupEventListeners();
  new TextDecorationToolbar();
  new image_upload();
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
  download_note.addEventListener("click", download);
  toggle.addEventListener("click", toggleDarkMode);
  speechBtn.addEventListener("click", () => speechToggle(noteContent, speechBtn));
}

function toggleDarkMode() {
  if (darkMode.disabled) {
    darkMode.disabled = false;
    toggle.classList.add("active");
    localStorage.setItem("theme", "dark");
  } else {
    darkMode.disabled = true;
    toggle.classList.remove("active");
    localStorage.setItem("theme", "light");
  }
}

async function download() {
  if (!currentNoteId) {
    alert("Please select a note to download");
    return;
  }
  const note = notes.find((n) => n.id == currentNoteId);
  if (!note) return;

  // Create a popup modal for format selection
  const modal = document.createElement("div");
  modal.className = "download-modal";
  modal.innerHTML = `
    <div class="download-modal-content">
      <h3>Download Note</h3>
      <p>Choose a format:</p>
      <div class="format-buttons">
        <button class="format-btn" data-format="txt">
          <i class="bi bi-stickies-fill"></i>
          Text (.txt)
        </button>
        <button class="format-btn" data-format="pdf">
         <i class="bi bi-file-pdf-fill"></i>
          PDF (.pdf)
        </button>
        <button class="format-btn" data-format="docx">
          <i class="bi bi-file-word-fill"></i>
          Word (.docx)
        </button>
      </div>
      <button class="cancel-btn">Cancel</button>
    </div>
  `;
  document.body.appendChild(modal);

  // Handle format selection
  modal.querySelectorAll(".format-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const format = btn.dataset.format;
      const originalHTML = btn.innerHTML;

      // Show loading state
      btn.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';
      btn.disabled = true;

      try {
        await downloadNote(note, format);
        document.body.removeChild(modal);
      } catch (error) {
        console.error("Download failed:", error);
        alert(
          `Failed to download as ${format.toUpperCase()}. Error: ${
            error.message
          }`
        );
        btn.innerHTML = originalHTML;
        btn.disabled = false;
      }
    });
  });

  modal.querySelector(".cancel-btn").addEventListener("click", () => {
    document.body.removeChild(modal);
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
}

async function downloadNote(note, format) {
  const fileName = sanitizeFileName(note.title);

  switch (format) {
    case "txt":
      downloadTXT(note, fileName);
      break;
    case "pdf":
      downloadPDF(note, fileName);
      break;
    case "docx":
      await downloadDOCX(note, fileName);
      break;
    default:
      throw new Error("Unknown file format: " + format);
  }
}

// Download as TXT
function downloadTXT(note, fileName) {
  const content = `${note.title}\n${"=".repeat(note.title.length)}\n\n${
    note.content
  }\n\n---\nCreated: ${new Date(
    note.createdAt
  ).toLocaleString()}\nLast Updated: ${new Date(
    note.updatedAt
  ).toLocaleString()}`;

  downloadFile(content, `${fileName}.txt`, "text/plain");
}

// Download as PDF
function downloadPDF(note, fileName) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Title
  doc.setFontSize(20);
  doc.setFont(undefined, "bold");
  const titleLines = doc.splitTextToSize(note.title, maxWidth);
  doc.text(titleLines, margin, yPosition);
  yPosition += titleLines.length * 10 + 10;

  // Line separator
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Content
  doc.setFontSize(12);
  doc.setFont(undefined, "normal");
  const contentLines = doc.splitTextToSize(
    note.content || "No content",
    maxWidth
  );

  contentLines.forEach((line) => {
    if (yPosition > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }
    doc.text(line, margin, yPosition);
    yPosition += 7;
  });

  // Metadata
  yPosition += 10;
  if (yPosition > pageHeight - margin - 20) {
    doc.addPage();
    yPosition = margin;
  }

  doc.setFontSize(9);
  doc.setTextColor(128, 128, 128);
  doc.text(
    `Created: ${new Date(note.createdAt).toLocaleString()}`,
    margin,
    yPosition
  );
  yPosition += 5;
  doc.text(
    `Last Updated: ${new Date(note.updatedAt).toLocaleString()}`,
    margin,
    yPosition
  );

  doc.save(`${fileName}.pdf`);
}

// Download as DOCX
async function downloadDOCX(note, fileName) {
  try {
    console.log("Starting DOCX download for:", note.title);

    // Call the main process to generate DOCX
    const bufferArray = await window.authAPI.generateDocx({
      title: note.title,
      content: note.content,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    });

    console.log("Received buffer array, size:", bufferArray.length);

    // Convert array back to Uint8Array
    const buffer = new Uint8Array(bufferArray);

    // Create blob and download
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log("DOCX downloaded successfully");
  } catch (error) {
    console.error("Error generating DOCX:", error);
    throw error;
  }
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function sanitizeFileName(fileName) {
  return (
    fileName
      .replace(/[^a-z0-9]/gi, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "")
      .toLowerCase()
      .substring(0, 50) || "untitled"
  );
}

// Save and exit
async function exit() {
  try {
    await saveNotes();
    window.authAPI.quit();
  } catch (e) {
    console.error("Error in quitting:", e);
  }
}

// Load Notes
async function loadNotes() {
  try {
    const data = await window.authAPI.load();
    notes = data || [];
    renderNotesList();
    if (notes.length > 0) {
      selectNote(notes[0].id);
    }
  } catch (error) {
    console.error("Failed to load notes:", error);
  }
}

// Save Notes
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
    console.error("Failed to delete note:", error);
  }
}
// Restore image's size and alignment
// <div class="image-wrapper" data-align="center" data-width="320px">
function restoreImages() {
  const wrappers = noteContent.querySelectorAll(".image-wrapper");
  wrappers.forEach((wrapper) => {
    const img = wrapper.querySelector("img");
    if (!img) {
      console.log("Error getting image");
      return;
    }

    // Restore size
    if (wrapper.dataset.width) {
      img.style.width = wrapper.dataset.width;
      img.style.maxWidth = "none";
      img.style.height = "auto";
    }

    // Restore alignment
    if (wrapper.dataset.align) {
      wrapper.style.textAlign = wrapper.dataset.align;
    }
  });
}

// Select Note
function selectNote(id) {
  currentNoteId = id;
  const note = notes.find((n) => n.id === id);

  if (note) {
    noteTitle.value = note.title;
    noteContent.innerHTML = note.content || ""; // copy the innerHTML of the textContent
    restoreImages();
    updateWordCount();

    document.querySelectorAll(".note-item").forEach((item) => {
      item.classList.toggle("active", item.dataset.id === id);
    });
  }
}

function cleanEditorHTML() {
  const clone = noteContent.cloneNode(true);

  clone
    .querySelectorAll(".image-toolbar, .resize-handle, .width-label")
    .forEach((el) => el.remove());

  return clone.innerHTML;
}

// Handle Note Edit
function handleNoteEdit() {
  if (!currentNoteId) return;

  const note = notes.find((n) => n.id === currentNoteId);
  if (!note) return;

  note.title = noteTitle.value || "Untitled";

  // SAVE HTML, not plain text
  note.content = cleanEditorHTML();

  note.updatedAt = new Date().toISOString();

  const noteItem = document.querySelector(
    `.note-item[data-id="${currentNoteId}"]`
  );

  if (noteItem) {
    noteItem.querySelector(".note-item-title").textContent = note.title;
    noteItem.querySelector(".note-item-preview").innerText =
      noteContent.innerText.substring(0, 60) || "No content";
  }

  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => saveNotes(), 500);
}

// Render Notes List
function renderNotesList(filter = "") {
  notesList.innerHTML = "";

  const filteredNotes = filter
    ? notes.filter(
        (n) =>
          n.title.toLowerCase().includes(filter.toLowerCase()) ||
          stripHTML(n.content).toLowerCase().includes(filter.toLowerCase())
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

function stripHTML(html) {
  return html.replace(/<[^>]+>/g, "");
}

// Handle Search
function handleSearch(e) {
  renderNotesList(e.target.value);
}

// Update Word Count
function updateWordCount() {
  const text = noteContent.innerText.trim();
  const words = text ? text.split(/\s+/).length : 0;
  wordCount.textContent = `${words} word${words !== 1 ? "s" : ""}`;
}

// Update Last Saved Time
function updateLastSaved() {
  const now = new Date();
  const time = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  lastSaved.textContent = `Saved at ${time}`;
}

// Clear Editor
function clearEditor() {
  currentNoteId = null;
  noteTitle.value = "";
  noteContent.innerHTML = "";
  wordCount.textContent = "0 words";
  lastSaved.textContent = "";
}
