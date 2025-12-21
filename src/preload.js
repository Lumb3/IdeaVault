console.log("Preload script is loaded and running!");

const { contextBridge, ipcRenderer } = require("electron");

// Expose a safe API to the renderer process
contextBridge.exposeInMainWorld("authAPI", {
  login: async (username, password) => {
    try {
      // Send a message to the main process to handle login
      return await ipcRenderer.invoke("login-attempt", { username, password });
    } catch (error) {
      console.error("Error during login:", error);
      throw error;
    }
  },
  load: async () => {
    try {
      // Send a message to the main process to load notes
      return await ipcRenderer.invoke("load-notes");
    } catch (error) {
      console.error("Error loading notes:", error);
      throw error;
    }
  },
  save: async (notes) => {
    try {
      // Send a message to the main process to save notes
      return await ipcRenderer.invoke("save-notes", notes);
    } catch (error) {
      console.error("Error saving notes:", error);
      throw error;
    }
  },
  quit: () => {
    ipcRenderer.invoke("quit-app");
  },
  delete: async (noteId) => {
    try {
      return await ipcRenderer.invoke("delete-note", noteId);
    } catch (error) {
      console.log("Error deleting note: ", error);
      throw error;
    }
  },
  generateDocx: async (docData) => {
    try {
      return await ipcRenderer.invoke("generate-docx", docData);
    } catch (error) {
      console.error("Error generating DOCX:", error);
      throw error;
    }
  },

  // Speech service controls
  startSpeechService: () => ipcRenderer.invoke("start-speech-service"),
  stopSpeechService: () => ipcRenderer.invoke("stop-speech-service"),

  // Speech recognition events - use removeListener pattern
  onSpeechRecognized: (callback) => {
    // Remove any existing listeners first
    ipcRenderer.removeAllListeners("speech-recognized");
    // Add new listener
    ipcRenderer.on("speech-recognized", (event, text) => callback(text));
  },
  onSpeechPartial: (callback) => {
    // Remove any existing listeners first
    ipcRenderer.removeAllListeners("speech-partial");
    // Add new listener
    ipcRenderer.on("speech-partial", (event, text) => callback(text));
  },

  // Clean up listeners
  removeAllSpeechListeners: () => {
    ipcRenderer.removeAllListeners("speech-recognized");
    ipcRenderer.removeAllListeners("speech-partial");
  },
});
