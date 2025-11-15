const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const bcrypt = require("bcryptjs");
const { Client } = require("pg");

const client = new Client({
  host: "localhost",
  user: "Eric",
  password: "1234",
  database: "ideavault",
});

async function initDatabase() {
  await client.connect();

  const hashed = bcrypt.hashSync("HUU", 10);
  try {
    await client.query(
      `INSERT INTO users (username, password_hash) VALUES ($1, $2) ON CONFLICT (username) DO NOTHING`,
      ["Eric", hashed]
    );
  } catch (err) {
    console.log("DB init failed: ", err);
  }
}

ipcMain.handle("login-attempt", async (event, { username, password }) => {
  try {
    const res = await client.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );

    if (res.rows.length === 0) return { success: false };

    const user = res.rows[0];
    const match = bcrypt.compareSync(password, user.password_hash);

    return { success: match };
  } catch (err) {
    console.error("Login error:", err);
    return { success: false };
  }
});


function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 650,
    title: "IdeaVault",
    icon: path.join(__dirname, "assets", "icon.png"),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadFile(path.join(__dirname, "login.html"));
}

app.setName("IdeaVault");
app.whenReady().then(() => {
  initDatabase(); // initialize DB
  createWindow();
});
