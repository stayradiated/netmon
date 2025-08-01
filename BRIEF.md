# **Project Brief — “netmon”**

## 1 · Goal

Build a **zero-backend, ultra-lightweight dashboard** that answers one question on the living-room Apple TV:

> **“Is the internet good enough for normal web browsing right now?”**

## 2 · Key Features & Metrics

| Metric                                                    | Probe method                                                                 | Update cadence | Display                      |
| --------------------------------------------------------- | ---------------------------------------------------------------------------- | -------------- | ---------------------------- |
| **HTTP latency (RTT)**                                    | `fetch()` a 204/HEAD resource (e.g., `https://www.gstatic.com/generate_204`) | every 15 s     | live number + 24 h sparkline |
| **Fetch success rate** (% of last 8 pings that succeeded) | derived from same probe                                                      | every 15 s     | live number                  |
| **Download burst speed** (kB/s)                           | timed 128 kB GET (`https://speed.cloudflare.com/__down?bytes=131072`)        | every 30 min   | live number + 24 h sparkline |
| **Overall health badge**                                  | worst-case of the three metrics mapped to 🟢 / 🟡 / 🔴                       | every cycle    | colored chip at top          |

Thresholds (config in `config.js`):

```js
RTT:      { good: 200, warn: 500 },             // ms
Success:  { good: 98,  warn: 95  },             // %
Download: { good: 250, warn: 100 }              // kB/s
```

## 3 · Functional Requirements

1. **Self-contained static site** — opens from `index.html`; no build step, no server.
2. **Vanilla stack** — plain HTML/CSS/JS; may use *one* lightweight CDN script (e.g., Chart.js ≤ 35 kB min+gzip) for sparklines, otherwise raw `<canvas>`.
3. **Bandwidth ceiling** — < 0.5 MB/hour with default cadences.
4. **24 h history** — held in `localStorage`; trimmed on insert.
5. **Apple TV friendly**

   * 1920 × 1080 safe layout
   * Large fonts (min 24 px) and high-contrast colors
   * Works in “TV Browser” or via AirPlay mirroring.
6. **Resilience**

   * Use `AbortController` for each fetch (6 s for pings, 12 s for download).
   * Probe loop keeps running even after failures.
   * Badge shows 🔴 if 3 consecutive pings fail.

## 4 · Non-Functional Requirements

* **No heavy frameworks** (React/Vue/etc.).
* **No CORS issues** — choose probe URLs that send permissive headers or use mode:`no-cors`.
* **Portable hosting** — must work from local file, GitHub Pages, or Netlify.
* **Code quality** — ES2020+, ESLint clean, fully commented.
* **Accessibility** — badge color also exposed via `aria-label` text (e.g., “status good”).

## 5 · Deliverables

1. `index.html` – markup and layout
2. `style.css` – responsive, TV-legible styles
3. `netmon.js` – probe loop, storage, rendering
4. `config.js` – thresholds & timing constants
5. `README.md` – setup, deployment, parameter tuning

*(If Chart.js used, load via `<script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>`; otherwise include `sparklines.js` with minimal canvas drawing.)*

## 6 · Suggested Implementation Steps

1. **Skeleton**: header badge, three stat blocks, two canvases.
2. **Ping module**: Promise returning `{ ok, rtt }`; integrate AbortController.
3. **Loop & history**: cycle timer, push into arrays, trim > 24 h, write to `localStorage`.
4. **Render logic**:

   * Update DOM numbers.
   * Compute success % of last 8.
   * Compute badge class.
5. **Charts**:

   * If using Chart.js, datasets of `{x, y}`; `animation:false`.
   * Else, roll your own tiny line draw on canvas.
6. **Download test**: run via `setInterval`; store `{ts, rate}` separately.
7. **Config extraction**: move thresholds/timing to `config.js`.
8. **Polish**: responsive CSS, dark/light support, error handling.
9. **Manual test**: unplug WAN, throttle link, confirm badge flips.

## 7 · Timeline & Effort Estimate

| Task                           | Est. hrs |
| ------------------------------ | -------- |
| Project setup, skeleton layout | 2        |
| Probe + loop implementation    | 3        |
| History & storage              | 2        |
| Chart integration              | 2        |
| Download test                  | 1        |
| Styling & Apple TV tweaks      | 2        |
| Testing & README               | 2        |
| **Total**                      | **14 h** |

---

### Ready-to-start

All assets fit in a single repo (`/netmon`).  No external APIs other than the public probe URLs.  Ping me if any probe hosts block CORS during development—fallbacks are ready.

