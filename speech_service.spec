# -*- mode: python ; coding: utf-8 -*-
import os
import sys
from PyInstaller.utils.hooks import collect_data_files, collect_dynamic_libs

# Collect Vosk data files and binaries
vosk_datas = collect_data_files('vosk')
vosk_binaries = collect_dynamic_libs('vosk')

# Collect PyAudio binaries
pyaudio_binaries = collect_dynamic_libs('pyaudio')

a = Analysis(
    ['backend/speech_service.py'],
    pathex=[],
    binaries=vosk_binaries + pyaudio_binaries,
    datas=vosk_datas,
    hiddenimports=[
        'vosk',
        '_vosk',
        'pyaudio',
        '_portaudio',
        'json',
        'wave',
        'srt',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='speech_service',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='speech_service',
)