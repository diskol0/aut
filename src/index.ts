import puppeteer, { Browser, Page } from "puppeteer";
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

interface BrowserConfig {
  headless: boolean;
  slowMo: number;
  defaultViewport: {
    width: number;
    height: number;
  };
  args: string[];
}

const DEFAULT_CONFIG: BrowserConfig = {
  headless: isCI,
  slowMo: isCI ? 0 : 50,
  defaultViewport: {
    width: 1280,
    height: 720,
  },
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
};

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";

async function setupBrowser(
  config: BrowserConfig = DEFAULT_CONFIG
): Promise<{ browser: Browser; page: Page }> {
  try {
    console.log("Launching browser...");
    const browser = await puppeteer.launch(config);

    console.log("Creating new page...");
    const page = await browser.newPage();
    await page.setUserAgent(DEFAULT_USER_AGENT);

    return { browser, page };
  } catch (error) {
    throw new Error(
      "Failed to setup browser: " +
        (error instanceof Error ? error.message : String(error))
    );
  }
}

async function cleanup(browser: Browser | null): Promise<void> {
  if (browser) {
    try {
      await browser.close();
    } catch (error) {
      console.error("Error closing browser:", error);
    }
  }
}

async function runWorkflow(page: Page): Promise<void> {
  console.log("Starting captcha flow...");
  const loginUrl = `${baseUrl}/account/login.aspx`;
  await solveCaptchaFlow(page, loginUrl);

  console.log("Logging in...");
  await login(page, email, password);

  console.log("Navigating to reservations page...");
  await goToReservations(page);

  console.log("Processing reservations...");
  await processReservations(page, RESERVATIONS_PREFERENCES);

  console.log("All tasks completed successfully!");
}

async function main() {
  let browser: Browser | null = null;

  try {
    const { browser: newBrowser, page } = await setupBrowser();
    browser = newBrowser;

    await runWorkflow(page);
  } catch (error) {
    console.error(
      "Error running AutoWod:",
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  } finally {
    await cleanup(browser);
  }
}

main();
