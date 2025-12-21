console.log("Preload script is loaded and running!");

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("authAPI", {
  //  AUTH 
  login: (username, password) =>
    ipcRenderer.invoke("login-attempt", { username, password }),

  //  NOTES 
  load: () => ipcRenderer.invoke("load-notes"),
  save: (notes) => ipcRenderer.invoke("save-notes", notes),
  delete: (noteId) => ipcRenderer.invoke("delete-note", noteId),
  quit: () => ipcRenderer.invoke("quit-app"),

  //  DOCX 
  generateDocx: (docData) => ipcRenderer.invoke("generate-docx", docData),

  //  SPEECH SERVICE 
  startSpeechService: () => ipcRenderer.invoke("start-speech-service"),
  stopSpeechService: () => ipcRenderer.invoke("stop-speech-service"),


  onSpeechFinal: (callback) => {
    ipcRenderer.removeAllListeners("speech-final");
    ipcRenderer.on("speech-final", (_, text) => callback(text));
  },

  onSpeechPartial: (callback) => {
    ipcRenderer.removeAllListeners("speech-partial");
    ipcRenderer.on("speech-partial", (_, text) => callback(text));
  },

  removeAllSpeechListeners: () => {
    ipcRenderer.removeAllListeners("speech-final");
    ipcRenderer.removeAllListeners("speech-partial");
  },
});
