import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
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
    const result = await client.execute({
      sql: "SELECT * FROM users WHERE email = ?",
      args: [email],
    });

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    if (user.verified === 0) {
      return res.status(401).json({ error: "Please verify your email first" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({ message: "Login successful", token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
