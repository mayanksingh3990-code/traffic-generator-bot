require("./server.js");
require("./bot.js");

const chromium = require('chromium');
const puppeteer = require('puppeteer-core');

(async () => {
  try {
    console.log("[*] Starting Puppeteer...");

    const browser = await puppeteer.launch({
      executablePath: chromium.path,
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

    console.log("[*] Browser launched!");

    const page = await browser.newPage();

    console.log("[*] Opening C&C dashboard...");
    await page.goto("https://traffic-generator-bot.onrender.com/", {
      waitUntil: "networkidle0",
      timeout: 60000
    });

    console.log("[+] Puppeteer is running and C&C dashboard opened!");

  } catch (err) {
    console.error("Puppeteer failed:", err);
  }
})();
