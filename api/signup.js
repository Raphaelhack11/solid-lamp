import bcrypt from "bcrypt";
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const existing = await client.execute({
      sql: "SELECT * FROM users WHERE email = ?",
      args: [email],
    });

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await client.execute({
      sql: "INSERT INTO users (email, password, verified, balance) VALUES (?, ?, ?, ?)",
      args: [email, hashedPassword, 0, 0],
    });

    return res.status(201).json({ message: "Signup successful, please verify email" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
