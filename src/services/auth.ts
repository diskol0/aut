import { Page } from "puppeteer";

export async function login(
  page: Page,
  baseUrl: string,
  email: string,
  password: string
): Promise<void> {
  await page.goto(`${baseUrl}/account/login.aspx`);

  await page.type("#body_body_CtlLogin_IoEmail", email);
  await page.type("#body_body_CtlLogin_IoPassword", password);
  await page.click("#body_body_CtlLogin_CtlAceptar");

  await page.waitForNavigation();

  // Don't remember this browser
  await page.click("#body_body_CtlConfiar_CtlNoSeguro");

  await page.waitForResponse((response) => response.status() === 200);
}

export async function goToReservations(page: Page): Promise<void> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todayInSeconds = Math.floor(today.getTime() / 1000);

  const currentDomain = await page.evaluate(() => {
    const url = new URL(window.location.href);
    return url.origin;
  });

  await page.goto(`${currentDomain}/athlete/reservas.aspx?t=${todayInSeconds}`);
}
