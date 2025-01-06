import puppeteer from "puppeteer";
import {
  baseUrl,
  email,
  password,
  isCI,
  RESERVATIONS_PREFERENCES,
} from "./config";
import { login } from "./services/auth";
import { goToReservations, processReservations } from "./services/reservation";
import { solveCaptchaFlow } from "./services/captcha";

async function main() {
  const browser = await puppeteer.launch({
    headless: isCI,
    slowMo: isCI ? 0 : 50,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    console.log("Creating new page...");
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );

    console.log("Starting captcha flow...");
    const loginUrl = `${baseUrl}/account/login.aspx`;
    await solveCaptchaFlow(page, loginUrl);

    console.log("Logging in...");
    await login(page, email, password);

    console.log("Navigating to reservations page...");
    await goToReservations(page);

    console.log("Processing reservations...");
    await processReservations(page, RESERVATIONS_PREFERENCES);
  } catch (error) {
    console.error(
      "Error in the script:",
      error instanceof Error ? error.message : error
    );
  } finally {
    await browser.close();
    console.log("Script finished");
  }
}

main();
