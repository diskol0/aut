import { Page } from "puppeteer";

export async function login(
  page: Page,
  baseUrl: string,
  email: string,
  password: string
): Promise<void> {
  await page.goto(`${baseUrl}/account/login.aspx`);

  // Wait specifically for the login form elements
  await page.waitForSelector("#body_body_CtlLogin_IoEmail", { timeout: 10000 });
  await page.waitForSelector("#body_body_CtlLogin_IoPassword", {
    timeout: 10000,
  });

  await page.type("#body_body_CtlLogin_IoEmail", email);
  await page.type("#body_body_CtlLogin_IoPassword", password);
  await page.click("#body_body_CtlLogin_CtlAceptar");

  await page.waitForNavigation();

  // Don't remember this browser
  await page.waitForSelector("#body_body_CtlConfiar_CtlNoSeguro", {
    timeout: 10000,
  });
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
