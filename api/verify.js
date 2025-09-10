import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: "Missing email" });
    }

    await client.execute({
      sql: "UPDATE users SET verified = 1 WHERE email = ?",
      args: [email],
    });

    return res.json({ message: "Email verified successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
