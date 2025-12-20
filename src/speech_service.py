import json
import sys
import os
from vosk import Model, KaldiRecognizer
import pyaudio

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model")

model = Model(MODEL_PATH)
rec = KaldiRecognizer(model, 16000)

p = pyaudio.PyAudio()
stream = p.open(
    format=pyaudio.paInt16,
    channels=1,
    rate=16000,
    input=True,
    frames_per_buffer=4000,
)
stream.start_stream()

print("READY", flush=True)

try:
    while True:
        data = stream.read(2000, exception_on_overflow=False)
        if rec.AcceptWaveform(data):
            result = json.loads(rec.Result())
            text = result.get("text", "")
            if text:
                print("TEXT:" + text, flush=True)
except KeyboardInterrupt:
    pass

print("TERMINATE", flush=True)
