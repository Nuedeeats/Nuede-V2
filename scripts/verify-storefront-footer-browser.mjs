// Storefront-only browser checks; backend requests are mocked and no messages are sent.
/* global document, window, getComputedStyle */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium, expect } from "@playwright/test";
import { createServer, loadEnv } from "vite";
import { getContactContent } from "../apps/storefront/src/features/content/config/storefrontContent.js";

const appRoot = path.resolve("apps/storefront");
const output = path.resolve("coverage/storefront-footer");
const contactKeys = ["VITE_CONTACT_PHONE", "VITE_CONTACT_WHATSAPP", "VITE_CONTACT_EMAIL", "VITE_CONTACT_INSTAGRAM", "VITE_CONTACT_HOURS"];
const configured = loadEnv("development", appRoot, "VITE_CONTACT_");
const empty = Object.fromEntries(contactKeys.map((key) => [key, ""]));
const scenarios = [
  { name: "configured", env: configured },
  { name: "all-icons", env: { ...empty, VITE_CONTACT_PHONE: "23408000000000", VITE_CONTACT_WHATSAPP: "23408000000000", VITE_CONTACT_EMAIL: "footer@example.com", VITE_CONTACT_INSTAGRAM: "https://www.instagram.com/footer_test/" } },
  { name: "missing", env: empty },
  { name: "invalid", env: { ...empty, VITE_CONTACT_PHONE: "23408116291761", VITE_CONTACT_WHATSAPP: "invalid", VITE_CONTACT_EMAIL: "invalid", VITE_CONTACT_INSTAGRAM: "https://evil.example/nuede", VITE_CONTACT_HOURS: "Configured hours" } },
  { name: "email-only", env: { ...empty, VITE_CONTACT_PHONE: "23408116291761", VITE_CONTACT_EMAIL: "footer@example.com" } },
];
const originals = { ...process.env };
let server;
let browser;

/** Verifies footer destinations, icon semantics, tap sizes, alignment and keyboard focus at a viewport width. */
async function checkFooter(page, expected, width, scenario) {
  await page.setViewportSize({ width, height: 900 });
  const footer = page.locator("footer");
  const heading = footer.getByRole("heading", { name: "Get in touch", exact: true });
  const block = heading.locator("..");
  const row = footer.getByRole("list", { name: "Contact links", exact: true });
  await heading.waitFor();
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await heading.evaluate((element) => getComputedStyle(element).textTransform), "uppercase");
  assert.equal(await row.count(), expected.length ? 1 : 0, "empty contact row is omitted");
  assert.equal(await block.getByRole("link").count(), expected.length);
  assert.equal(await footer.locator('a[href^="tel:"], a[href="/contact"], a[href="/#feedback"]').count(), 0);
  const hours = scenario.env.VITE_CONTACT_HOURS?.trim();
  assert.deepEqual((await block.innerText()).split("\n").map((line) => line.trim()).filter(Boolean), ["GET IN TOUCH", ...(hours ? [`Business hours: ${hours}`] : [])]);
  for (const [index, link] of expected.entries()) {
    const anchor = row.getByRole("link", { name: link.ariaLabel, exact: true });
    assert.equal(await anchor.getAttribute("href"), link.href);
    assert.equal(await anchor.getAttribute("title"), link.ariaLabel);
    assert.equal(await anchor.getAttribute("target"), link.external ? "_blank" : null);
    assert.equal(await anchor.getAttribute("rel"), link.external ? "noopener noreferrer" : null);
    assert.equal(await anchor.innerText(), "", "icons have no visible text labels");
    assert.equal(await anchor.locator('svg[aria-hidden="true"]').count(), 1);
    const bounds = await anchor.boundingBox();
    assert.ok(bounds.width >= 44 && bounds.height >= 44, "44px minimum tap target");
    const iconBounds = await anchor.locator("svg").boundingBox();
    assert.ok(iconBounds.width >= 20 && iconBounds.width <= 24);
    if (index) {
      const previous = await row.getByRole("link").nth(index - 1).boundingBox();
      assert.equal(bounds.y, previous.y, "icons occupy a single horizontal row");
      assert.ok(bounds.x - (previous.x + previous.width) >= 8, "comfortable spacing");
    } else {
      assert.equal(await anchor.evaluate((element) => element.getBoundingClientRect().x === element.closest("ul").previousElementSibling.getBoundingClientRect().x), true, "left aligned with heading");
      await anchor.focus();
      await page.keyboard.press("Shift+Tab");
      await page.keyboard.press("Tab");
    }
    assert.equal(await anchor.evaluate((element) => document.activeElement === element), true, "Tab reaches icon in order");
    await expect(anchor).toHaveCSS("outline-width", "2px");
    const focus = await anchor.evaluate((element) => ({ visible: element.matches(":focus-visible"), width: getComputedStyle(element).outlineWidth, color: getComputedStyle(element).outlineColor, brand: getComputedStyle(element).color }));
    assert.equal(focus.visible, true);
    assert.equal(focus.width, "2px");
    assert.equal(focus.color, focus.brand, "focus uses brand green");
    if (index < expected.length - 1) await page.keyboard.press("Tab");
  }
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  if (scenario.name === "configured") await footer.screenshot({ path: path.join(output, `footer-${width}.png`) });
}

