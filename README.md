# OpenClawPro Agent Hub

This is now the complete source project for the portable USB client.

The old dist-injected Hermes patch layer has been removed from the deployed app.
The packaged app is built from this source tree and deployed as a complete
`resources/app` replacement.

## Layout

```text
E:\source\openclawpro-agent-hub   source project
E:\win-unpacked\resources\app     deployed Electron app
E:\runtime                        portable runtimes
E:\data\.openclaw                 OpenClaw data
E:\data\.hermes                   Hermes data
```

Hermes program files currently use:

```text
E:\runtime\HermesPortable
```

Hermes mutable state is redirected to:

```text
E:\data\.hermes
```

## Build

Install dependencies on a fast local disk when possible, then build:

```powershell
npm install
npm run typecheck
npm run build
```

Deploy the full app:

```powershell
npm run deploy:usb
```

## Diagnostics

```powershell
npm run scan:usb
npm run verify:hermes
```

## Notes

Backups of the previous packaged app are under:

```text
E:\backups
```

Old packaged Hermes patch assets are not part of this source build.
