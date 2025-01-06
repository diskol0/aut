import { Page, ConsoleMessage } from "puppeteer";
import { Solver } from "@2captcha/captcha-solver";
import { readFileSync } from "fs";
import { join } from "path";

interface CaptchaParams {
  sitekey: string;
  pageurl: string;
  data: string;
  pagedata: string;
  action: string;
  userAgent: string;
  json: number;
}

interface CaptchaError extends Error {
  originalError?: unknown;
}

function createCaptchaError(
  message: string,
  originalError?: unknown
): CaptchaError {
  const error = new Error(message) as CaptchaError;
  error.name = "CaptchaSolutionError";
  error.originalError = originalError;
  return error;
}

async function injectInterceptor(page: Page): Promise<void> {
  try {
    const preloadFile = readFileSync(
      join(process.cwd(), "src/scripts/captcha-interceptor.js"),
      "utf8"
    );
    await page.evaluateOnNewDocument(preloadFile);
  } catch (error) {
    throw createCaptchaError("Failed to inject captcha interceptor", error);
  }
}

async function handleCaptchaParams(
  solver: Solver,
  page: Page,
  params: CaptchaParams
): Promise<void> {
  try {
    console.log("Solving the captcha...");
    const res = await solver.cloudflareTurnstile(params);
    console.log(`Solved the captcha ${res.id}`);

    await page.evaluate((token: string) => {
      // @ts-ignore - cfCallback is injected by our script
      window.cfCallback(token);
    }, res.data);

    // Wait for the callback to complete and page to stabilize
    await page.waitForNetworkIdle();
  } catch (error) {
    throw createCaptchaError(
      "Failed to solve captcha or apply solution",
      error
    );
  }
}

async function waitForCaptchaSolution(
  solver: Solver,
  page: Page,
  timeoutMs: number = 60000
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(
        createCaptchaError(`Captcha solution timeout after ${timeoutMs}ms`)
      );
    }, timeoutMs);

    const handleConsole = async (msg: ConsoleMessage) => {
      const txt = msg.text();
      if (txt.includes("intercepted-params:")) {
        try {
          const params = JSON.parse(
            txt.replace("intercepted-params:", "")
          ) as CaptchaParams;
          console.log("Captcha params intercepted:", params);

          await handleCaptchaParams(solver, page, params);

          clearTimeout(timeout);
          page.off("console", handleConsole);
          resolve();
        } catch (error) {
          clearTimeout(timeout);
          page.off("console", handleConsole);
          reject(
            createCaptchaError("Failed during captcha solution process", error)
          );
        }
      }
    };

    page.on("console", handleConsole);
  });
}

export async function solveCaptchaFlow(page: Page, url: string): Promise<void> {
  const solver = new Solver(process.env.TWO_CAPTCHA_API_KEY ?? "");

  await injectInterceptor(page);

  try {
    await page.goto(url);
  } catch (error) {
    throw createCaptchaError("Failed to navigate to page", error);
  }

  await waitForCaptchaSolution(solver, page);
}
