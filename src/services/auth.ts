import { Page } from 'puppeteer';

export async function goToLoginPage(
  page: Page,
  baseUrl: string
): Promise<void> {
  await page.goto(`${baseUrl}/account/login.aspx`);
}

export async function login(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.type('#body_body_CtlLogin_IoEmail', email);
  await page.type('#body_body_CtlLogin_IoPassword', password);
  await page.click('#body_body_CtlLogin_CtlAceptar');

  await page.waitForNavigation();

  // click in "Don't remember this browser"
  await page.click('#body_body_CtlConfiar_CtlNoSeguro');

  await page.waitForNetworkIdle();
}
