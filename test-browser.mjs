import puppeteer from 'puppeteer';

(async () => {
  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText));

    console.log("Navigating...");
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2', timeout: 15000 });
    console.log("Navigation complete.");
    
    const preloaderHtml = await page.evaluate(() => {
        const el = document.getElementById('app-preloader');
        return el ? el.outerHTML : 'null';
    });
    console.log("Preloader HTML:", preloaderHtml);
    
    await browser.close();
  } catch (err) {
    console.error("Script error:", err);
  }
})();
