# speech_service.py
import os
import sys
import json
import pyaudio
from vosk import Model, KaldiRecognizer

# Determine base path (works with PyInstaller)
if getattr(sys, 'frozen', False):
    base_path = sys._MEIPASS
else:
    base_path = os.path.dirname(os.path.abspath(__file__))

# Model path
model_path = os.path.join(base_path, "models", "vosk-model-small-en-us-0.15")
model = Model(model_path)
recognizer = KaldiRecognizer(model, 16000)

# Setup PyAudio
p = pyaudio.PyAudio()
stream = p.open(
    format=pyaudio.paInt16,
    channels=1,
    rate=16000,
    input=True,
    frames_per_buffer=8192
)
stream.start_stream()

print("Listening... Press Ctrl+C to stop.")

try:
    while True:
        data = stream.read(8192, exception_on_overflow=False)
        if recognizer.AcceptWaveform(data):
            result = json.loads(recognizer.Result())
            print("Text: ", result["text"])
        else:
            partial = json.loads(recognizer.PartialResult())
            if partial['partial']:
                print("Partial: ", partial["partial"])
except KeyboardInterrupt:
    print("\nStopping...")
finally:
    stream.stop_stream()
    stream.close()
    p.terminate()
