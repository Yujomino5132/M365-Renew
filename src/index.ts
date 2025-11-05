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
