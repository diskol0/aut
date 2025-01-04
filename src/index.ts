import puppeteer, { Page } from "puppeteer";
import { baseUrl, email, password, isCI } from "./config";
import { login, goToReservations } from "./services/auth";
import {
  makeReservation,
  goToNextDay,
  getWeekDayFromUrl,
} from "./services/reservation";
import { ReservationPreferences, WeekDay } from "./types";

const RESERVATIONS_PREFERENCES: ReservationPreferences = {
  monday: "17:00",
  tuesday: null,
  wednesday: "17:00",
  thursday: "19:30",
  friday: null,
  saturday: null,
  sunday: null,
};

const AVAILABLE_DAYS = 7;

async function processReservations(
  page: Page,
  preferences: ReservationPreferences
): Promise<void> {
  for (let i = 0; i < AVAILABLE_DAYS; i++) {
    const weekDay = await getWeekDayFromUrl(page);
    const time = preferences[weekDay as WeekDay];

    const result = await makeReservation(page, time);
    console.log(result.message);

    const isLastDay = i === AVAILABLE_DAYS - 1;
    if (!isLastDay) await goToNextDay(page);
  }
}

async function main() {
  const browser = await puppeteer.launch({
    headless: isCI,
    slowMo: isCI ? 0 : 50,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-web-security",
      "--disable-features=IsolateOrigins,site-per-process",
      "--window-size=1920,1080",
    ],
  });

  const page = await browser.newPage();

  try {
    await page.setViewport({ width: 1280, height: 720 });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );

    console.log("Navigating to login page...");
    await login(page, baseUrl, email, password);

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
