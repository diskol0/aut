import { Page } from "puppeteer";
import { Solver } from "@2captcha/captcha-solver";
import { twoCaptchaApiKey } from "../config";

const twoCaptchaSolver = new Solver(twoCaptchaApiKey);

export async function login(
  page: Page,
  baseUrl: string,
  email: string,
  password: string
): Promise<void> {
  await page.goto(`${baseUrl}/account/login.aspx`);

  // Extract sitekey from the page
  const sitekey = await page.evaluate(() => {
    const turnstileElement = document.querySelector(".cf-turnstile");
    return turnstileElement?.getAttribute("data-sitekey") || "";
  });

  if (sitekey) {
    console.log("Found sitekey:", sitekey);

    const res = await twoCaptchaSolver.cloudflareTurnstile({
      pageurl: `${baseUrl}/account/login.aspx`,
      sitekey: sitekey, // Use the extracted sitekey
    });
    console.log("Captcha solved", res);
  }

  await page.type("#body_body_CtlLogin_IoEmail", email);
  await page.type("#body_body_CtlLogin_IoPassword", password);
  await page.click("#body_body_CtlLogin_CtlAceptar");

  await page.waitForNavigation();

  // Don't remember this browser
  await page.click("#body_body_CtlConfiar_CtlNoSeguro");

  await page.waitForNetworkIdle();
}

export async function goToReservations(page: Page): Promise<void> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todayInSeconds = Math.floor(today.getTime() / 1000);

  const currentUrl = page.url();
  const currentDomain = new URL(currentUrl).origin;

  await page.goto(`${currentDomain}/athlete/reservas.aspx?t=${todayInSeconds}`);
}
