#!/usr/bin/env node

const http = require("http");

function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const headers = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
      headers["Cookie"] = `token=${token}`; // Also set cookie just in case
    }

    const options = {
      hostname: "127.0.0.1",
      port: 3000,
      path,
      method,
      headers,
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, body: json });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log("🧪 Testing Sudogram API...\n");

  const timestamp = Date.now().toString().slice(-6);
  const testUsername = `user_${timestamp}`;
  const testEmail = `user_${timestamp}@example.com`;
  const testPassword = "password123";

  console.log(`   Generated credentials: ${testUsername} / ${testPassword}`);

  // Test 0: Register
  console.log("0️⃣ REGISTER TEST");
  const registerRes = await makeRequest("POST", "/api/register", {
    username: testUsername,
    email: testEmail,
    password: testPassword,
  });
  console.log(`   Status: ${registerRes.status}`);
  console.log(`   Response:`, registerRes.body);
  console.log();

  // Test 1: Login
  console.log("1️⃣ LOGIN TEST");
  const loginRes = await makeRequest("POST", "/api/login", {
    username: testUsername,
    password: testPassword,
  });
  console.log(`   Status: ${loginRes.status}`);
  console.log(`   Response:`, loginRes.body);

  const accessToken = loginRes.body.accessToken || loginRes.body.token;
  console.log(`   Token received: ${accessToken ? "YES" : "NO"}`);
  console.log();

  if (!accessToken) {
    console.error(
      "❌ Login failed or no token returned, skipping authenticated tests"
    );
    return;
  }

  // Test 2: Get Profile
  console.log("2️⃣ GET PROFILE TEST");
  const profileRes = await makeRequest(
    "GET",
    "/api/profile",
    null,
    accessToken
  );
  console.log(`   Status: ${profileRes.status}`);
  console.log(`   User: ${profileRes.body.username || "N/A"}`);
  console.log();

  // Test 3: Get Posts
  console.log("3️⃣ GET POSTS TEST");
  const postsRes = await makeRequest("GET", "/api/posts", null, accessToken);
  console.log(`   Status: ${postsRes.status}`);
  const posts = postsRes.body.posts || postsRes.body;
  console.log(
    `   Posts count: ${Array.isArray(posts) ? posts.length : "ERROR"}`
  );
  console.log();

  // Test 4: Get Notifications
  console.log("4️⃣ GET NOTIFICATIONS TEST");
  const notifRes = await makeRequest(
    "GET",
    "/api/notifications",
    null,
    accessToken
  );
  console.log(`   Status: ${notifRes.status}`);
  console.log(
    `   Has notifications: ${Array.isArray(notifRes.body) ? "YES" : "NO"}`
  );
  console.log();

  // Test 5: Get Messages
  console.log("5️⃣ GET MESSAGES TEST");
  const messagesRes = await makeRequest(
    "GET",
    "/api/messages",
    null,
    accessToken
  );
  console.log(`   Status: ${messagesRes.status}`);
  console.log(`   Response type:`, typeof messagesRes.body);
  console.log();

  // Test 6: Search
  console.log("6️⃣ SEARCH TEST");
  const searchRes = await makeRequest(
    "GET",
    `/api/search?q=${testUsername.substring(0, 5)}`,
    null,
    accessToken
  );
  console.log(`   Status: ${searchRes.status}`);
  console.log(
    `   Found users: ${
      Array.isArray(searchRes.body.results)
        ? searchRes.body.results.length
        : "ERROR"
    }`
  );
  console.log();

  console.log("✅ Tests complete!");
}

runTests().catch(console.error);
