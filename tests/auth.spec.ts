import { expect, test, type Page } from "@playwright/test";

const password = "browser-test-password";

async function signup(page: Page, email: string) {
  await page.goto("/signup");
  await page.getByLabel("Нэр", { exact: true }).fill("Туршилтын хэрэглэгч");
  await page.getByLabel("И-мэйл", { exact: true }).fill(email);
  await page.getByLabel("Нууц үг", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Бүртгүүлэх", exact: true }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("button", { name: "Гарах", exact: true })).toBeVisible();
}

test("all application routes require login", async ({ page }) => {
  for (const route of ["/", "/plans", "/gantt", "/plans/new", "/plans/1", "/plans/1/edit", "/activities/new", "/activities/1/edit"]) {
    await page.goto(route);
    await expect(page).toHaveURL("/login");
    await expect(page.getByRole("heading", { name: "Нэвтрэх", exact: true })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Үндсэн цэс" })).toHaveCount(0);
  }
});

test("signup, private plans and activities, logout, and login work across two accounts", async ({ page }, testInfo) => {
  const unique = Date.now();
  const owner = `owner-${unique}@example.com`;
  const second = `other-${unique}@example.com`;
  const planTitle = `Хувийн төлөвлөгөө ${unique}`;
  const activityTitle = `Хувийн ажил ${unique}`;

  await signup(page, owner);
  for (const width of [360, 375]) {
    await page.setViewportSize({ width, height: 812 });
    await page.screenshot({ path: testInfo.outputPath(`authenticated-mobile-${width}.png`) });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 1280, height: 800 });
  for (const route of ["/login", "/signup"]) {
    await page.goto(route);
    await expect(page).toHaveURL("/");
  }
  await page.goto("/plans/new");
  await page.getByLabel("Нэр", { exact: true }).fill(planTitle);
  await page.getByRole("button", { name: "Төлөвлөгөө үүсгэх", exact: true }).click();
  await expect(page).toHaveURL(/\/plans\/\d+$/);
  const planURL = new URL(page.url()).pathname;
  const planId = planURL.split("/").at(-1)!;
  await page.goto(`/activities/new?plan=${planId}`);
  await page.getByLabel("Нэр", { exact: true }).fill(activityTitle);
  await page.getByLabel("Төлөвлөгөөнд эзлэх хувь", { exact: true }).fill("40");
  await page.getByLabel("Эхлэх огноо", { exact: true }).fill("2026-11-01");
  await page.getByLabel("Дуусах огноо", { exact: true }).fill("2026-11-10");
  await page.getByRole("button", { name: "Ажил нэмэх", exact: true }).click();
  await expect(page).toHaveURL(planURL);
  await expect(page.getByText(activityTitle, { exact: true }).first()).toBeVisible();
  const editLink = page.locator('a[href^="/activities/"][href$="/edit"]').first();
  const activityURL = await editLink.getAttribute("href");
  expect(activityURL).toBeTruthy();

  await page.getByRole("button", { name: "Гарах", exact: true }).click();
  await expect(page).toHaveURL("/login");
  await page.goBack();
  await expect(page).toHaveURL("/login");
  await expect(page.getByText(planTitle, { exact: true })).toHaveCount(0);

  await page.getByLabel("И-мэйл", { exact: true }).fill(owner);
  await page.getByLabel("Нууц үг", { exact: true }).fill("incorrect-password");
  await page.getByRole("button", { name: "Нэвтрэх", exact: true }).click();
  await expect(page.getByText("И-мэйл эсвэл нууц үг буруу байна.")).toBeVisible();
  await expect(page.getByLabel("И-мэйл", { exact: true })).toHaveValue(owner);
  await expect(page.getByLabel("Нууц үг", { exact: true })).toBeFocused();
  await page.getByLabel("Нууц үг", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Нэвтрэх", exact: true }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByText(activityTitle, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Гарах", exact: true }).click();
  await expect(page).toHaveURL("/login");

  await signup(page, second);
  for (const route of ["/", "/plans", "/gantt", "/activities/new"]) {
    await page.goto(route);
    await expect(page.getByText(planTitle, { exact: true })).toHaveCount(0);
    await expect(page.getByText(activityTitle, { exact: true })).toHaveCount(0);
  }
  for (const route of [planURL, `${planURL}/edit`, activityURL!]) {
    await page.goto(route);
    await expect(page.getByRole("heading", { name: "Олдсонгүй", exact: true })).toBeVisible();
    await expect(page.getByText(planTitle, { exact: true })).toHaveCount(0);
    await expect(page.getByText(activityTitle, { exact: true })).toHaveCount(0);
    expect(await page.title()).not.toContain(planTitle);
  }
});

test("auth screens support mobile, keyboard focus, and light/dark themes", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/login");
  await page.getByLabel("И-мэйл", { exact: true }).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Нууц үг", { exact: true })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole("button", { name: /^Өнгө:/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.screenshot({ path: testInfo.outputPath("login-mobile-light.png") });
  await page.getByRole("button", { name: /^Өнгө:/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.screenshot({ path: testInfo.outputPath("login-mobile-dark.png") });
  await page.getByRole("link", { name: "Бүртгүүлэх", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Бүртгүүлэх", exact: true })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.screenshot({ path: testInfo.outputPath("signup-desktop-dark.png") });
});
