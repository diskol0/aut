import { Page, ElementHandle } from "puppeteer";
import { ButtonText, ReservationResult } from "../types";

export async function getReservationState(
  reservationButton: ElementHandle<HTMLButtonElement>
): Promise<ButtonText | null> {
  const buttonText = await reservationButton.evaluate((el) => el.textContent);
  return buttonText as ButtonText | null;
}

export function getReservationKey(time: string): string {
  return `h${time.replace(":", "")}00`;
}

export async function goToNextDay(page: Page): Promise<void> {
  await page.waitForSelector("a.next");
  await page.click("a.next");
  await page.waitForNetworkIdle();
}

export async function getWeekDayFromUrl(page: Page): Promise<string> {
  const url = await page.url();
  const weekDayInSeconds = url.split("=")[1];
  const weekDay = new Date(Number(weekDayInSeconds) * 1000);
  return weekDay
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLocaleLowerCase();
}

export async function makeReservation(
  page: Page,
  time: string | null
): Promise<ReservationResult> {
  const weekDay = await getWeekDayFromUrl(page);
  const pageTitle = await page.$(".mainTitle");
  const pageTitleText =
    (await pageTitle?.evaluate((el) => el.textContent)) ?? "";

  if (!time) {
    return {
      success: false,
      message: `No time scheduled for ${weekDay}`,
      weekDay,
    };
  }

  const reservationKey = getReservationKey(time);
  const reservationButton = await page.$(
    `div[data-magellan-destination="${reservationKey}"] button`
  );

  if (!reservationButton) {
    return {
      success: false,
      message: `No reservation button found for ${pageTitleText}`,
      weekDay,
      time,
    };
  }

  const state = await getReservationState(reservationButton);

  if (!state) {
    return {
      success: false,
      message: `No reservation state found for ${pageTitleText}`,
      weekDay,
      time,
    };
  }

  const result: ReservationResult = {
    success: true,
    message: "",
    weekDay,
    time,
    state,
  };

  switch (state) {
    case "Entrenar":
      await reservationButton.click();
      await page.waitForNetworkIdle();
      result.message = `${pageTitleText} - Booked at ${time}`;
      break;
    case "Avisar":
      await reservationButton.click();
      await page.waitForNetworkIdle();
      result.message = `${pageTitleText} - In waiting list at ${time}`;
      break;
    case "Cambiar":
      result.message = `${pageTitleText} - Already booked at a different time`;
      result.success = false;
      break;
    case "Finalizada":
      result.message = `${pageTitleText} - Class already finished`;
      result.success = false;
      break;
    case "Borrar":
      result.message = `${pageTitleText} - Already booked at ${time}`;
      result.success = false;
      break;
  }

  return result;
}
