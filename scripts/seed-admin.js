const { Client } = require("pg");
const bcrypt = require("bcryptjs");

async function main() {
  const username = "admin1";
  const email = "admin1@qq.com";
  const password = "123456";
  const hashedPassword = await bcrypt.hash(password, 10);

  let connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    const fs = require("fs");
    const path = require("path");
    const envPath = path.join(__dirname, "..", ".env");
    if (fs.existsSync(envPath)) {
      const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
      for (const line of lines) {
        const match = line.match(/^\s*DATABASE_URL\s*=\s*(.+)\s*$/);
        if (match) {
          connectionString = match[1].replace(/^["']|["']$/g, "");
          break;
        }
      }
    }
  }
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    const existing = await client.query(
      `SELECT "id" FROM "User" WHERE "username" = $1 OR "email" = $2 LIMIT 1`,
      [username, email]
    );

    if (existing.rows.length) {
      await client.query(
        `UPDATE "User"
         SET "username" = $1,
             "email" = $2,
             "password" = $3,
             "role" = 'admin',
             "isBanned" = false,
             "updatedAt" = NOW()
         WHERE "id" = $4`,
        [username, email, hashedPassword, existing.rows[0].id]
      );
      console.log("管理员账号已更新");
      return;
    }

    await client.query(
      `INSERT INTO "User" ("username", "email", "password", "role", "isBanned", "updatedAt")
       VALUES ($1, $2, $3, 'admin', false, NOW())`,
      [username, email, hashedPassword]
    );
    console.log("管理员账号已创建");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("创建管理员失败：", error);
  process.exit(1);
});
