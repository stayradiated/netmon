// State management
const state = {
    rttHistory: [],
    downloadHistory: [],
    lastProbeResults: [],
    charts: {
        rtt: null,
        download: null
    },
    timers: {
        probe: null,
        download: null
    }
};

// Probe module with AbortController
async function probe(url = CONFIG.urls.probe, timeout = CONFIG.timing.probeTimeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const startTime = performance.now();
    
    try {
        const response = await fetch(url, {
            method: 'HEAD',
            mode: 'no-cors',
            cache: 'no-cache',
            signal: controller.signal
        });
        
        const endTime = performance.now();
        const rtt = Math.round(endTime - startTime);
        
        clearTimeout(timeoutId);
        
        return {
            ok: true,
            rtt: rtt,
            timestamp: Date.now()
        };
    } catch (error) {
        clearTimeout(timeoutId);
        
        return {
            ok: false,
            rtt: null,
            timestamp: Date.now(),
            error: error.name === 'AbortError' ? 'Timeout' : error.message
        };
    }
}

// Download speed test
async function measureDownload() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.timing.downloadTimeout);
    
    const startTime = performance.now();
    
    try {
        const response = await fetch(CONFIG.urls.download, {
            method: 'GET',
            cache: 'no-cache',
            signal: controller.signal
        });
        
        const data = await response.arrayBuffer();
        const endTime = performance.now();
        
        clearTimeout(timeoutId);
        
        const durationSeconds = (endTime - startTime) / 1000;
        const sizeKB = data.byteLength / 1024;
        const speedKBps = Math.round(sizeKB / durationSeconds);
        
        return {
            ok: true,
            speed: speedKBps,
            timestamp: Date.now()
        };
    } catch (error) {
        clearTimeout(timeoutId);
        
        return {
            ok: false,
            speed: null,
            timestamp: Date.now(),
            error: error.name === 'AbortError' ? 'Timeout' : error.message
        };
    }
}

// Calculate success rate from last N probes
function calculateSuccessRate(results, count = 8) {
    const recent = results.slice(-count);
    if (recent.length === 0) return null;
    
    const successful = recent.filter(r => r.ok).length;
    return Math.round((successful / recent.length) * 100);
}

// Determine overall health status
function calculateHealthStatus(rtt, successRate, downloadSpeed) {
    const statuses = [];
    
    if (rtt !== null) {
        if (rtt <= CONFIG.thresholds.rtt.good) {
            statuses.push('good');
        } else if (rtt <= CONFIG.thresholds.rtt.warn) {
            statuses.push('warn');
        } else {
            statuses.push('bad');
        }
    }
    
    if (successRate !== null) {
        if (successRate >= CONFIG.thresholds.success.good) {
            statuses.push('good');
        } else if (successRate >= CONFIG.thresholds.success.warn) {
            statuses.push('warn');
        } else {
            statuses.push('bad');
        }
    }
    
    if (downloadSpeed !== null) {
        if (downloadSpeed >= CONFIG.thresholds.download.good) {
            statuses.push('good');
        } else if (downloadSpeed >= CONFIG.thresholds.download.warn) {
            statuses.push('warn');
        } else {
            statuses.push('bad');
        }
    }
    
    // Return worst status
    if (statuses.includes('bad')) return 'bad';
    if (statuses.includes('warn')) return 'warn';
    if (statuses.includes('good')) return 'good';
    return 'unknown';
}

// Storage functions
function saveToStorage() {
    try {
        const data = {
            rttHistory: state.rttHistory,
            downloadHistory: state.downloadHistory,
            lastProbeResults: state.lastProbeResults,
            lastSave: Date.now()
        };
        localStorage.setItem('netmon_data', JSON.stringify(data));
    } catch (error) {
        console.error('Failed to save to localStorage:', error);
    }
}

function loadFromStorage() {
    try {
        const stored = localStorage.getItem('netmon_data');
        if (!stored) return;
        
        const data = JSON.parse(stored);
        const now = Date.now();
        const cutoff = now - CONFIG.timing.historyDuration;
        
        // Filter out old data
        state.rttHistory = (data.rttHistory || []).filter(item => item.timestamp > cutoff);
        state.downloadHistory = (data.downloadHistory || []).filter(item => item.timestamp > cutoff);
        state.lastProbeResults = (data.lastProbeResults || []).slice(-8);
    } catch (error) {
        console.error('Failed to load from localStorage:', error);
    }
}

// Trim history arrays to 24 hours
function trimHistory() {
    const now = Date.now();
    const cutoff = now - CONFIG.timing.historyDuration;
    
    state.rttHistory = state.rttHistory.filter(item => item.timestamp > cutoff);
    state.downloadHistory = state.downloadHistory.filter(item => item.timestamp > cutoff);
}

// UI update functions
function updateHealthBadge(status) {
    const badge = document.getElementById('healthBadge');
    badge.className = `health-badge ${status}`;
    
    const statusText = {
        good: 'Good',
        warn: 'Warning',
        bad: 'Poor',
        unknown: 'Checking...'
    };
    
    badge.querySelector('.badge-text').textContent = statusText[status];
    badge.setAttribute('aria-label', `Network status: ${statusText[status]}`);
}

function updateMetricDisplay(elementId, value, unit = '') {
    const element = document.getElementById(elementId);
    if (value === null || value === undefined) {
        element.textContent = '--';
    } else {
        element.textContent = value;
    }
}

function updateLastUpdate() {
    const element = document.getElementById('lastUpdate');
    const now = new Date();
    element.textContent = now.toLocaleTimeString(undefined, CONFIG.ui.dateFormat.full);
}

