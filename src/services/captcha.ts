import { Page, ConsoleMessage } from "puppeteer";
import { Solver } from "@2captcha/captcha-solver";
import { readFileSync } from "fs";
import { join } from "path";

const solver = new Solver(process.env.TWO_CAPTCHA_API_KEY ?? "");

export async function solveCaptchaFlow(page: Page, url: string): Promise<void> {
  // First inject the interceptor script
  const preloadFile = readFileSync(
    join(process.cwd(), "src/scripts/captcha-interceptor.js"),
    "utf8"
  );
  await page.evaluateOnNewDocument(preloadFile);

  // Navigate to the page where captcha appears
  await page.goto(url);

  // Wait for the captcha to be solved
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Captcha solution timeout after 60 seconds"));
    }, 60000);

    const handleConsole = async (msg: ConsoleMessage) => {
      const txt = msg.text();
      if (txt.includes("intercepted-params:")) {
        try {
          const params = JSON.parse(txt.replace("intercepted-params:", ""));
          console.log("Captcha params intercepted:", params);

          console.log("Solving the captcha...");
          const res = await solver.cloudflareTurnstile(params);
          console.log(`Solved the captcha ${res.id}`);

          await page.evaluate((token: string) => {
            // @ts-ignore - cfCallback is injected by our script
            window.cfCallback(token);
          }, res.data);

          // Wait for the callback to complete and page to stabilize
          await page.waitForNetworkIdle();

          clearTimeout(timeout);
          page.off("console", handleConsole);
          resolve();
        } catch (e) {
          clearTimeout(timeout);
          page.off("console", handleConsole);
          reject(e);
        }
      }
    };

    page.on("console", handleConsole);
  });
}
