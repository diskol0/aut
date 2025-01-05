import { launch } from "puppeteer";
import { Solver } from "@2captcha/captcha-solver";
import { readFileSync } from "fs";
import { normalizeUserAgent } from "./normalize-ua.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const solver = new Solver(process.env.TWO_CAPTCHA_API_KEY);

console.log("key", process.env.TWO_CAPTCHA_API_KEY ? "✓ Present" : "✗ Missing");

const example = async () => {
  // If you are using `headless: true` mode, you need to fix userAgent. NormalizeUserAgent is used for this purpose.
  const initialUserAgent = await normalizeUserAgent();

  const browser = await launch({
    headless: true,
    slowMo: 0,
    args: [
      `--user-agent=${initialUserAgent}`,
      "--no-sandbox",
      "--disable-setuid-sandbox",
    ],
  });

  const page = await browser.newPage();

  const preloadFile = readFileSync("./inject.js", "utf8");
  await page.evaluateOnNewDocument(preloadFile);

  // Here we intercept the console messages to catch the message logged by inject.js script
  page.on("console", async (msg) => {
    const txt = msg.text();
    if (txt.includes("intercepted-params:")) {
      const params = JSON.parse(txt.replace("intercepted-params:", ""));
      console.log(params);

      try {
        console.log(`Solving the captcha...`);
        const res = await solver.cloudflareTurnstile(params);
        console.log(`Solved the captcha ${res.id}`);
        console.log(res);
        await page.evaluate((token) => {
          cfCallback(token);
        }, res.data);
      } catch (e) {
        console.log(e.err);
        return process.exit();
      }
    } else {
      return;
    }
  });

  await page.goto("https://wodbuster.com/account/login.aspx");
};

example();
