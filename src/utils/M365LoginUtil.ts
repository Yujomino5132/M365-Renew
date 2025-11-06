import puppeteer from '@cloudflare/puppeteer';
import { SleepUtil } from './SleepUtil';

class M365LoginUtil {
  protected static M365_LOGIN_URL: string = 'https://www.microsoft.com/cascadeauth/store/account/signin';

  protected static M365_LOGIN_URL_NORMALIZED: string = new URL(this.M365_LOGIN_URL).toString();

  public static async login(browser: Fetcher, email: string, password: string, totpKey: string): Promise<boolean> {
    const browserInstance = await puppeteer.launch(browser);
    const page = await browserInstance.newPage();
    await page.goto(M365LoginUtil.M365_LOGIN_URL);
    await page.keyboard.type(email, { delay: 50 });
    await page.keyboard.press('Enter');
    await SleepUtil.sleep(1);
    await page.keyboard.type(password, { delay: 50 });
    await page.keyboard.press('Enter');
    await SleepUtil.sleep(1);
    const totpUrl = `https://totp-generator.2ba35e4d622c4747d091cb066978b585.workers.dev/generate-totp?key=${totpKey}&digits=6&period=30&algorithm=SHA-1`;
    const response = await fetch(totpUrl);
    if (!response.ok) {
      throw new Error('failed to get totp');
    }
    const data = await response.json();
    const otp = data.otp;
    await page.keyboard.type(otp, { delay: 50 });
    await page.keyboard.press('Enter');
    await SleepUtil.sleep(3);
    await page.click('[data-testid="secondaryButton"]');
    await SleepUtil.sleep(5);
    await browserInstance.close();
    return true;
  }
}

export { M365LoginUtil };
