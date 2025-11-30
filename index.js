// -------------------------------------------------------------
// 1. START THE C&C SERVER FIRST
// -------------------------------------------------------------
require("./server.js");

// -------------------------------------------------------------
// 2. WAIT A MOMENT, THEN START THE BOT
// -------------------------------------------------------------
setTimeout(() => {
  console.log("[*] Starting bot.js after server initialization...");
  require("./bot.js");
}, 3000);

// -------------------------------------------------------------
// 3. OPTIONAL: OPEN THE DASHBOARD IN PUPPETEER (RENDER SAFE)
// -------------------------------------------------------------
const puppeteer = require("puppeteer");

async function launchDashboardViewer() {
  try {
    console.log("[*] Starting Puppeteer (Dashboard Viewer)...");

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-zygote",
        "--single-process"
      ]
    });

    const page = await browser.newPage();

    console.log("[*] Opening C&C dashboard...");
    await page.goto("https://traffic-generator-bot.onrender.com", {
      waitUntil: "networkidle2",
      timeout: 60000
    });

    console.log("[+] Dashboard opened successfully in Puppeteer!");

    // ❗ Keep browser open only if needed
    // await browser.close();

  } catch (err) {
    console.error("[!] Puppeteer failed to open dashboard:", err.message);
  }
}

// Start puppeteer viewer ONLY in development mode
if (process.env.NODE_ENV !== "production") {
  setTimeout(launchDashboardViewer, 5000);
}
