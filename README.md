# Clarity Beta 1.0 · Market Intelligence

## Windows / Başlatma

Extract the complete folder and double-click `Start Clarity.bat`. Keep `app`, `docs` and `runtime` together. The colored console checks Node.js (24+) and locked application dependencies, starts the local server, prints its addresses and opens the default browser. Keep that console open; Ctrl+C stops its server. A second launch reuses an existing matching instance.

Paketi çıkartıp `Start Clarity.bat` dosyasını açın. Başlangıç gerekli bileşenleri kontrol eder; eksikse kurulum izni ister. Sunucuyu başlatır, adresleri gösterir ve varsayılan tarayıcıyı açar. Sunucu çalışırken pencere açık kalmalıdır. Durdurmak için Ctrl+C kullanın.

The Windows x64 release includes Node.js 24.17.0 and installed dependencies. If a compatible runtime is missing, the BAT offers a local download from the official Node.js distribution and verifies its SHA-256 against the official checksum list. No administrator access is required. Missing packages require consent and are installed using `npm ci --omit=dev --ignore-scripts`. Network access is required for downloads and market providers. The launcher is a BAT; no Clarity EXE, tray application or .NET launcher is included.

For a startup check only: `"Start Clarity.bat" --check`. Source development: run `npm ci`, `npm test` and `npm start` inside `app` with Node.js 24+.

## Beta / Geliştirme Aşamasında

UI label: **Clarity Beta 1.0**. Package/API version: **1.0.0-beta.1**. The ! beside the version explains its development status. This beta has no cloud accounts or cross-device synchronization. Each installation runs its own service on loopback ports 3080–3099. Browser settings, watchlists, portfolio records and alarms belong to the current browser. Runtime cache is stored under LocalAppData/Clarity, outside the distribution.

Turkish and English follow the selected application language; Auto uses the system language supplied by the launcher, with browser language as fallback. Native chart language follows that selection. Turkish dates use day/month/year and 24-hour time; English uses month/day/year and AM/PM. Event timezone remains Istanbul and is indicated. Public news headlines can be automatically translated in Turkish mode with originals retained.

## Volume / Hacim

Recent volume defaults to logarithmic scaling so one extreme value does not hide smaller bars. Positive bars have an 8 px visibility floor. This is a visual transformation, not a change to market data. Linear scaling is available; details always show actual OHLC and volume. Pointer selection requires a painted bar. Height and scale choices persist across routes and assets. Price movement and traded volume are different measurements.

## Developer Support

The sidebar support button opens an optional asset/network/address dialog with copy controls: USDT on TRC20 or BEP20; USDC on Solana or Polygon. Clarity does not connect wallets or execute transfers. The selected network and asset must match the destination.

## Data and Source

External public APIs and hosted charts have independent coverage, rate limits and availability. Missing values are not fabricated. Large pending orders are aggregated levels from received depth, not the entire exchange book. No trades are placed by Clarity.

Editable source, launcher, tests and lockfile are under `app`. Publish source and documentation to GitHub; attach the complete Windows package as a release archive. Exclude `app/node_modules`, runtime binaries, .env, browser records and caches from source commits. Licenses remain in `docs`, `runtime` and dependency directories. See THIRD_PARTY.md for provider notices.
