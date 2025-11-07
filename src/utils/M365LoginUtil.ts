import puppeteer, {Browser, ElementHandle, Page} from '@cloudflare/puppeteer';
import { SleepUtil } from './SleepUtil';

class M365LoginUtil {
  protected static M365_LOGIN_URL: string = 'https://www.microsoft.com/cascadeauth/store/account/signin';

  protected static M365_LOGIN_URL_NORMALIZED: string = new URL(this.M365_LOGIN_URL).toString();

  public static async login(browser: Fetcher, totpGenerator: Fetcher, email: string, password: string, totpKey: string): Promise<boolean> {
    const browserInstance:Browser = await puppeteer.launch(browser);
    const page:Page = await browserInstance.newPage();

    try {
      // Step 1: Navigate to login page
      await page.goto(this.M365_LOGIN_URL_NORMALIZED, { waitUntil: 'networkidle2' });

      // Step 2: Enter email
      await page.type('input[type="email"]', email, { delay: 50 });
      await page.keyboard.press('Enter');
      await SleepUtil.sleep(1);

      // Step 3: Enter password
      await page.type('input[type="password"]', password, { delay: 50 });
      await page.keyboard.press('Enter');
      await SleepUtil.sleep(1);

      // Step 4: Generate and enter TOTP
      const totpUrl = `https://totp-generator.internal/generate-totp?key=${totpKey}&digits=6&period=30&algorithm=SHA-1`;
      const response:Response = await totpGenerator.fetch(totpUrl);

      if (!response.ok) {
        throw new Error('Failed to get TOTP');
      }

      const data:unknown = await response.json();
      const otp:string = data.otp;

      await page.type('input[name="otc"]', otp, { delay: 50 });
      await page.keyboard.press('Enter');
      await SleepUtil.sleep(3);

      // Step 5: Handle post-login confirmation (e.g., "Stay signed in?")
      const staySignedInSelector:string  = '[data-testid="secondaryButton"]';
      if (await page.$(staySignedInSelector)) {
        await page.click(staySignedInSelector);
      }

      await SleepUtil.sleep(5);

      // Step 6: Verify login success
      // You can check for:
      // - A redirect URL (e.g., Microsoft 365 home page)
      // - Specific elements visible only after login
      // - The absence of an error message
      const currentUrl:string = page.url();

      console.log('Current Url: ', currentUrl);
      // Example success indicators
      const loginSuccess:boolean = currentUrl.includes('https://www.microsoft.com/');

      // Example error indicators
      const loginError: ElementHandle | null = await page.$('div.error, div[role="alert"]');

      await browserInstance.close();
      return loginSuccess && !loginError;
    } catch (error) {
      console.error('Login process failed:', error);
      await browserInstance.close();
      return false;
    }
  }
}

export { M365LoginUtil };