try {
  await mkdir(output, { recursive: true });
  browser = await chromium.launch({ headless: true, channel: process.env.NUEDE_BROWSER_CHANNEL || "msedge" });
  for (const scenario of scenarios) {
    Object.assign(process.env, scenario.env, { VITE_SUPABASE_URL: "http://127.0.0.1:54321", VITE_SUPABASE_ANON_KEY: "footer-browser-public-fixture" });
    server = await createServer({ root: appRoot, server: { host: "127.0.0.1", port: 5173, strictPort: true }, logLevel: "error" });
    await server.listen();
    const context = await browser.newContext({ reducedMotion: "reduce" });
    await context.route("http://127.0.0.1:54321/**", (route) => route.fulfill({ contentType: "application/json", body: "[]", headers: { "access-control-allow-origin": "*" } }));
    await context.routeWebSocket("**/realtime/**", (socket) => socket.close());
    const page = await context.newPage();
    const exceptions = [];
    page.on("pageerror", (error) => exceptions.push(error.message));
    await page.goto("http://127.0.0.1:5173");
    const expected = getContactContent(scenario.env).links.filter((link) => link.kind !== "phone");
    if (scenario.name === "all-icons") assert.deepEqual(expected.map((link) => link.href), ["https://wa.me/2348000000000", "mailto:footer@example.com", "https://www.instagram.com/footer_test/"]);
    for (const width of [320, 1440]) await checkFooter(page, expected, width, scenario);
    if (scenario.name === "configured") {
      await page.setViewportSize({ width: 320, height: 900 });
      await page.getByRole("button", { name: "Open navigation menu", exact: true }).click();
      await page.getByRole("navigation", { name: "Mobile navigation", exact: true }).getByRole("link", { name: "Contact", exact: true }).click();
      await page.getByRole("heading", { name: "How can we help?", exact: true }).waitFor();
      if (configured.VITE_CONTACT_PHONE) assert.equal(await page.getByRole("main").getByRole("link", { name: configured.VITE_CONTACT_PHONE, exact: true }).count(), 1, "Contact page retains phone display");
      await page.getByRole("link", { name: "Send feedback or an enquiry", exact: true }).click();
      await page.locator("#feedback").waitFor();
      assert.equal(await page.getByRole("button", { name: "Send feedback", exact: true }).count(), 1);
    }
    assert.deepEqual(exceptions, [], "no browser runtime errors");
    assert.equal(await page.locator("vite-error-overlay").count(), 0);
    console.log(`PASS ${scenario.name}: correct links, accessible icons, 320/1440px layout, keyboard focus, omitted invalid destinations`);
    await context.close();
    await server.close();
    server = undefined;
  }
  console.log("PASS mobile navigation → Contact → homepage feedback; screenshots in coverage/storefront-footer");
} finally {
  await browser?.close();
  await server?.close();
  for (const key of [...contactKeys, "VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"]) {
    if (originals[key] === undefined) delete process.env[key];
    else process.env[key] = originals[key];
  }
}
