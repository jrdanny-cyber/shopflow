const fs = require("fs");
const { Pool } = require("pg");

const secretPath = "/run/secrets/shopflow_db_password";

const password = fs.existsSync(secretPath)
  ? fs.readFileSync(secretPath, "utf8").trim()
  : process.env.DB_PASSWORD || "shopflow_password";

const pool = new Pool({
  host: process.env.DB_HOST || "postgres",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "shopflow",
  user: process.env.DB_USER || "shopflow",
  password,
});

module.exports = pool;
