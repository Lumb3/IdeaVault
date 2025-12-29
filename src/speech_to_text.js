let speechActive = false;
let isProcessing = false; 

const speechIcon = document.querySelector("#speechIcon");

export function speechToggle(noteContent, speechBtn) {
  console.log("=== speechToggle called ===");
  if (isProcessing) {
    console.log ("Already processing, ignoring click!");
  }
  isProcessing = true;
  if (!speechActive) {
    console.log("Starting speech service...");

    try {
      window.authAPI.startSpeechService();
      speechActive = true;
      console.log("Speech service start command sent");

      // Set up final text listener
      console.log("Setting up onSpeechFinal listener...");
      window.authAPI.onSpeechFinal((text) => {
        console.log("FINAL TEXT RECEIVED:", text);
        noteContent.innerHTML = noteContent.innerHTML.replace(
          /<span class="partial">.*<\/span>/,
          ""
        );
        noteContent.insertAdjacentText("beforeend", text + " ");
        noteContent.scrollTop = noteContent.scrollHeight;
      });

      // Set up partial text listener
      console.log("Setting up onSpeechPartial listener...");
      window.authAPI.onSpeechPartial((partial) => {
        console.log("PARTIAL TEXT RECEIVED:", partial);
      });

      console.log("All listeners set up successfully");

      // Update UI
      speechIcon.classList.remove("fa-microphone-slash");
      speechIcon.classList.add("fa-microphone");
      speechBtn.classList.add("recording");
      console.log("UI updated to recording state");
    } catch (error) {
      console.error("Error starting speech service:", error);
      speechActive = false;
    }
  } else {
    console.log("Stopping speech service...");

    try {
      window.authAPI.stopSpeechService();
      window.authAPI.removeAllSpeechListeners();
      speechActive = false;
      console.log("Speech service stopped");

      // Update UI
      speechIcon.classList.remove("fa-microphone");
      speechBtn.classList.remove("recording");
      speechIcon.classList.add("fa-microphone-slash");
      console.log("UI updated to stopped state");
    } catch (error) {
      console.error("Error stopping speech service:", error);
    }
  }

  console.log("speechToggle finished\n");
}