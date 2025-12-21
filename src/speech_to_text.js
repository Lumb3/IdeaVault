export class SpeechToText {
  constructor(noteContent) {
    this.noteContent = noteContent;
    this.isRecording = false;
    this.partialText = "";

  }
}
