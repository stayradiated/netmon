const CONFIG = {
    thresholds: {
        rtt: {
            good: 200,  // ms
            warn: 500   // ms
        },
        success: {
            good: 98,   // %
            warn: 95    // %
        },
        download: {
            good: 250,  // KB/s
            warn: 100   // KB/s
        }
    },
    
    timing: {
        rttInterval: 1000,          // 1 second
        downloadInterval: 1800000,  // 30 minutes
        probeTimeout: 6000,         // 6 seconds
        downloadTimeout: 12000,     // 12 seconds
        historyDuration: 86400000   // 24 hours in ms
    },
    
    urls: {
        probe: 'https://www.gstatic.com/generate_204',
        download: 'https://speed.cloudflare.com/__down?bytes=131072'
    },
    
    ui: {
        maxDataPoints: 288,         // 24h / 5min = 288 points
        chartUpdateInterval: 60000, // Update charts every minute
        dateFormat: {
            time: { hour: '2-digit', minute: '2-digit' },
            full: { hour: '2-digit', minute: '2-digit', second: '2-digit' }
        }
    }
};