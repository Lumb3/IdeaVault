const { app, BrowserWindow } = require("electron");

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    title: "IdeaVault",
    icon: __dirname + "assets/icon.png",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadFile("src/login.html");
}
app.setName('IdeaVault');
app.whenReady().then(createWindow);
