# Clarity Beta 1.0

Version: 1.0.0-beta.1 · 18 November 2026

- Replaced the Clarity EXE launcher with Start Clarity.bat and a colored dependency/server/browser startup flow.
- Added consent-based missing runtime/package setup, official runtime checksum verification, and existing-server reuse.
- Improved recent-volume visibility with logarithmic/linear scaling, wider bars, a documented visibility floor and persistent choices.
- Native TradingView component language now follows the application's Turkish/English selection.
- Added Beta 1.0 development status and a network-specific USDT/USDC developer-support dialog.
- Retained watchlists, chart drawings, live data, locale-aware dates and aligned responsive overview panels.

- Added transactional GitHub Release updates with checksums, backups, interrupted-update recovery and personal-file preservation.
- Beta info now opens a dialog; navigation fits the available viewport height without a menu scrollbar.

## Beta 1.0 · Update 2 (1.0.0-beta.2)

- Reorganized the sidebar into seven primary destinations and a spacious More Tools panel, retaining all thirteen destinations without a menu scrollbar.
- Checked navigation and page overflow at 3440x1440, 1920x1080, 1366x768, 1280x600, 844x390 and 390x844. The secondary tools panel was exercised by opening Derivatives.
- Added full-screen English overview and terminal captures to the repository README, with professional badges, feature summaries and setup/update documentation.
- All 65 automated tests passed.

## Beta 1.0 · Update 3 (1.0.0-beta.3)

- Restored all thirteen sidebar destinations in their original order and removed the More Tools panel. Menu labels are slightly smaller.
- Expanded README Features to thirty individual capabilities, with explicit coverage limits instead of six broad groups.
- Retained the English Update 2 previews with their capture version identified. Browser screenshot verification was unavailable for Update 3.

### Update 4 Detail · Connection Status

- Removed the separate live instrument ticker from the bottom of the sidebar.
- Connection Status now uses a subtle green gradient and pulsing dot when checked sources and the live relay are healthy; amber indicates pending/partial data and red indicates disconnection.
- Source diagnostics refresh every 30 seconds. Stale trade flow stops showing a healthy state. Reduced-motion preferences disable the pulse.
- Verified all five state cases (healthy, partial, disconnected, stale, unknown), passed the 65 existing automated tests and confirmed the actual healthy gradient/pulse and status-page navigation in the browser.

### Update 4 Detail · Support Action And Volume Header

- Restyled the developer-support action with violet surfaces, a warm gold accent and a separate icon treatment, distinct from green connection health.
- Kept the live/period/candle-count status fixed during volume hover. Reserved stable columns for the scale selector, information icon and status text.
- Avoided redundant DOM text writes, cached popup markup, batched hover drawing by animation frame and reused the canvas backing buffer until its size changes.
- All 65 automated tests passed. Repeated pointer drags across the volume bars left selector/information-icon X coordinates and the 358 px tools width unchanged at a 1920 px viewport. Linear/logarithmic selection retained the same geometry. Candle details remained available. Temporary viewport and scale changes were restored.

### Update 4 Detail · Left-Aligned Volume Scale And Calendar Results

- Moved the volume scale selector and its information icon to the left edge of the volume header; the live status remains right-aligned.
- Joined calendar actual values and expectation comparisons into high-contrast bordered badges. Results default to neutral when no comparable forecast or clear indicator direction is available.
- Known labour/activity indicators use economic direction versus forecast; nonnegative inflation indicators use inflation-pressure direction. These colors are not predictions of crypto prices. Equal values, rate decisions and ambiguous cases remain neutral.
- 65 existing tests passed; eight additional direction scenarios were checked. Actual neutral/positive badge rendering, readable comparison text and the left-hand scale selector position were confirmed in the browser.

### Update 4 Detail · Crypto-Oriented Calendar Impact

- Replaced economic-indicator goodness colors with a clearly labeled conditional US policy/liquidity-channel interpretation for supported releases. Hotter inflation, employment or activity surprises can be labeled potential crypto pressure; cooler readings can be potential support, subject to explicit context limitations.
- Actual-versus-forecast comparison remains a separate factual label. No numerical surprise is blue; unsupported, missing-forecast, non-US or conflicting/severe cases are amber and explicitly marked Impact Uncertain rather than neutral.
- This is an inference heuristic, not measured market response or a guaranteed price prediction. Basis: Federal Reserve policy transmission overview (https://www.federalreserve.gov/faqs/money_12856.htm) and IMF, The Crypto Cycle and US Monetary Policy (https://www.imf.org/en/publications/wp/issues/2023/08/04/the-crypto-cycle-and-us-monetary-policy-534834).
- 65 existing automated tests and 10 targeted crypto-impact/presentation cases passed.

## Beta 1.0 · Update 4 (1.0.0-beta.4)

- Published the distinct violet/gold developer-support action and state-aware connection indicator; removed the duplicate live-instrument sidebar row.
- Stabilized the volume header, moved scale selection to the left and reduced hover redraw/DOM churn.
- Added high-contrast actual/forecast badges and explicitly labeled conditional crypto support/pressure, neutral surprise and uncertain impact states.
- Refreshed both English overview and live-terminal screenshots. Both are directly visible in the README.
