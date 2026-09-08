const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "postgres",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "shopflow",
  user: process.env.DB_USER || "shopflow",
  password: process.env.DB_PASSWORD || "shopflow_password",
});

module.exports = pool;
