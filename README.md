# netmon - Network Monitor Dashboard

A zero-backend, ultra-lightweight network monitoring dashboard designed for Apple TV that provides real-time internet quality metrics.

## Features

- **Real-time HTTP Latency Monitoring** - Measures round-trip time every second
- **Connection Success Rate** - Tracks percentage of successful pings (last 8 attempts)
- **Download Speed Testing** - Periodic burst speed tests every 30 minutes
- **24-Hour History** - Sparkline charts showing historical trends
- **Health Status Badge** - At-a-glance network quality indicator (🟢 Good / 🟡 Warning / 🔴 Poor)
- **Apple TV Optimized** - Large fonts, high contrast, 1920x1080 safe area
- **Zero Backend Required** - Runs entirely in the browser with localStorage persistence

## Quick Start

1. Clone or download this repository
2. Open `index.html` in any modern web browser
3. That's it! The dashboard will start monitoring immediately

### Deployment Options

- **Local File** - Simply open index.html from your file system
- **GitHub Pages** - Push to a GitHub repo and enable Pages
- **Netlify** - Drop the folder into Netlify
- **Any Static Host** - Upload all files to any web server

## Configuration

Edit `config.js` to customize thresholds and timing:

```javascript
// Network quality thresholds
thresholds: {
    rtt: {
        good: 200,  // ms - RTT below this is "good"
        warn: 500   // ms - RTT below this is "warning", above is "poor"
    },
    success: {
        good: 98,   // % - Success rate above this is "good"
        warn: 95    // % - Success rate above this is "warning"
    },
    download: {
        good: 250,  // KB/s - Download speed above this is "good"
        warn: 100   // KB/s - Download speed above this is "warning"
    }
}

// Probe intervals
timing: {
    rttInterval: 1000,          // How often to check latency (ms)
    downloadInterval: 1800000,  // How often to test download (ms)
    probeTimeout: 6000,         // Timeout for latency probes (ms)
    downloadTimeout: 12000      // Timeout for download tests (ms)
}
```

## Apple TV Setup

### Option 1: Direct Browsing
1. Open the TV Browser app on Apple TV
2. Navigate to your hosted netmon URL
3. The dashboard will automatically adapt to TV display

### Option 2: AirPlay Mirroring
1. Open netmon on your Mac/iPhone/iPad
2. Use AirPlay to mirror to Apple TV
3. Enable full-screen mode for best experience

## Technical Details

### Metrics Explained

- **HTTP Latency (RTT)**: Measures time to reach Google's connectivity check endpoint
- **Success Rate**: Percentage of successful probes in the last 8 attempts
- **Download Speed**: Burst test using Cloudflare's speed test endpoint (128KB payload)

### Bandwidth Usage

With default settings, netmon uses approximately:
- Latency probes: ~3.6 MB/hour (with 1-second interval)
- Download tests: ~0.25 MB/hour
- **Total: < 4 MB/hour**

### Browser Compatibility

- Chrome/Edge 90+
- Safari 14+
- Firefox 88+
- Apple TV Browser (tvOS 14+)

### Data Persistence

All historical data is stored in browser localStorage:
- Automatically maintains 24 hours of history
- Data persists across browser sessions
- Clear browser data to reset history

## Troubleshooting

### No data showing
- Check browser console for errors
- Ensure internet connection is active
- Try refreshing the page

### CORS errors
- The default probe endpoints should work without CORS issues
- If blocked, you can modify `CONFIG.urls` to use alternative endpoints

### Charts not updating
- Charts update every minute to optimize performance
- Historical data points are averaged to 5-minute intervals
- Ensure localStorage is not disabled in browser settings

### Apple TV specific issues
- Ensure TV Browser is updated to latest version
- Try using Safari on Mac with AirPlay as alternative
- Check that JavaScript is enabled in TV Browser settings

## Development

### File Structure
```
netmon/
├── index.html    # Main dashboard layout
├── style.css     # Responsive TV-optimized styles  
├── netmon.js     # Core monitoring logic
├── config.js     # User configuration
└── README.md     # This file
```

### Adding Custom Probe Endpoints

To use alternative endpoints, modify `config.js`:

```javascript
urls: {
    probe: 'https://your-endpoint.com/check',
    download: 'https://your-endpoint.com/testfile'
}
```

Requirements for probe endpoints:
- Must support HEAD or GET requests
- Should return quickly (< 1 second ideally)
- Must send CORS headers or support no-cors mode

### Modifying Metrics

The monitoring logic in `netmon.js` is modular. To add new metrics:

1. Add probe function similar to existing `probe()` or `measureDownload()`
2. Add storage array to state object
3. Create UI elements in index.html
4. Add update logic to main loops

## License

MIT License - See LICENSE file for details

## Credits

Built with vanilla JavaScript and Chart.js (https://www.chartjs.org/)