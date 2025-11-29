const puppeteer = require('puppeteer-core');
const chromium = require('chromium');
const axios = require('axios');

const C_AND_C_SERVER_URL = 'https://traffic-generator-bot.onrender.com/';

// Store proxies in memory
let proxies = [];

// Proxy disabled
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

async function launchBrowser(proxy = null) {
    const args = [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-blink-features=AutomationControlled",
        "--window-size=1920,1080"
    ];

    if (proxy) {
        args.push(`--proxy-server=${proxy}`);
    }

    return puppeteer.launch({
        executablePath: chromium.path,
        headless: true,
        args,
        defaultViewport: null
    });
}

async function executeJob(job) {
    if (proxies.length === 0) proxies = await fetchProxies();

    let useProxy = proxies.length > 0;
    let proxy = useProxy ? proxies[Math.floor(Math.random() * proxies.length)] : null;

    let browser;

    try {
        browser = await launchBrowser(proxy);

        const page = await browser.newPage();

        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        );

        console.log(`[+] Visiting ${job.targetUrl}${proxy ? ` proxy ${proxy}` : ''}`);

        await page.goto(job.targetUrl, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        console.log(`[✓] Page loaded: ${job.targetUrl}`);

        // Report visit
        await axios.post(`${C_AND_C_SERVER_URL}/api/report-visit`, {
            url: job.targetUrl
        });

        // Scroll
        await page.evaluate(() => {
            window.scrollBy(0, Math.random() * 500);
        });

        // Random click
        const viewport = await page.viewport();
        const x = Math.floor(Math.random() * viewport.width);
        const y = Math.floor(Math.random() * viewport.height);
        await page.mouse.move(x, y, { steps: 10 });
        await page.mouse.click(x, y);

        const stay = job.duration || 30000;
        await new Promise(r => setTimeout(r, stay));

    } catch (err) {
        console.log(`[✗] Error: ${err.message}`);
    } finally {
        if (browser) await browser.close().catch(() => {});
    }
}

async function main() {
    while (true) {
        const job = await getJob();

        if (job.sleep) {
            await new Promise(r => setTimeout(r, job.sleep));
            continue;
        }

        let concurrency = job.concurrency || 5;
        console.log(`[*] Starting batch of ${concurrency} bots...`);

        const workers = [];

        for (let i = 0; i < concurrency; i++) {
            workers.push(executeJob(job));
            await new Promise(r => setTimeout(r, 500));
        }

        await Promise.all(workers);

        await new Promise(r => setTimeout(r, job.interval));
    }
}

main();
