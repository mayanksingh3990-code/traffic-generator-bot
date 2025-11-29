const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 3000;

const CONFIG_FILE = path.join(__dirname, 'config.json');

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

let currentJob = {
    targetUrl: 'https://example.com',
    duration: 30000, // 30 seconds
    interval: 5000,  // 5 seconds
    region: null,
    concurrency: 5 // Default to 5 concurrent bots
};

// Load config from file if exists
if (fs.existsSync(CONFIG_FILE)) {
    try {
        const savedConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        currentJob = { ...currentJob, ...savedConfig };
        console.log('[*] Loaded config from file:', currentJob);
    } catch (err) {
        console.error('[-] Failed to load config file:', err.message);
    }
}

// Store stats in memory
let stats = {
    totalVisits: 0,
    visitsByUrl: {}
};

// API to get the current job
app.get('/api/job', (req, res) => {
    res.json(currentJob);
});

// API to update the job
app.post('/api/job', (req, res) => {
    const { targetUrl, duration, interval, region, concurrency } = req.body;
    if (targetUrl) {
        currentJob = {
            targetUrl,
            duration: parseInt(duration) || 60000,
            interval: parseInt(interval) || 5000,
            region: region || null,
            concurrency: parseInt(concurrency) || 5
        };
        
        // Save to file
        try {
            fs.writeFileSync(CONFIG_FILE, JSON.stringify(currentJob, null, 2));
            console.log('[*] Job updated and saved:', currentJob);
        } catch (err) {
            console.error('[-] Failed to save config file:', err.message);
        }

        res.json({ message: 'Job updated successfully', job: currentJob });
    } else {
        res.status(400).json({ error: 'Target URL is required' });
    }
});

// API to report a successful visit
app.post('/api/report-visit', (req, res) => {
    const { url } = req.body;
    if (url) {
        stats.totalVisits++;
        if (!stats.visitsByUrl[url]) {
            stats.visitsByUrl[url] = 0;
        }
        stats.visitsByUrl[url]++;
        console.log(`[+] Visit reported for ${url}. Total: ${stats.totalVisits}`);
        res.json({ success: true });
    } else {
        res.status(400).json({ error: 'URL is required' });
    }
});

// API to get stats
app.get('/api/stats', (req, res) => {
    res.json(stats);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`[+] C&C Server running on http://localhost:${PORT}`);
});