export class SpeechToText {
  constructor(noteContentEl) {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.log("Speech Recognition is not supported in this browser.");
      return;
    }

    this.recognition = new SpeechRecognition();
    this.noteContent = noteContentEl;
    this.isRecording = false;
    this.shouldRestart = false; 

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = "en-US";

    this.finalTxt = "";

    this.recognition.onresult = (event) => {
      let interimTxt = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          this.finalTxt += transcript + " ";
        } else {
          interimTxt += transcript;
        }
      }

      // Update content without replacing existing text
      const currentText = this.noteContent.innerText.replace(/\s*$/, "");
      this.noteContent.innerText = currentText + this.finalTxt + interimTxt;
    };

    this.recognition.onstart = () => {
      this.isRecording = true;
      console.log("Speech recognition started");
    };

    this.recognition.onend = () => {
      this.isRecording = false;
      console.log("Speech recognition ended");
      
      // Only restart if the user wants to continue recording
      if (this.shouldRestart) {
        setTimeout(() => {
          try {
            this.recognition.start();
          } catch (error) {
            console.error("Failed to restart recognition:", error);
            this.shouldRestart = false;
          }
        }, 100); // Small delay before restarting
      }
    };

    this.recognition.onerror = (e) => {
      console.log("Speech recognition error:", e.error);
      
      if (e.error === "network") {
        console.warn("Network error - speech service disconnected");
        // Don't automatically restart on network errors
        this.shouldRestart = false;
        this.recognition.stop();
      } else if (e.error === "aborted") {
        // Normal stop, don't log as error
        this.shouldRestart = false;
      } else if (e.error === "no-speech") {
        console.log("No speech detected, continuing...");
        // Continue listening if no speech was detected
      } else {
        console.error("Recognition error:", e.error);
        this.shouldRestart = false;
      }
    };
  }

  start() {
    if (this.isRecording) return;
    this.finalTxt = "";
    this.shouldRestart = true; // Set restart flag when starting
    try {
      this.recognition.start();
    } catch (error) {
      console.error("Failed to start recognition:", error);
      this.shouldRestart = false;
    }
  }

  stop() {
    if (!this.isRecording) return;
    this.shouldRestart = false; // Clear restart flag when stopping
    this.recognition.stop();
  }

  toggle() {
    this.isRecording ? this.stop() : this.start();
  }

  is_Recording() {
    return this.isRecording;
  }
}