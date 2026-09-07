import puppeteer from 'puppeteer';

(async () => {
  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    
    await page.goto('http://localhost:3000/pece', { waitUntil: 'networkidle0', timeout: 15000 });
    
    const text = await page.evaluate(() => document.body.innerText);
    console.log("BODY TEXT:");
    console.log(text);
    
    await browser.close();
  } catch (err) {
    console.error("Script error:", err);
  }
})();
