# Current USB Baseline

Scanned on 2026-06-18.

## Product Layout

```text
E:\
  win-unpacked\resources\app
  runtime
  data
  extensions
  skills
```

The installed Electron app is `openclawpro` version `1.8.6`.

## Hermes Runtime

Current runtime:

```text
E:\runtime\HermesPortable
```

Detected components:

```text
venv\Scripts\hermes.exe
venv\Scripts\python.exe
python\
node\node.exe
lib\config_server.py
hermes-agent\
```

Detected versions:

```text
Hermes Agent v0.15.1
Python 3.12.13
Node v24.15.0
```

## Packaged App Enhancements

The current packaged app already loads these Hermes enhancement files:

```text
dist\assets\hermes-enhance.js
dist\assets\hermes-enhance.css
dist\assets\hermes-chat-enhance.js
dist\assets\hermes-chat-enhance.css
dist\assets\hermes-env-enhance.js
dist\assets\hermes-env-enhance.css
dist\assets\real-hermes-ui.js
dist\assets\real-hermes-ui.css
dist\assets\hermes-frame.html
```

Main-process Hermes IPC exists in:

```text
dist\main\index.js
```

Preload exposes Hermes APIs in:

```text
dist\preload\index.js
```

## Development Direction

This source layer treats the installed app as the current baseline. The next
development steps are:

1. Preserve current UI behavior.
2. Move mutable Hermes state toward `E:\data\.hermes`.
3. Normalize Hermes diagnostics and status text.
4. Replace dist-only patches with source-owned modules when full upstream
   application source is available.
