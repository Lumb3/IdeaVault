console.log("Preload script is loaded and running!");

const { contextBridge, ipcRenderer } = require('electron');

// Expose a safe API to the renderer process
contextBridge.exposeInMainWorld('authAPI', {
  login: async (username, password) => {
    try {
      // Send a message to the main process to handle login
      return await ipcRenderer.invoke('login-attempt', { username, password });
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  },
  load: async () => {
    try {
      // Send a message to the main process to load notes
      return await ipcRenderer.invoke('load-notes');
    } catch (error) {
      console.error('Error loading notes:', error);
      throw error;
    }
  },
  save: async (notes) => {
    try {
      // Send a message to the main process to save notes
      return await ipcRenderer.invoke('save-notes', notes);
    } catch (error) {
      console.error('Error saving notes:', error);
      throw error;
    }
  }
});
