async function testOtpRouteLive() {
  try {
    const res = await fetch('http://localhost:3001/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'farhatsarwar.155@gmail.com' })
    });
    const data = await res.json();
    console.log("Send OTP Result:", data);
  } catch (err) {
    console.error("Test error:", err);
  }
}

testOtpRouteLive();
