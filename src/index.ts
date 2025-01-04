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
    args: isCI ? ["--no-sandbox", "--disable-setuid-sandbox"] : [],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1024 });

  try {
    await login(page, baseUrl, email, password);
    await goToReservations(page);
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
