import { Page } from "puppeteer";
import { Solver } from "@2captcha/captcha-solver";
import { turnstileSitekey, twoCaptchaApiKey } from "../config";
import { paramsTurnstile } from "@2captcha/captcha-solver/dist/structs/2captcha";

const twoCaptchaSolver = new Solver(twoCaptchaApiKey);

export async function login(
  page: Page,
  baseUrl: string,
  email: string,
  password: string
): Promise<void> {
  await page.goto(`${baseUrl}/account/login.aspx`);

  await extractTurnstileParams(page);

  const res = await resolveCloudflareTurnstile(`${baseUrl}/account/login.aspx`);
  console.log("Captcha solved", res);

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

async function resolveCloudflareTurnstile(url: string) {
  try {
    const params: paramsTurnstile = {
      sitekey: "0x4AAAAAAADnPIDROrmt1Wwj",
      pageurl: url,
      data: "8fd6b62eafd7e9e3",
      action: "managed",
      pagedata:
        "yVvhLGQDGQEAFvBU01Q4Mcp1TmOLrYUlyoCPFSLZ7js-1736114117-1.3.1.1-AsduSjoJpZ9tT6DQlRjuTNtj22mNZ0H3aSwqduVTFqqS.Y3Oglyyp01GWo7EXgUVO8ZFM5OsuRLb_Wtum6S4VRQ6NYi6CCI6keDtsZvl5U3tklWDA1E2aM7Aybryu0m.pbyfQn3c_uTJHO7vh3eBZJDxIlRmdlGwJFCL6nn28Bl_pAEL6tCzYVA_ILVxX604XnPzyPf1Lx0tX7QeLPPbJOGberuT7J.zt5mwVPFwGjiUVjEoD5G.00ltl2i5cB.K5J9WtzWNMkXwJ11HLW1UT5v5LOJQEpXWKwBixKJMwZFeQIu7LYGUdOUQxQh898Pb14_R3p371G8dAbKqYVwaXKrgQgATy804vieJjderBw3umBYUS5K2oUWwyCAgzKdj3jPLfdNDNTcbWTl6ugIwa_LuujADZy0BYxkGkiw2AcI",
    };

    console.log("Solving Cloudflare Turnstile", params);
    const res = await twoCaptchaSolver.cloudflareTurnstile(params);
    return res;
  } catch (error) {
    console.error("Error solving Cloudflare Turnstile", error);
    throw error;
  }
}

async function extractTurnstileParams(page: Page) {
  const html = await page.content();
  // Look for the window._cf_chl_opt object in the HTML
  const cfOptMatch = html.match(/window\._cf_chl_opt=({[^;]+})/);

  if (!cfOptMatch) {
    throw new Error("Could not find Turnstile configuration in HTML");
  }

  try {
    // Clean up the string and parse it as JSON
    const cfOptString = cfOptMatch[1]
      .replace(/'/g, '"') // Replace single quotes with double quotes
      .replace(/([a-zA-Z0-9_]+):/g, '"$1":') // Add quotes around property names
      .replace(/,(\s*[}\]])/g, "$1"); // Remove trailing commas

    const cfOpt = JSON.parse(cfOptString);

    console.log("Turnstile params", cfOpt);

    return cfOpt;
  } catch (error) {
    console.error("Error parsing Turnstile configuration:", error);
    throw error;
  }
}
