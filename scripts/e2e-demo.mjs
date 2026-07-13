/**
 * AgriFlow end-to-end demo via Playwright.
 *
 * Creates one account per role, then walks the full supply chain:
 * farmer lists produce â†’ buyer orders â†’ farmer confirms â†’ admin schedules â†’
 * transporter delivers â†’ warehouse receives stock. Fails loudly with a
 * screenshot on any broken step.
 *
 * Usage: node scripts/e2e-demo.mjs   (server must be running on :3000)
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const RUN = Date.now().toString(36);
const PASSWORD = "Demo1234!";
const ARTIFACTS = "scripts/artifacts";

const users = {
  farmer: { name: "Femi Farmer", email: `e2e-farmer-${RUN}@agriflow.test` },
  buyer: { name: "Bola Buyer", email: `e2e-buyer-${RUN}@agriflow.test` },
  transporter: {
    name: "Tunde Transporter",
    email: `e2e-transporter-${RUN}@agriflow.test`,
  },
  warehouse_manager: {
    name: "Wale Warehouse",
    email: `e2e-warehouse-${RUN}@agriflow.test`,
  },
  admin: { name: "Ada Admin", email: `e2e-admin-${RUN}@agriflow.test` },
};

const PRODUCT = `Maize-${RUN}`;

let page;
let stepNo = 0;
const results = [];

async function step(name, fn) {
  stepNo++;
  const label = `${String(stepNo).padStart(2, "0")} ${name}`;
  try {
    await fn();
    results.push(`PASS  ${label}`);
    console.log(`PASS  ${label}`);
  } catch (err) {
    results.push(`FAIL  ${label}: ${err.message}`);
    console.error(`FAIL  ${label}: ${err.message}`);
    try {
      await page.screenshot({
        path: `${ARTIFACTS}/fail-${stepNo}.png`,
        fullPage: true,
      });
      console.error(`      screenshot: ${ARTIFACTS}/fail-${stepNo}.png`);
    } catch {}
    throw err;
  }
}

async function signup(role) {
  const u = users[role];
  await page.goto(`${BASE}/signup`);
  await page.fill('input[placeholder="Ada Obi"]', u.name);
  await page.selectOption("select", role);
  await page.fill('input[type="email"]', u.email);
  await page.fill('input[name="password"]', PASSWORD);
  await page.fill('input[name="confirm"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard/**", { timeout: 45000 });
}

async function signout() {
  await page.click('button[aria-label="Sign out"]');
  await page.waitForURL("**/login", { timeout: 45000 });
}

