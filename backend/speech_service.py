# backend/speech_service.py
import os
import sys
import json
import pyaudio
from vosk import Model, KaldiRecognizer

if getattr(sys, "frozen", False):
    base_path = sys._MEIPASS
else:
    base_path = os.path.dirname(os.path.abspath(__file__))


MODEL_PATH = os.path.join(
    "models",
    "vosk-model-small-en-us-0.15"
)

print("Using Vosk model path:", MODEL_PATH, flush=True)


if not os.path.isdir(MODEL_PATH):
    print(f"ERROR: Vosk model not found at {MODEL_PATH}", file=sys.stderr, flush=True)
    sys.exit(1)

model = Model(MODEL_PATH)
recognizer = KaldiRecognizer(model, 16000)


p = pyaudio.PyAudio()

stream = p.open(
    format=pyaudio.paInt16,
    channels=1,
    rate=16000,
    input=True,
    frames_per_buffer=8192
)

stream.start_stream()
print("Listening...", flush=True)

try:
    while True:
        data = stream.read(8192, exception_on_overflow=False)

        if recognizer.AcceptWaveform(data):
            result = json.loads(recognizer.Result())
            text = result.get("text", "").strip()
            if text:
                print(f"Text: {text}", flush=True)
        else:
            partial = json.loads(recognizer.PartialResult())
            part = partial.get("partial", "").strip()
            if part:
                print(f"Partial: {part}", flush=True)

except KeyboardInterrupt:
    print("Stopping...", flush=True)

finally:
    stream.stop_stream()
    stream.close()
    p.terminate()
