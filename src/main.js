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
    `;
    await client.query(query);
    console.log("Database initialized and users table ready!");
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

    console.log("Loading notes...");
  } catch (err) {
    console.log("Error loading notes: ", err);
    return [];
  }
});

ipcMain.handle("save-notes", async (notes) => {
  try {
    // Backend logic for saving notes
  } catch (error) {
    console.log("Error saving notes: ", error);
  }
});

ipcMain.handle("quit-app", async() => {
  app.quit();
})

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
