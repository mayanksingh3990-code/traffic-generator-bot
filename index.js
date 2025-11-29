require("./server.js");
require("./bot.js");

const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  // Launch Puppeteer for headless browsing on Render/Glitch
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Open your local index.html from the 'public' folder
  const filePath = path.join(__dirname, 'public', 'index.html');
  await page.goto(`file://${filePath}`);

  // Your bot logic goes here
})();
