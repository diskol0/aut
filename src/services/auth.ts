import { Page } from "puppeteer";

export async function login(
  page: Page,
  baseUrl: string,
  email: string,
  password: string
): Promise<void> {
  await page.screenshot({
    path: "debug-before-login.png",
    fullPage: true,
  });

  await page.goto(`${baseUrl}/account/login.aspx`);

  await page.screenshot({
    path: "debug-after-login.png",
    fullPage: true,
  });

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
