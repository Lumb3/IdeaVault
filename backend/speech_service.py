# backend/speech_service.py
import os
import sys
import json
import pyaudio
from vosk import Model, KaldiRecognizer

# Determine base path for resources
if getattr(sys, "frozen", False):
    # Running as compiled executable
    # sys.executable points to: .../Resources/speech_service/speech_service
    # We need to go up to Resources, then find models
    exe_dir = os.path.dirname(sys.executable)  # .../Resources/speech_service
    resources_dir = os.path.dirname(exe_dir)   # .../Resources
    MODEL_PATH = os.path.join(resources_dir, "models", "vosk-model-small-en-us-0.15")
else:
    # Running in development
    base_path = os.path.dirname(os.path.abspath(__file__))
    MODEL_PATH = os.path.join(base_path, "..", "models", "vosk-model-small-en-us-0.15")

MODEL_PATH = os.path.normpath(MODEL_PATH)
print(f"Executable dir: {os.path.dirname(sys.executable) if getattr(sys, 'frozen', False) else 'N/A'}", flush=True)
print(f"Using Vosk model path: {MODEL_PATH}", flush=True)
print(f"Model exists: {os.path.isdir(MODEL_PATH)}", flush=True)

if not os.path.isdir(MODEL_PATH):
    print(f"ERROR: Vosk model not found at {MODEL_PATH}", file=sys.stderr, flush=True)
    print(f"Current working directory: {os.getcwd()}", file=sys.stderr, flush=True)
    
    # Debug: List what's actually in the parent directories
    try:
        if getattr(sys, "frozen", False):
            exe_dir = os.path.dirname(sys.executable)
            resources_dir = os.path.dirname(exe_dir)
            
            print(f"Executable directory ({exe_dir}) contents:", file=sys.stderr, flush=True)
            if os.path.exists(exe_dir):
                print(os.listdir(exe_dir), file=sys.stderr, flush=True)
            
            print(f"Resources directory ({resources_dir}) contents:", file=sys.stderr, flush=True)
            if os.path.exists(resources_dir):
                print(os.listdir(resources_dir), file=sys.stderr, flush=True)
            
            models_dir = os.path.join(resources_dir, "models")
            print(f"Models directory ({models_dir}) exists: {os.path.exists(models_dir)}", file=sys.stderr, flush=True)
            if os.path.exists(models_dir):
                print(f"Models directory contents:", file=sys.stderr, flush=True)
                print(os.listdir(models_dir), file=sys.stderr, flush=True)
    except Exception as e:
        print(f"Error during debug listing: {e}", file=sys.stderr, flush=True)
    
    sys.exit(1)

try:
    model = Model(MODEL_PATH)
    recognizer = KaldiRecognizer(model, 16000)
    print("Vosk model loaded successfully", flush=True)
except Exception as e:
    print(f"ERROR: Failed to load Vosk model: {e}", file=sys.stderr, flush=True)
    sys.exit(1)

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
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr, flush=True)
finally:
    stream.stop_stream()
    stream.close()
    p.terminate()