// renderer.js
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

// toggle dark or light mode
const userTheme = localStorage.getItem("theme"); // gets the current theme
if (userTheme == "dark") {
  darkMode.disabled = false; // darkMode is applied
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
}
function toggleDarkMode() {
  if (darkMode.disabled) {
    // If darkMode disabled
    darkMode.disabled = false; // then enable the darkmode, enable the darkMode.css
    toggle.classList.add("active");
    localStorage.setItem("theme", "dark"); // setting the current theme to dark in the local storage
  } else {
    darkMode.disabled = true;
    toggle.classList.remove("active");
    localStorage.setItem("theme", "light"); // setting the current theme to light in the local storage
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
          <i class="fa-solid fa-file-lines"></i>
          Text (.txt)
        </button>
        <button class="format-btn" data-format="pdf">
          <i class="fa-solid fa-file-pdf"></i>
          PDF (.pdf)
        </button>
        <button class="format-btn" data-format="docx">
          <i class="fa-solid fa-file-word"></i>
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
      const format = btn.dataset.format; // get the format
      // Show loading state
      btn.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';
      btn.disabled = true;
      try {
        await downloadNote(note, format);
      } catch (error) {
        console.error("Download failed:", error);
        alert(
          `Failed to download as ${format.toUpperCase()}. Please try again.`
        );
      }

      document.body.removeChild(modal);
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

function downloadNote(note, format) {
  const fileName = sanitizeFileName(note.title);
  switch (format) {
    case "txt":
      downloadTXT(note, fileName);
      break;
    case "pdf":
      downloadPDF(note, fileName);
      break;
    case "docx":
      downloadDOCX(note, fileName);
      break;
    default:
      console.log("Error in identifying file format!");
      return;
  }
}
// Download the Note Title and Note Content as txt
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
  const margin = 20; // empty space between content and the edge of the PDF page
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Title
  doc.setFontSize(20);
  doc.setFont(undefined, "bold");
  const titleLines = doc.splitTextToSize(note.title, maxWidth); // wrapping the text
  doc.text(titleLines, margin, yPosition);
  yPosition += titleLines.length * 10 + 10;

  // Line separator
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Content
  doc.setFontSize(12);
  doc.setFont(undefined, "normal"); // font
  const contentLines = doc.splitTextToSize(
    note.content || "No content",
    maxWidth
  ); // wrapping the text
  contentLines.forEach((line) => {
    if (yPosition > pageHeight - margin) {
      // If it's about to print the content below the bottom margin
      doc.addPage(); // add one more new page
      yPosition = margin;
    }
    doc.text(line, margin, yPosition);
    yPosition += 7;
  });

  yPosition += 10;
  if (yPosition > pageHeight - margin - 20) {
    doc.addPage(); // add one more new page
    yPosition = margin;
  }
  doc.setFontSize(9);
  doc.setTextColor(128, 128, 128);
  doc.text(`Created: ${note.createdAt.toLocaleString()}`, margin, yPosition);
  doc.save(`${fileName}.pdf`);
}

// Fetch the docx API
async function fetch() {
  try {
    console.log("exporting note to DOCX: ", note.title);
    const obj = await window.authAPI.docxComponents();
    return obj;
  } catch (error) {
    console.log("Error expoerting to DOCS: ", error);
    throw error;
  }
}

// Download as DOCX
async function downloadDOCX(note, fileName) {
  try {
    // Get docx components from main process
    const obj = fetch();

    // Create document with sections
    const doc = new obj.Document({
      sections: [
        {
          properties: {},
          children: [
            // Title
            new obj.Paragraph({
              text: note.title,
              heading: HeadingLevel.HEADING_1,
              spacing: {
                after: 200,
              },
            }),

            // Separator line (using border)
            new obj.Paragraph({
              border: {
                bottom: {
                  color: "000000",
                  space: 1,
                  style: BorderStyle.SINGLE,
                  size: 6,
                },
              },
              spacing: {
                after: 200,
              },
            }),

            // Content - split by paragraphs
            ...note.content.split("\n").map(
              (line) =>
                new obj.Paragraph({
                  children: [
                    new obj.TextRun({
                      text: line || " ", // Empty line if blank
                      size: 24, // 12pt font (size is in half-points)
                    }),
                  ],
                  spacing: {
                    after: 100,
                  },
                })
            ),

            // Spacing before metadata
            new obj.Paragraph({
              text: "",
              spacing: {
                after: 200,
              },
            }),

            // Metadata
            new obj.Paragraph({
              children: [
                new obj.TextRun({
                  text: `Created: ${new Date(note.createdAt).toLocaleString()}`,
                  size: 18, // 9pt font
                  color: "808080",
                }),
              ],
            }),
            new obj.Paragraph({
              children: [
                new obj.TextRun({
                  text: `Last Updated: ${new Date(
                    note.updatedAt
                  ).toLocaleString()}`,
                  size: 18,
                  color: "808080",
                }),
              ],
            }),
          ],
        },
      ],
    });

    // Generate blob and download
    const buffer = await Packer.toBuffer(doc);
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
  } catch (error) {
    console.error("Error generating DOCX:", error);
    alert("Error generating DOCX file: " + error.message);
  }
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); // anchor element
  a.href = url;
  a.download = filename;
  a.click(); // download the file
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
