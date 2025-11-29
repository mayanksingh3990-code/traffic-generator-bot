require("./server.js");
require("./bot.js");

const chromium = require('chromium');
const puppeteer = require('puppeteer-core');

(async () => {
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
  await page.goto("https://google.com");

  console.log("Puppeteer running!");
})();
