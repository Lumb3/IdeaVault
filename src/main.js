// main.js
const { app, BrowserWindow, ipcMain } = require("electron");
app.commandLine.appendSwitch("enable-speech-input");
const path = require("path");
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  BorderStyle,
} = require("docx");
const { spawn } = require("child_process");

let speechProcess = null;
let mainWindow = null;

// Start speech recognition service
// Replace your startSpeechService function in main.js:

function startSpeechService() {
  if (speechProcess) {
    console.log("Speech service already running");
    return;
  }

  console.log("Starting speech service...");

  const speechBinaryPath = path.join(__dirname, "..", "dist", "speech_service");
  console.log("Binary path:", speechBinaryPath);

  // Spawn the speech engine
  speechProcess = spawn(speechBinaryPath, [], {
    stdio: ["ignore", "pipe", "pipe"],
  });

  console.log("Speech process spawned, PID:", speechProcess.pid);

  // Listen for output
  speechProcess.stdout.on("data", (data) => {
    const output = data.toString().trim();
    console.log("RAW STDOUT:", output);

    // Final recognized text
    if (output.startsWith("Text: ")) {
      const text = output.replace("Text:", "").trim();
      console.log("Sending FINAL text to renderer:", text);
      
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("speech-final", text);
        console.log("Final text sent successfully");
      } else {
        console.error("mainWindow not available!");
      }
    }

    // Partial recognized text
    if (output.startsWith("Partial: ")) {
      const partial = output.replace("Partial:", "").trim();
      console.log("⚡ Sending PARTIAL text to renderer:", partial);
      
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("speech-partial", partial);
        console.log("Partial text sent successfully");
      } else {
        console.error("mainWindow not available!");
      }
    }
  });

  // Listen for errors
  speechProcess.stderr.on("data", (data) => {
    const errMsg = data.toString();
    console.log("Speech service stderr:", errMsg);
  });

  // Handle exit
  speechProcess.on("close", (code) => {
    console.log("Speech service stopped with code", code);
    speechProcess = null;
  });
  
  speechProcess.on("error", (error) => {
    console.error("Speech process error:", error);
    speechProcess = null;
  });
}


// Stop speech recognition service
function stopSpeechService() {
  if (speechProcess) {
    console.log("Stopping speech service...");
    speechProcess.kill();
    speechProcess = null;
  }
}

ipcMain.handle("start-speech-service", async () => {
  console.log("IPC start-speech-service called");
  startSpeechService();
  return { success: true };
});

ipcMain.handle("stop-speech-service", async () => {
  console.log("IPC: stop-speech-service called");
  stopSpeechService();
  return { success: true };
});

