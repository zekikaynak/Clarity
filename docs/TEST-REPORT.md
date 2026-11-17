# Clarity Beta 1.0 — Verification

18 November 2026 · Windows x64 · package version 1.0.0-beta.1.

- 57 automated tests passed; zero failures. Includes exact donation asset/network/address pairing, release identity, native chart language URL, dependency lock checks and volume outlier/hit-target behavior.
- Start Clarity.bat --check passed with bundled Node.js 24.17.0 and four required production dependencies.
- The BAT started the real server and returned matching Beta health data. A second BAT launch reused that service and invoked the default browser opener. Runtime download was not necessary on this machine; the missing-runtime download/install path has not been exercised on a clean Windows VM.
- English native chart visibly displayed Indicators and English interval labels. Its resource URL used /w/en/; Turkish uses /w/tr/.
- Recent volume visibly renders wider logarithmic bars. Clicking a painted bar opens real OHLC/volume details. Linear mode remains available. Automated tests verify outlier visibility without changing source values and exclude blank gaps from selection.
- All four support network selections displayed their exact provided address. Copy feedback and clipboard output were verified for BEP20, Solana and Polygon. TRC20 clipboard contents were also rechecked and matched the exact address.
- Prior responsive overview alignment checks at 1101–3840 px and narrow-width overflow checks remain covered by the retained layout. Beta additions were checked at 390 px (352 px dialog, no page overflow) and 3440 px (no page overflow).
- Release root contains Start Clarity.bat and app/docs/runtime directories. Clarity.exe and the obsolete compiled-launcher build directory were removed after archiving outside the release root.
- This is a point-in-time verification. External providers can be delayed, unavailable or rate limited. No claim of continuous provider availability or clean-VM installation testing is made.


## Beta 1.0 Completion Checks

- 65 automated tests passed, including update integrity, path safety, version order, personal-file preservation, rollback and interrupted-swap recovery.
- Beta info opens a real dialog and supports click, keyboard, Escape and close.
- All 13 navigation destinations fit without menu overflow at 3440x1440, 1920x1080, 1366x768, 1280x600, 844x390 and 390x844.
- The running launcher/server were stopped, then Start Clarity.bat performed successful local prerequisite checks and started the server with automatic browser opening.
- The generated update ZIP was extracted by the actual Windows extraction routine and all 3111 file hashes were verified. Source repository: zekikaynak/Clarity.
- Published v1.0.0-beta.1 at https://github.com/zekikaynak/Clarity/releases/tag/v1.0.0-beta.1 with the portable Windows package and matching update manifest/archive.
- A separate beta.0 test installation downloaded the real GitHub release, verified/extracted it, upgraded to beta.1 and retained app/.env and app/data/preservation-test.json exactly. A full backup and committed transaction were present.
- The same upgrade was then repeated through Start Clarity.bat: the BAT received the update result, rechecked the new version and automatically started the beta.1 server. Interrupted app-directory recovery was also exercised through the BAT itself.
- These preservation markers test the updater's filesystem behavior; they are not an export or persistence test of third-party TradingView drawings.
