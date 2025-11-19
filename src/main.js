// main.js
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const bcrypt = require("bcryptjs");
const { Client } = require("pg");

// PostgreSQL client setup
const client = new Client({
  user: "eric", // your DB user
  host: "localhost",
  database: "my_database",
  password: "", // add DB password if needed
  port: 5432,
});

// Initialize database and ensure users table exists
async function initDatabase() {
  try {
    await client.connect(); // Initialize a connection with the client
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
    `;
    await client.query(query);
    console.log("Database initialized and tables ready!");
  } catch (err) {
    console.error("Error initializing database:", err);
  }
}

// Handle login attempt from renderer
ipcMain.handle("login-attempt", async (event, { username, password }) => {
  try {
    // Query user by username
    const res = await client.query("SELECT * FROM users WHERE username = $1", [
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
    // Backend logic for loading notes
    const res = await client.query(
      "SELECT * FROM notes ORDER BY updated_at DESC"
    ); // get the result by the updated_at column, from newest to oldest
    console.log ("Successfully loaded the notes");
    return res.rows; // returns the newest data
  } catch (error) {
    console.log("Error loading notes: ", error);
    return [];
  }
});

// Slow save-notes
// ipcMain.handle("save-notes", async (event, notes) => {
//   if (!Array.isArray(notes)) {
//     console.error("Expected notes array but got:", notes);
//     return;
//   }

//   try {
//     for (const note of notes) {
//       await client.query(
//         `INSERT INTO notes (id, title, content, created_at, updated_at)
//          VALUES ($1, $2, $3, $4, $5)
//          ON CONFLICT (id) DO UPDATE
//          SET title = $2, content = $3, updated_at = $5`,
//         [note.id, note.title, note.content, note.createdAt, note.updatedAt]
//       );
//     }
//   } catch (err) {
//     console.error("Error saving notes:", err);
//   }
// });

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
    client
      .end()
      .then(() => console.log("Database connection lost."))
      .catch((error) =>
        console.log("Error closing database connection: ", error)
      );
    app.quit();
  }
});
