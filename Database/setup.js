const { Client } = require("pg");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

async function setupDatabase() {
  const client = new Client({
    host: "localhost",
    user: "Eric",        // PostgreSQL user
    password: "1234",    // password
    database: "ideavault",
  });

  await client.connect();

  // Run the SQL script to create tables
  const sqlPath = path.join(__dirname, "setup.sql");
  const sql = fs.readFileSync(sqlPath, "utf-8");
  await client.query(sql);

  // Insert test user
  const hashedPassword = bcrypt.hashSync("HUU", 10);

  try {
    await client.query(
      "INSERT INTO users (username, password_hash) VALUES ($1, $2) ON CONFLICT (username) DO NOTHING",
      ["Eric", hashedPassword]
    );
    console.log("Test user created successfully.");
  } catch (err) {
    console.error("Error inserting test user:", err);
  }

  await client.end();
}

setupDatabase().then(() => console.log("Database setup complete."));
