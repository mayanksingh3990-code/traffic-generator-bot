const puppeteer = require('puppeteer');
const axios = require('axios');
const C_AND_C_SERVER_URL = 'http://127.0.0.1:3000'; // <-- IMPORTANT: CHANGE THIS

// Store proxies in memory
let proxies = [];

// Temporarily disabled proxy fetching - free proxies are unreliable
async function fetchProxies() {
    console.log('[*] Proxies disabled - using direct connection');
    return []; // Return empty array to use direct connection
}

async function getJob() {
    try {
        const response = await axios.get(`${C_AND_C_SERVER_URL}/api/job`);
        return response.data;
    } catch (error) {
        console.error('[-] Could not connect to C&C server:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
        } else if (error.request) {
            console.error('No response received:', error.request);
        } else {
            console.error('Error setting up request:', error.message);
        }
        return { sleep: 30000 };
    }
}

async function executeJob(job) {
    // Refresh proxies if empty
    if (proxies.length === 0) {
        proxies = await fetchProxies();
    }

    let proxy = null;
    let useProxy = proxies.length > 0;

    if (useProxy) {
        proxy = proxies[Math.floor(Math.random() * proxies.length)];
    }

    let browser;
    try {
        const launchOptions = {
            headless: true,
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
                '--window-size=1920,1080'
            ],
            defaultViewport: null
        };

        if (proxy) {
            launchOptions.args.push(`--proxy-server=${proxy}`);
        }

        browser = await puppeteer.launch(launchOptions);

        const page = await browser.newPage();
        
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
        });

        if (job.region) {
            await page.setGeolocation({ latitude: 51.507351, longitude: -0.127758 }); 
        }

        const proxyInfo = proxy ? ` with proxy ${proxy}` : ' (direct connection)';
        console.log(`[+] Visiting ${job.targetUrl}${proxyInfo}...`);
        
        await page.goto(job.targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        console.log(`[✓] Successfully loaded ${job.targetUrl}`);

        // Report successful visit
        try {
            await axios.post(`${C_AND_C_SERVER_URL}/api/report-visit`, { url: job.targetUrl });
            console.log(`[✓] Visit reported to server`);
        } catch (e) {
            console.error('[-] Failed to report visit:', e.message);
        }

        // Simulate human-like behavior
        await page.evaluate(() => {
            window.scrollBy(0, Math.random() * 500);
        });
        
        // Random Click (Once)
        const viewport = await page.viewport();
        if (viewport) {
            const x = Math.floor(Math.random() * viewport.width);
            const y = Math.floor(Math.random() * viewport.height);
            await page.mouse.move(x, y, { steps: 10 });
            await page.mouse.click(x, y);
            console.log(`[*] Clicked at ${x}, ${y}`);
        }

        // Stay on page for the specified duration
        const stayDuration = job.duration || 30000;
        console.log(`[*] Staying on page for ${stayDuration}ms...`);
        await new Promise(resolve => setTimeout(resolve, stayDuration));
        console.log(`[✓] Visit completed successfully`);

    } catch (err) {
        console.error(`[✗] Error: ${err.message}`);
        
        // If proxy failed and we haven't tried without proxy yet, retry without proxy
        if (proxy && err.message.includes('timeout')) {
            console.log(`[*] Proxy failed, retrying without proxy...`);
            try {
                if (browser) await browser.close();
            } catch (e) {}
            
            // Retry without proxy
            return executeJobWithoutProxy(job);
        }
    } finally {
        if (browser) {
            try {
                await browser.close();
            } catch (e) {}
        }
    }
}

async function executeJobWithoutProxy(job) {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
                '--window-size=1920,1080'
            ],
            defaultViewport: null
        });

        const page = await browser.newPage();
        
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        console.log(`[+] Visiting ${job.targetUrl} (direct - no proxy)...`);
        await page.goto(job.targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        console.log(`[✓] Successfully loaded ${job.targetUrl}`);

        // Report successful visit
        try {
            await axios.post(`${C_AND_C_SERVER_URL}/api/report-visit`, { url: job.targetUrl });
            console.log(`[✓] Visit reported to server`);
        } catch (e) {
            console.error('[-] Failed to report visit:', e.message);
        }

        // Simulate behavior
        await page.evaluate(() => {
            window.scrollBy(0, Math.random() * 500);
        });
        
        const viewport = await page.viewport();
        if (viewport) {
            const x = Math.floor(Math.random() * viewport.width);
            const y = Math.floor(Math.random() * viewport.height);
            await page.mouse.move(x, y, { steps: 10 });
            await page.mouse.click(x, y);
        }

        const stayDuration = job.duration || 30000;
        await new Promise(resolve => setTimeout(resolve, stayDuration));
        console.log(`[✓] Visit completed successfully (no proxy)`);

    } catch (err) {
        console.error(`[✗] Error even without proxy: ${err.message}`);
    } finally {
        if (browser) {
            try {
                await browser.close();
            } catch (e) {}
        }
    }
}

async function main() {
    while (true) {
        const job = await getJob();
        if (job.sleep) {
            await new Promise(resolve => setTimeout(resolve, job.sleep));
            continue;
        }

        // Concurrency Control
        const concurrency = job.concurrency || 5;
        const promises = [];

        console.log(`[*] Starting batch of ${concurrency} bots...`);

        for (let i = 0; i < concurrency; i++) {
            promises.push(executeJob(job));
            // Stagger starts slightly
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        await Promise.all(promises);
        
        // Wait for interval before next batch
        await new Promise(resolve => setTimeout(resolve, job.interval));
    }
}

main(); 
