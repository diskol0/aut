import { ReservationPreferences } from "./types";

export const baseUrl = process.env.BASE_URL ?? "";
export const email = process.env.EMAIL ?? "";
export const password = process.env.PASSWORD ?? "";
export const twoCaptchaApiKey = process.env.TWO_CAPTCHA_API_KEY ?? "";
export const isCI = true;

export const RESERVATIONS_PREFERENCES: ReservationPreferences = {
  monday: "17:00",
  tuesday: null,
  wednesday: "17:00",
  thursday: "19:30",
  friday: null,
  saturday: null,
  sunday: null,
};

export const AVAILABLE_DAYS = 7;
