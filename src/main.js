// main.js
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");

// PostgreSQL client setup
const pool = new Pool({
  user: "eric", // your DB user
  host: "localhost",
  database: "my_database",
  password: "", // add DB password if needed
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

// Handle login attempt from renderer
ipcMain.handle("login-attempt", async (event, { username, password }) => {
  try {
    // Query user by username
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

ipcMain.handle("load-notes", async () => {
  try {
    const res = await pool.query(
      "SELECT * FROM notes ORDER BY updated_at DESC"
    );
    console.log("Successfully loaded the notes");

    // Map database columns to camelCase for JavaScript
    return res.rows.map((note) => ({
      id: note.id,
      title: note.title,
      content: note.content,
      createdAt: note.created_at,
      updatedAt: note.updated_at,
    }));
  } catch (error) {
    console.log("Error loading notes: ", error);
    return [];
  }
});

ipcMain.handle("save-notes", async (event, notes) => {
  if (!Array.isArray(notes) || notes.length === 0) {
    return;
  }

  const client = await pool.connect(); // Use connection pool

  try {
    await client.query("BEGIN"); // Start transaction

    // Build batch query with multiple value sets
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

ipcMain.handle("delete-note", async (event, noteId) => {
  try {
    await pool.query("DELETE FROM notes WHERE id = $1", [noteId]);
    console.log(`Successfully deleted note ${noteId}`);
  } catch (err) {
    console.error("Error deleting note:", err);
    throw err;
  }
});

ipcMain.handle("quit-app", async () => {
  app.quit();
});

// Create Electron window
function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 650,
    title: "IdeaVault",
    icon: path.join(__dirname, "assets", "icon.png"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"), // Loading preload.js
    },
  });

  win.loadFile(path.join(__dirname, "login.html"));
}

// App lifecycle
app.setName("IdeaVault");
app.whenReady().then(async () => {
  await initDatabase();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    pool
      .end()
      .then(() => console.log("Database connection lost."))
      .catch((error) =>
        console.log("Error closing database connection: ", error)
      );
    app.quit();
  }
});