function updateNextDownload() {
    const element = document.getElementById('nextDownload');
    const lastDownload = state.downloadHistory[state.downloadHistory.length - 1];
    
    if (lastDownload) {
        const nextTime = new Date(lastDownload.timestamp + CONFIG.timing.downloadInterval);
        element.textContent = nextTime.toLocaleTimeString(undefined, CONFIG.ui.dateFormat.time);
    } else {
        element.textContent = 'Soon';
    }
}

// Chart initialization and updates
function initializeCharts() {
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: {
            intersect: false,
            mode: 'index'
        },
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                enabled: false
            }
        },
        scales: {
            x: {
                display: false
            },
            y: {
                display: true,
                grid: {
                    color: getComputedStyle(document.documentElement).getPropertyValue('--chart-grid'),
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                },
                ticks: {
                    color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                    font: {
                        size: 16
                    }
                }
            }
        }
    };
    
    // RTT Chart
    const rttCtx = document.getElementById('rttChart').getContext('2d');
    state.charts.rtt = new Chart(rttCtx, {
        type: 'line',
        data: {
            datasets: [{
                data: [],
                borderColor: getComputedStyle(document.documentElement).getPropertyValue('--chart-line'),
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.4,
                fill: false
            }]
        },
        options: {
            ...chartOptions,
            scales: {
                ...chartOptions.scales,
                y: {
                    ...chartOptions.scales.y,
                    suggestedMin: 0,
                    suggestedMax: 1000
                }
            }
        }
    });
    
    // Download Speed Chart
    const downloadCtx = document.getElementById('downloadChart').getContext('2d');
    state.charts.download = new Chart(downloadCtx, {
        type: 'line',
        data: {
            datasets: [{
                data: [],
                borderColor: getComputedStyle(document.documentElement).getPropertyValue('--chart-line'),
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.4,
                fill: false
            }]
        },
        options: {
            ...chartOptions,
            scales: {
                ...chartOptions.scales,
                y: {
                    ...chartOptions.scales.y,
                    suggestedMin: 0
                }
            }
        }
    });
}

function updateCharts() {
    // Update RTT chart
    if (state.charts.rtt && state.rttHistory.length > 0) {
        const rttData = state.rttHistory.map(item => ({
            x: item.timestamp,
            y: item.value
        }));
        
        state.charts.rtt.data.datasets[0].data = rttData;
        state.charts.rtt.update('none');
    }
    
    // Update download chart
    if (state.charts.download && state.downloadHistory.length > 0) {
        const downloadData = state.downloadHistory.map(item => ({
            x: item.timestamp,
            y: item.value
        }));
        
        state.charts.download.data.datasets[0].data = downloadData;
        state.charts.download.update('none');
    }
}

// Main probe loop
async function runProbeLoop() {
    const result = await probe();
    
    // Store probe result
    state.lastProbeResults.push(result);
    if (state.lastProbeResults.length > 8) {
        state.lastProbeResults.shift();
    }
    
    // Store RTT if successful
    if (result.ok && result.rtt !== null) {
        state.rttHistory.push({
            timestamp: result.timestamp,
            value: result.rtt
        });
        updateMetricDisplay('rttValue', result.rtt);
    }
    
    // Calculate and update success rate
    const successRate = calculateSuccessRate(state.lastProbeResults);
    updateMetricDisplay('successValue', successRate);
    
    // Get latest download speed
    const latestDownload = state.downloadHistory[state.downloadHistory.length - 1];
    const downloadSpeed = latestDownload ? latestDownload.value : null;
    
    // Update health status
    const healthStatus = calculateHealthStatus(
        result.ok ? result.rtt : null,
        successRate,
        downloadSpeed
    );
    updateHealthBadge(healthStatus);
    
    // Update UI
    updateLastUpdate();
    updateNextDownload();
    
    // Trim and save
    trimHistory();
    saveToStorage();
    
    // Update charts every 10 seconds to avoid performance issues with 1-second updates
    if (Date.now() % 10000 < CONFIG.timing.rttInterval) {
        updateCharts();
    }
}

// Download test loop
async function runDownloadLoop() {
    const result = await measureDownload();
    
    if (result.ok && result.speed !== null) {
        state.downloadHistory.push({
            timestamp: result.timestamp,
            value: result.speed
        });
        updateMetricDisplay('downloadValue', result.speed);
        
        // Update charts
        updateCharts();
    }
    
    // Update next download time
    updateNextDownload();
    
    // Trim and save
    trimHistory();
    saveToStorage();
}

// Initialize and start monitoring
function initialize() {
    // Load saved data
    loadFromStorage();
    
    // Initialize charts
    initializeCharts();
    
    // Initial UI update
    if (state.rttHistory.length > 0) {
        const lastRtt = state.rttHistory[state.rttHistory.length - 1];
        updateMetricDisplay('rttValue', lastRtt.value);
    }
    
    if (state.downloadHistory.length > 0) {
        const lastDownload = state.downloadHistory[state.downloadHistory.length - 1];
        updateMetricDisplay('downloadValue', lastDownload.value);
    }
    
    const successRate = calculateSuccessRate(state.lastProbeResults);
    if (successRate !== null) {
        updateMetricDisplay('successValue', successRate);
    }
    
    // Update charts with historical data
    updateCharts();
    
    // Start probe loop
    runProbeLoop();
    state.timers.probe = setInterval(runProbeLoop, CONFIG.timing.rttInterval);
    
    // Start download loop
    runDownloadLoop();
    state.timers.download = setInterval(runDownloadLoop, CONFIG.timing.downloadInterval);
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (state.timers.probe) clearInterval(state.timers.probe);
    if (state.timers.download) clearInterval(state.timers.download);
    saveToStorage();
});

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}