const puppeteer = require('puppeteer');
const axios = require('axios');

const C_AND_C_SERVER_URL = 'https://traffic-generator-bot.onrender.com/'; // Change to your Render URL

// Store proxies (currently disabled)
let proxies = [];

async function fetchProxies() {
    console.log('[*] Proxies disabled - using direct connection');
    return [];
}

async function getJob() {
    try {
        const response = await axios.get(`${C_AND_C_SERVER_URL}/api/job`);
        return response.data;
    } catch (error) {
        console.error('[-] Could not connect to C&C server:', error.message);
        return { sleep: 30000 };
    }
}

async function executeJob(job) {
    if (proxies.length === 0) proxies = await fetchProxies();
    let proxy = proxies.length > 0 ? proxies[Math.floor(Math.random() * proxies.length)] : null;

    let browser;
    try {
        const launchOptions = {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled', '--window-size=1920,1080'],
            defaultViewport: null
        };
        if (proxy) launchOptions.args.push(`--proxy-server=${proxy}`);

        browser = await puppeteer.launch(launchOptions);
        const page = await browser.newPage();

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });

        console.log(`[+] Visiting ${job.targetUrl}${proxy ? ` with proxy ${proxy}` : ' (direct)'}...`);
        await page.goto(job.targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        console.log(`[✓] Successfully loaded ${job.targetUrl}`);

        // Report visit
        try {
            await axios.post(`${C_AND_C_SERVER_URL}/api/report-visit`, { url: job.targetUrl });
            console.log(`[✓] Visit reported to server`);
        } catch (e) {
            console.error('[-] Failed to report visit:', e.message);
        }

        // Scroll randomly
        await page.evaluate(() => window.scrollBy(0, Math.random() * 500));

        // Random click
        const viewport = await page.viewport();
        if (viewport) {
            const x = Math.floor(Math.random() * viewport.width);
            const y = Math.floor(Math.random() * viewport.height);
            await page.mouse.move(x, y, { steps: 10 });
            await page.mouse.click(x, y);
            console.log(`[*] Clicked at ${x}, ${y}`);
        }

        const stayDuration = job.duration || 30000;
        console.log(`[*] Staying on page for ${stayDuration}ms...`);
        await new Promise(resolve => setTimeout(resolve, stayDuration));

    } catch (err) {
        console.error(`[✗] Error: ${err.message}`);
    } finally {
        if (browser) await browser.close();
    }
}

async function main() {
    while (true) {
        const job = await getJob();
        if (job.sleep) {
            await new Promise(resolve => setTimeout(resolve, job.sleep));
            continue;
        }

        const concurrency = job.concurrency || 5;
        const promises = [];

        console.log(`[*] Starting batch of ${concurrency} bots...`);

        for (let i = 0; i < concurrency; i++) {
            promises.push(executeJob(job));
            await new Promise(resolve => setTimeout(resolve, 500)); // stagger
        }

        await Promise.all(promises);
        await new Promise(resolve => setTimeout(resolve, job.interval));
    }
}

main();
