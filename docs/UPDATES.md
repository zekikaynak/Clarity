# GitHub Updates / Güncellemeler

Repository: https://github.com/zekikaynak/Clarity

Start Clarity.bat checks published GitHub Releases on each normal launch. Beta installs accept beta and stable semantic versions, never older versions. Draft releases are ignored. Network errors, missing releases and invalid packages leave the installed version usable. --skip-update skips the online check; --check performs local prerequisite checks only.

Only validated application files under app/ are updated. The BAT bootstrap, runtime executable, browser profile, LocalAppData/Clarity and personal files (.env, app/data, logs and caches) are not replaced. An overlay copy retains unlisted files. Before switching, an entire previous app backup and a transaction journal are retained in runtime/updates. A failed installation check rolls back automatically; an interrupted swap is recovered on the next launch. Backups are not automatically deleted.

A running Clarity session is never terminated by the updater. Close its server console and reopen the BAT to apply an available update. The launcher keeps 127.0.0.1:3080 as its browser address instead of silently changing ports. localhost and 127.0.0.1 are distinct browser origins; continue using the same address and browser as before. The updater never clears localStorage, IndexedDB, cookies or chart settings. TradingView is an external hosted widget: drawings that its own component has not saved cannot be exported or guaranteed by this updater. Keep important chart layouts saved through the provider's supported mechanism.

## Publish A New Version

1. Update app/public/release.js, app/package.json and app/package-lock.json to the same semantic version (for example 1.0.0-beta.2).
2. Run the tests, then: runtime/node.exe app/build-release.mjs PATH_TO_A_NEW_OUTPUT_FOLDER
3. Create a GitHub Release with the matching tag v1.0.0-beta.2. Attach BOTH clarity-update.json and clarity-update.zip generated together. Publish the release. A commit alone is not a published update.
4. Also attach the complete Windows ZIP for new installations. Keep user data and runtime/updates out of that ZIP.

The update manifest lists exact byte lengths and SHA-256 hashes. Archive entries, paths, sizes, checksums and GitHub asset digests (when provided) are validated before application. This protects integrity; repository publishing access must remain trusted. There is no embedded private token and no login requirement for end users of the public repository.
