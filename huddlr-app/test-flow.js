const puppeteer = require("puppeteer");

(async () => {
  console.log("[TEST] Starting Huddlr integration test...");
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    console.log("[TEST] Navigating to http://localhost:3000...");
    await page.goto("http://localhost:3000", { waitUntil: "networkidle2" });
    await page.screenshot({ path: "screenshot-1-landing.png" });

    console.log("[TEST] Navigating to register page...");
    await page.goto("http://localhost:3000/register", { waitUntil: "networkidle2" });
    
    const testEmail = `testuser-${Date.now()}@example.com`;
    console.log(`[TEST] Filling registration form for ${testEmail}...`);
    await page.type("#name", "Test User");
    await page.type("#email", testEmail);
    await page.type("#password", "password123");
    await page.screenshot({ path: "screenshot-2-register-filled.png" });

    console.log("[TEST] Submitting registration...");
    await Promise.all([
      page.click("button[type='submit']"),
      page.waitForNavigation({ waitUntil: "networkidle2" })
    ]);

    console.log("[TEST] Navigated to: " + page.url());
    await page.screenshot({ path: "screenshot-3-verify-otp-page.png" });

    console.log("[TEST] Fetching active OTP from API...");
    const response = await page.evaluate(async (email) => {
      const res = await fetch(`/api/mock/otp?email=${encodeURIComponent(email)}`);
      return await res.json();
    }, testEmail);
    
    const otp = response.otp;
    console.log("[TEST] Retrieved OTP: " + otp);

    if (!otp) {
      throw new Error("Failed to retrieve OTP from mock endpoint");
    }

    console.log("[TEST] Entering OTP...");
    await page.type("#otp", otp);
    await page.screenshot({ path: "screenshot-4-otp-filled.png" });

    console.log("[TEST] Submitting OTP...");
    await Promise.all([
      page.click("button[type='submit']"),
      page.waitForNavigation({ waitUntil: "networkidle2" })
    ]);

    console.log("[TEST] Navigated to: " + page.url());
    if (!page.url().includes("/dashboard")) {
      throw new Error("Failed to redirect to /dashboard after OTP verification");
    }
    await page.screenshot({ path: "screenshot-5-dashboard-overview.png" });

    // Wait for hydration
    console.log("[TEST] Waiting for hydration...");
    await new Promise(r => setTimeout(r, 3000));

    console.log("[TEST] Navigating to Team Chat...");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("aside button"));
      const chatBtn = buttons.find(b => b.textContent.includes("Team Chat"));
      if (chatBtn) chatBtn.click();
    });
    
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: "screenshot-6-chat-tab.png" });

    console.log("[TEST] Creating new team 'Beta Testers'...");
    await page.click("#create-team-btn");
    await new Promise(r => setTimeout(r, 500));
    
    await page.type("#teamName", "Beta Testers");
    await page.screenshot({ path: "screenshot-7-create-team-modal.png" });
    
    await page.click("#submit-create-team");
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: "screenshot-8-team-created.png" });

    console.log("[TEST] Inviting member...");
    await page.click("#invite-member-btn");
    await new Promise(r => setTimeout(r, 500));
    
    await page.type("#inviteEmail", "collaborator@example.com");
    await page.screenshot({ path: "screenshot-9-invite-modal.png" });
    
    await page.click("#submit-invite-member");
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: "screenshot-10-member-invited.png" });

    console.log("[TEST] Sending chat message...");
    await page.type("#chat-input", "Hello team, welcome to Huddlr!");
    await page.click("#send-message-btn");
    await new Promise(r => setTimeout(r, 1500));
    
    await page.screenshot({ path: "screenshot-11-message-sent.png" });
    console.log("[TEST] Flow test completed successfully!");

  } catch (error) {
    console.error("[TEST] Test failed with error: ", error);
    await page.screenshot({ path: "screenshot-error.png" });
  } finally {
    await browser.close();
  }
})();
