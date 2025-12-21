export class SpeechToText {
  constructor(noteContent) {
    this.noteContent = noteContent;
    this.isRecording = false;
    this.partialText = "";

    // Setup listeners ONCE in constructor
    this.setupListeners();
  }

  setupListeners() {
    console.log("Setting up speech listeners...");

    // Handle final recognized text
    window.authAPI.onSpeechRecognized((text) => {
      console.log("✅ RECOGNIZED (final):", text);
      // Optionally insert text even if not "recording"
      // if you want to see it work immediately
      if (text) {
        this.insertText(text);
      }
    });

    // Handle partial results
    window.authAPI.onSpeechPartial((text) => {
      console.log("🔄 PARTIAL:", text);
      this.partialText = text;
    });
  }

  async start() {
    try {
      console.log("🎤 Starting speech recognition...");
      await window.authAPI.startSpeechService();
      this.isRecording = true;
      console.log("✅ Speech recognition started - listening continuously");
    } catch (error) {
      console.error("❌ Failed to start speech recognition:", error);
      this.isRecording = false;
    }
  }

  async stop() {
    try {
      console.log("🛑 Stopping speech recognition...");
      await window.authAPI.stopSpeechService();
      this.isRecording = false;
      this.partialText = "";
      console.log("✅ Speech recognition stopped");
    } catch (error) {
      console.error("❌ Failed to stop speech recognition:", error);
    }
  }

  is_Recording() {
    return this.isRecording;
  }

  insertText(text) {
    console.log("📝 Inserting text:", text);
    // Your text insertion logic here
    if (this.noteContent) {
      // Example: append to content
      const currentText = this.noteContent.innerText || "";
      this.noteContent.innerText = currentText + " " + text;
    }
  }

  async terminal_output() {
    // For debugging - starts service and logs output
    await this.start();
    console.log("🖥️ Terminal output mode enabled - watch console for speech");
  }
}
