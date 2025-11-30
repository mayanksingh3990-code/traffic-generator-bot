const axios = require('axios');

const C_AND_C_SERVER_URL = 'https://traffic-generator-bot.onrender.com'; // remove trailing slash

// Store proxies (still disabled)
let proxies = [];

async function fetchProxies() {
    console.log('[*] Proxies disabled - using direct connection');
    return [];
}

async function getJob() {
    try {
        const res = await axios.get(`${C_AND_C_SERVER_URL}/api/job`);
        return res.data;
    } catch (err) {
        console.log('[-] Cannot reach C&C:', err.message);
        return { sleep: 30000 };
    }
}

// "Fake" browser visit using axios headers
async function executeJob(job) {
    if (proxies.length === 0) proxies = await fetchProxies();
    let proxy = proxies.length > 0 ? proxies[Math.floor(Math.random() * proxies.length)] : null;

    try {
        console.log(`[+] Visiting ${job.targetUrl}${proxy ? " with proxy " + proxy : ""}`);

        await axios.get(job.targetUrl, {
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.8'
            },
            proxy: proxy
                ? {
                    host: proxy.split(':')[0],
                    port: parseInt(proxy.split(':')[1])
                }
                : false
        });

        console.log(`[✓] Successfully pinged ${job.targetUrl}`);

        // Report visit to server
        try {
            await axios.post(`${C_AND_C_SERVER_URL}/api/report-visit`, {
                url: job.targetUrl,
                timestamp: Date.now()
            });
            console.log(`[✓] Visit reported`);
        } catch (err) {
            console.log('[-] Failed to report visit:', err.message);
        }

        const stayDuration = job.duration || 15000;
        console.log(`[*] Staying on page for ${stayDuration}ms…`);
        await new Promise(res => setTimeout(res, stayDuration));

    } catch (err) {
        console.log(`[✗] Bot error:`, err.message);
    }
}

async function main() {
    while (true) {
        const job = await getJob();

        if (job.sleep) {
            await new Promise(res => setTimeout(res, job.sleep));
            continue;
        }

        const concurrency = job.concurrency || 5;
        const bots = [];

        console.log(`[*] Launching ${concurrency} parallel bots…`);

        for (let i = 0; i < concurrency; i++) {
            bots.push(executeJob(job));
            await new Promise(res => setTimeout(res, 400));
        }

        await Promise.all(bots);

        const interval = job.interval || 30000;
        console.log(`[*] Waiting ${interval}ms before next batch…`);
        await new Promise(res => setTimeout(res, interval));
    }
}

main();
