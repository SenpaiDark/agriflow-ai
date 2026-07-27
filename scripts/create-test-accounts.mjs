import { chromium } from "playwright";

const BASE = "http://localhost:3000";

const ACCOUNTS = [
  { fullName: "Test Farmer", email: "test.farmer@agriflow.demo", password: "Test@1234", role: "farmer", phone: "08012345671", location: "Ibadan, Oyo" },
  { fullName: "Test Buyer", email: "test.buyer@agriflow.demo", password: "Test@1234", role: "buyer", phone: "08012345672", location: "Lagos" },
  { fullName: "Test Transporter", email: "test.transporter@agriflow.demo", password: "Test@1234", role: "transporter", phone: "08012345673", location: "Abuja" },
  { fullName: "Test Warehouse", email: "test.warehouse@agriflow.demo", password: "Test@1234", role: "warehouse_manager", phone: "08012345674", location: "Ikeja, Lagos" },
];

async function createAccount(browser, acc) {
  const page = await browser.newPage();
  try {
    console.log(`Creating ${acc.role}: ${acc.email}...`);
    await page.goto(`${BASE}/signup`, { waitUntil: "networkidle" });
    await page.fill("#fullName", acc.fullName);
    await page.selectOption("#role", acc.role);
    await page.fill("#email", acc.email);
    await page.fill("#password", acc.password);
    await page.fill("#confirm", acc.password);
    await page.fill("#phone", acc.phone);
    await page.fill("#location", acc.location);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    const url = page.url();
    const hasConfirmation = await page.getByText("Check your inbox").isVisible().catch(() => false);
    if (hasConfirmation) {
      console.log(`  -> EMAIL CONFIRMATION REQUIRED (screen shown)`);
    } else if (url.includes("/dashboard")) {
      console.log(`  -> SUCCESS (email confirmation OFF)`);
    } else {
      console.log(`  -> URL: ${url}`);
      const errorText = await page.getByRole("alert").textContent().catch(() => "none");
      console.log(`  -> Error: ${errorText}`);
    }
  } catch (err) {
    console.error(`  -> Error: ${err.message}`);
  } finally {
    await page.close();
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  for (const acc of ACCOUNTS) {
    await createAccount(browser, acc);
  }
  await browser.close();
}

main().catch(console.error);