async function login(role) {
  const u = users[role];
  await page.goto(`${BASE}/login`);
  await page.fill("#email", u.email);
  await page.fill('input[name="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard/**", { timeout: 45000 });
}

async function main() {
  mkdirSync(ARTIFACTS, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  page = await ctx.newPage();

  // â”€â”€ Account creation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  await step("Sign up farmer (welcome splash + role routing)", async () => {
    await signup("farmer");
    if (!page.url().includes("/dashboard/farmer"))
      throw new Error(`landed on ${page.url()}`);
    await page.waitForSelector('div[role="status"]', { timeout: 15000 });
  });
  await step("Sign out farmer", signout);

  await step("Sign up buyer", async () => {
    await signup("buyer");
    if (!page.url().includes("/dashboard/buyer"))
      throw new Error(`landed on ${page.url()}`);
  });
  await step("Sign out buyer", signout);

  await step("Sign up transporter", async () => {
    await signup("transporter");
    if (!page.url().includes("/dashboard/transport"))
      throw new Error(`landed on ${page.url()}`);
  });
  await step("Sign out transporter", signout);

  await step("Sign up warehouse manager", async () => {
    await signup("warehouse_manager");
    if (!page.url().includes("/dashboard/warehouse"))
      throw new Error(`landed on ${page.url()}`);
  });
  await step("Sign out warehouse manager", signout);

  await step("Sign up admin", async () => {
    await signup("admin");
    if (!page.url().includes("/dashboard/admin"))
      throw new Error(`landed on ${page.url()}`);
  });
  await step("Sign out admin", signout);

  // â”€â”€ Farmer: crop + harvest â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  await step("Farmer signs in", () => login("farmer"));

  await step("Farmer adds a crop", async () => {
    await page.goto(`${BASE}/dashboard/farmer/crops`);
    await page.click("summary:has-text('Add a new crop')");
    await page.fill('input[name="name"]', PRODUCT);
    await page.fill('input[name="quantity_estimate"]', "500");
    await page.fill('input[name="planting_date"]', "2026-05-01");
    await page.fill('input[name="expected_harvest_date"]', "2026-07-20");
    await page.click("button:has-text('Save crop')");
    await page.waitForSelector(`td:has-text("${PRODUCT}")`, { timeout: 45000 });
  });

  await step("Farmer records a harvest (lists to marketplace)", async () => {
    await page.goto(`${BASE}/dashboard/farmer/harvests`);
    await page.click("summary:has-text('Record a harvest')");
    await page.selectOption('select[name="crop_id"]', { index: 0 });
    await page.fill('input[name="harvest_date"]', "2026-07-10");
    await page.fill('input[name="quantity"]', "300");
    await page.fill('input[name="price_per_unit"]', "1000");
    await page.click("button:has-text('List harvest')");
    await page.waitForSelector(`td:has-text("${PRODUCT}")`, { timeout: 45000 });
  });

  await step("Farmer calendar renders", async () => {
    await page.goto(`${BASE}/dashboard/farmer/calendar`);
    await page.waitForSelector("text=Recorded harvest", { timeout: 30000 });
  });
  await step("Farmer signs out", signout);

  // â”€â”€ Buyer: order â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  await step("Buyer signs in", () => login("buyer"));

  await step("Buyer orders from the marketplace", async () => {
    await page.goto(`${BASE}/dashboard/buyer/browse`);
    const card = page
      .locator("div.rounded-xl", { hasText: PRODUCT })
      .first();
    await card.locator("summary").click();
    await card.locator('input[name="quantity"]').fill("50");
    await card.locator('input[name="delivery_address"]').fill("12 Demo Street, Ikeja");
    await card.locator("button:has-text('Place order')").click();
    await page.waitForTimeout(2500);
  });

  await step("Buyer sees the pending order", async () => {
    await page.goto(`${BASE}/dashboard/buyer/orders`);
    await page.waitForSelector(`td:has-text("${PRODUCT}")`, { timeout: 45000 });
    await page.waitForSelector("span:has-text('pending')", { timeout: 45000 });
  });
  await step("Buyer signs out", signout);

  // â”€â”€ Farmer confirms â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  await step("Farmer confirms the order (notification received)", async () => {
    await login("farmer");
    await page.goto(`${BASE}/dashboard/farmer/orders`);
    await page.click("button:has-text('Confirm')");
    await page.waitForSelector("span:has-text('confirmed')", { timeout: 45000 });
  });
  await step("Farmer signs out again", signout);

  // â”€â”€ Admin schedules â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  await step("Admin runs the scheduling engine", async () => {
    await login("admin");
    await page.goto(`${BASE}/dashboard/admin/scheduling`);
    await page.click("button:has-text('Run scheduler')");
    await page.waitForSelector(`td:has-text("${PRODUCT}")`, { timeout: 45000 });
  });

  await step("Admin sees users and reports", async () => {
    await page.goto(`${BASE}/dashboard/admin/users`);
    await page.waitForSelector(`td:has-text("${users.farmer.name}")`, { timeout: 45000 });
    await page.goto(`${BASE}/dashboard/reports`);
    await page.waitForSelector("text=Reports & Analytics", { timeout: 45000 });
  });
  await step("Admin signs out", signout);

  // â”€â”€ Transporter delivers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  await step("Transporter advances delivery to delivered", async () => {
    await login("transporter");
    await page.goto(`${BASE}/dashboard/transport/deliveries`);
    await page.click("button:has-text('Mark picked up')");
    await page.waitForSelector("button:has-text('Start transit')", { timeout: 45000 });
    await page.click("button:has-text('Start transit')");
    await page.waitForSelector("button:has-text('Mark delivered')", { timeout: 45000 });
    await page.click("button:has-text('Mark delivered')");
    await page.waitForSelector("text=Completed", { timeout: 45000 });
  });

  await step("Transporter route map page renders", async () => {
    await page.goto(`${BASE}/dashboard/transport/routes`);
    await page.waitForSelector("text=Route Map", { timeout: 30000 });
  });
  await step("Transporter signs out", signout);

  // â”€â”€ Buyer sees delivery + forecasting â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  await step("Buyer got the delivered notification", async () => {
    await login("buyer");
    await page.goto(`${BASE}/dashboard/notifications`);
    await page.waitForSelector("text=Order delivered", { timeout: 45000 });
  });

  await step("Forecasting page shows demand for the product", async () => {
    await page.goto(`${BASE}/dashboard/forecasting`);
    await page.waitForSelector(`text=${PRODUCT}`, { timeout: 45000 });
  });
  await step("Buyer signs out", signout);

  // â”€â”€ Warehouse manager â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  await step("Warehouse manager receives stock", async () => {
    await login("warehouse_manager");
    await page.goto(`${BASE}/dashboard/warehouse/inventory`);
    await page.click("summary:has-text('Receive stock')");
    await page.fill('input[name="product_name"]', `Tomatoes-${RUN}`);
    await page.fill('input[name="quantity"]', "100");
    await page.click("button:has-text('Add to inventory')");
    await page.waitForSelector(`td:has-text("Tomatoes-${RUN}")`, { timeout: 45000 });
  });

  await step("Stock movement was logged", async () => {
    await page.goto(`${BASE}/dashboard/warehouse/movements`);
    await page.waitForSelector(`td:has-text("Tomatoes-${RUN}")`, { timeout: 45000 });
  });

  await step("Profile page saves changes", async () => {
    await page.goto(`${BASE}/dashboard/profile`);
    await page.fill('input[name="phone"]', "+2348000000000");
    await page.click("button:has-text('Save changes')");
    await page.waitForTimeout(2000);
    await page.reload();
    const val = await page.inputValue('input[name="phone"]');
    if (val !== "+2348000000000") throw new Error("phone not persisted");
  });

  await browser.close();
  console.log("\n=== ALL STEPS PASSED ===");
}

main().catch(async (err) => {
  console.error("\n=== E2E FAILED ===");
  console.error(results.join("\n"));
  process.exit(1);
});