// PostgreSQL pool setup
const pool = new Pool({
  user: "eric",
  host: "localhost",
  database: "my_database",
  password: "",
  port: 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Initialize database and ensure users table exists
async function initDatabase() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS notes (
        id VARCHAR(20) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC);
    `;
    await pool.query(query);
    console.log("Database initialized and tables ready!");
  } catch (err) {
    console.error("Error initializing database:", err);
  }
}

// Register all IPC handlers
function registerIPCHandlers() {
  console.log("Registering IPC handlers...");

  // Handle DOCX generation
  ipcMain.handle("generate-docx", async (event, noteData) => {
    try {
      console.log("Generating DOCX for note:", noteData.title);
      const { title, content, createdAt, updatedAt } = noteData;

      // Split content into paragraphs
      const contentParagraphs = content.split("\n").map(
        (line) =>
          new Paragraph({
            children: [
              new TextRun({
                text: line || " ",
                size: 24,
              }),
            ],
            spacing: {
              after: 100,
            },
          })
      );

      // Create document
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              // Title
              new Paragraph({
                text: title,
                heading: HeadingLevel.HEADING_1,
                spacing: {
                  after: 200,
                },
              }),

              // Separator line
              new Paragraph({
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

              // Content paragraphs
              ...contentParagraphs,

              // Spacing before metadata
              new Paragraph({
                text: "",
                spacing: {
                  after: 200,
                },
              }),

              // Metadata
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Created: ${new Date(createdAt).toLocaleString()}`,
                    size: 18,
                    color: "808080",
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Last Updated: ${new Date(
                      updatedAt
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

      // Generate buffer
      const buffer = await Packer.toBuffer(doc);
      console.log("DOCX generated successfully, size:", buffer.length, "bytes");
      return Array.from(buffer);
    } catch (error) {
      console.error("DOCX creation error:", error);
      throw error;
    }
  });

  // Handle login attempt
  ipcMain.handle("login-attempt", async (event, { username, password }) => {
    try {
      const res = await pool.query("SELECT * FROM users WHERE username = $1", [
        username,
      ]);

      if (res.rows.length === 0) {
        return { success: false, message: "User not found" };
      }

      const user = res.rows[0];
      const valid = bcrypt.compareSync(password, user.password);

      if (valid) {
        return { success: true, message: "Login successful" };
      } else {
        return { success: false, message: "Wrong password" };
      }
    } catch (err) {
      console.error("Login error:", err);
      return { success: false, message: "Server error" };
    }
  });

  // Handle load notes
  ipcMain.handle("load-notes", async () => {
    try {
      const res = await pool.query(
        "SELECT * FROM notes ORDER BY updated_at DESC"
      );
      console.log("Successfully loaded", res.rows.length, "notes");

      return res.rows.map((note) => ({
        id: note.id,
        title: note.title,
        content: note.content,
        createdAt: note.created_at,
        updatedAt: note.updated_at,
      }));
    } catch (error) {
      console.error("Error loading notes:", error);
      return [];
    }
  });

  // Handle save notes
  ipcMain.handle("save-notes", async (event, notes) => {
    if (!Array.isArray(notes) || notes.length === 0) {
      return;
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const values = [];
      const placeholders = [];

      notes.forEach((note, index) => {
        const offset = index * 5;
        placeholders.push(
          `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${
            offset + 5
          })`
        );
        values.push(
          note.id,
          note.title,
          note.content,
          note.createdAt,
          note.updatedAt
        );
      });

      const query = `
        INSERT INTO notes (id, title, content, created_at, updated_at)
        VALUES ${placeholders.join(", ")}
        ON CONFLICT (id) DO UPDATE
        SET title = EXCLUDED.title,
            content = EXCLUDED.content,
            updated_at = EXCLUDED.updated_at
      `;

      await client.query(query, values);
      await client.query("COMMIT");

      console.log(`Successfully saved ${notes.length} notes`);
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Error saving notes:", err);
      throw err;
    } finally {
      client.release();
    }
  });

  // Handle delete note
  ipcMain.handle("delete-note", async (event, noteId) => {
    try {
      await pool.query("DELETE FROM notes WHERE id = $1", [noteId]);
      console.log(`Successfully deleted note ${noteId}`);
    } catch (err) {
      console.error("Error deleting note:", err);
      throw err;
    }
  });

  // Handle quit app
  ipcMain.handle("quit-app", async () => {
    app.quit();
  });

  console.log("All IPC handlers registered successfully");
}

// Create Electron window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 650,
    title: "IdeaVault",
    icon: path.join(__dirname, "assets", "icon.icns"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.loadFile(path.join(__dirname, "login.html"));

  console.log("mainWindow created and assigned to global variable");
}

// App lifecycle
app.setName("IdeaVault");

app.whenReady().then(async () => {
  registerIPCHandlers();
  await initDatabase();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    stopSpeechService();
    pool
      .end()
      .then(() => console.log("Database connection closed."))
      .catch((error) =>
        console.error("Error closing database connection:", error)
      );
    app.quit();
  }
});

app.on("before-quit", () => {
  stopSpeechService();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
