# Implementation Plan - netmon

## Overview
Build a zero-backend, ultra-lightweight network monitoring dashboard optimized for Apple TV display that shows real-time internet quality metrics.

## Architecture

### File Structure
```
netmon/
├── index.html      # Main dashboard UI
├── style.css       # TV-optimized responsive styles
├── netmon.js       # Core monitoring logic
├── config.js       # Configurable thresholds and timing
└── README.md       # Documentation
```

### Technology Stack
- Vanilla HTML/CSS/JavaScript (ES2020+)
- Chart.js 4.x for sparkline charts (CDN)
- localStorage for 24h history persistence
- No build tools or backend required

## Implementation Phases

### Phase 1: Project Setup & Skeleton (2 hours)
1. Create basic HTML structure with:
   - Header with overall health badge
   - Three metric display blocks (RTT, Success Rate, Download Speed)
   - Canvas elements for sparkline charts
2. Set up responsive CSS grid layout (1920x1080 safe area)
3. Configure ESLint for code quality
4. Create config.js with initial thresholds

### Phase 2: HTTP Probe Module (3 hours)
1. Implement `probe()` function:
   ```js
   async function probe(url, timeout) {
     // Returns { ok: boolean, rtt: number }
   }
   ```
2. Use AbortController for timeout handling (6s default)
3. Handle CORS with appropriate fetch modes
4. Test with Google's 204 endpoint

### Phase 3: Main Loop & State Management (2 hours)
1. Create probe scheduler:
   - RTT/Success: every 15 seconds
   - Download speed: every 30 minutes
2. Implement circular buffer for history:
   - Store last 24 hours of data
   - Automatic trimming on insert
3. Calculate derived metrics:
   - Success rate from last 8 pings
   - Overall health status (worst-case)

### Phase 4: localStorage Integration (2 hours)
1. Design storage schema:
   ```js
   {
     rttHistory: [{timestamp, value}],
     downloadHistory: [{timestamp, value}],
     lastProbeTime: timestamp
   }
   ```
2. Implement save/load functions with error handling
3. Handle storage quota limits gracefully

### Phase 5: Chart Implementation (2 hours)
1. Initialize Chart.js with minimal config
2. Create two line charts:
   - RTT sparkline (24h rolling window)
   - Download speed sparkline (24h rolling window)
3. Configure for performance:
   - Disable animations
   - Minimal grid/labels
   - High contrast colors

### Phase 6: Download Speed Test (1 hour)
1. Implement timed download test:
   ```js
   async function measureDownload() {
     // Fetch 128KB from Cloudflare
     // Calculate KB/s
   }
   ```
2. Handle timeout (12s) and errors
3. Update storage with results

### Phase 7: UI Updates & Rendering (2 hours)
1. Create render functions for:
   - Live metric values
   - Health badge (🟢/🟡/🔴)
   - Chart data updates
2. Implement smooth DOM updates
3. Add ARIA labels for accessibility

### Phase 8: Polish & Apple TV Optimization (2 hours)
1. Fine-tune CSS for TV display:
   - Minimum 24px fonts
   - High contrast colors
   - Large touch targets
2. Add dark/light mode support
3. Optimize for TV Browser quirks

### Phase 9: Testing & Documentation (2 hours)
1. Manual testing scenarios:
   - Network disconnection
   - Throttled connections
   - 24-hour continuous run
2. Write comprehensive README:
   - Setup instructions
   - Configuration options
   - Deployment guides

## Key Technical Decisions

### CORS Handling
- Use `mode: 'no-cors'` for probe requests where possible
- Fallback endpoints if primary URLs blocked
- Document alternative probe URLs

### Performance Optimization
- Batch DOM updates in animation frames
- Limit chart data points (e.g., 5-minute intervals)
- Efficient localStorage serialization

### Error Resilience
- Graceful degradation on probe failures
- Continue operation with partial data
- Clear error indication in UI

### Bandwidth Management
- Calculate exact payload sizes
- Optimize probe frequency
- Target < 0.5 MB/hour total

## Configuration Options
```js
// config.js
export const CONFIG = {
  thresholds: {
    rtt: { good: 200, warn: 500 },      // ms
    success: { good: 98, warn: 95 },    // %
    download: { good: 250, warn: 100 }  // KB/s
  },
  timing: {
    rttInterval: 15000,        // 15 seconds
    downloadInterval: 1800000, // 30 minutes
    probeTimeout: 6000,        // 6 seconds
    downloadTimeout: 12000     // 12 seconds
  },
  urls: {
    probe: 'https://www.gstatic.com/generate_204',
    download: 'https://speed.cloudflare.com/__down?bytes=131072'
  }
};
```

## Success Criteria
- [x] Opens directly from index.html
- [x] < 0.5 MB/hour bandwidth usage
- [x] Works on Apple TV Browser
- [x] 24-hour history persistence
- [x] Clear health status indication
- [x] Continues operation during failures
- [x] No external dependencies (except Chart.js CDN)

## Estimated Timeline
Total: 14 hours of development
- Can be completed in 2-3 days of focused work
- Allows for testing and refinement between phases