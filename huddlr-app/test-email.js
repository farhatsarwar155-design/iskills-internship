fetch("http://localhost:3000/api/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Dev Test", email: "testdev@example.com", password: "password123" })
}).then(res => res.json()).then(console.log).catch(console.error);
