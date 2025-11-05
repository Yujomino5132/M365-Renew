import puppeteer from "@cloudflare/puppeteer";

interface Env {
  MYBROWSER: Fetcher;
}

export default {
  async fetch(request, env): Promise<Response> {
    let url = "https://www.microsoft.com/cascadeauth/store/account/signin"
    let img: Buffer;
      url = new URL(url).toString(); // normalize
        const browser = await puppeteer.launch(env.MYBROWSER);
        const page = await browser.newPage();
        await page.goto(url);
        await page.keyboard.type('username@outlook.com', { delay: 50 });
        await page.keyboard.press('Enter');
        await sleep(1000);
        await page.keyboard.type('password', { delay: 50 });
        await page.keyboard.press('Enter');
        await sleep(1000);
        const totpUrl = 'https://totp-generator.2ba35e4d622c4747d091cb066978b585.workers.dev/generate-totp?key=sometotpkey123&digits=6&period=30&algorithm=SHA-1';
        const response = await fetch(totpUrl);
           if (!response.ok) {
            throw new Error("failed to get totp")
      }
       const data = await response.json();
      const otp = data.otp;
        await page.keyboard.type(otp, { delay: 50 });
        await page.keyboard.press('Enter');
        await sleep(3000);
// await page.waitForSelector('[data-testid="secondaryButton"]', { visible: true });
await page.click('[data-testid="secondaryButton"]');
await sleep(5000)
        img = (await page.screenshot()) as Buffer;
        await browser.close();
      return new Response(img, {
        headers: {
          "content-type": "image/jpeg",
        },
      });
  },
} satisfies ExportedHandler<Env>;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
