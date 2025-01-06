import { Page } from "puppeteer";

interface AuthError extends Error {
  originalError?: unknown;
}

function createAuthError(message: string, originalError?: unknown): AuthError {
  const error = new Error(message) as AuthError;
  error.name = "AuthenticationError";
  error.originalError = originalError;
  return error;
}

const SELECTORS = {
  email: "#body_body_CtlLogin_IoEmail",
  password: "#body_body_CtlLogin_IoPassword",
  loginButton: "#body_body_CtlLogin_CtlAceptar",
  dontRememberButton: "#body_body_CtlConfiar_CtlNoSeguro",
} as const;

async function waitForElement(
  page: Page,
  selector: string,
  timeout = 5000
): Promise<void> {
  try {
    await page.waitForSelector(selector, { timeout });
  } catch (error) {
    throw createAuthError(`Element not found: ${selector}`, error);
  }
}

export async function goToLoginPage(
  page: Page,
  baseUrl: string
): Promise<void> {
  await page.goto(`${baseUrl}/account/login.aspx`);
}

export async function login(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  try {
    // Wait for form elements
    await waitForElement(page, SELECTORS.email);
    await waitForElement(page, SELECTORS.password);
    await waitForElement(page, SELECTORS.loginButton);

    // Fill form
    await page.type(SELECTORS.email, email);
    await page.type(SELECTORS.password, password);
    await page.click(SELECTORS.loginButton);

    // Wait for navigation
    await page.waitForNavigation();

    // Handle "Don't remember this browser" option
    await waitForElement(page, SELECTORS.dontRememberButton);
    await page.click(SELECTORS.dontRememberButton);

    // Wait for everything to settle
    await page.waitForNetworkIdle();
  } catch (error) {
    throw createAuthError("Failed to complete login process", error);
  }
}
