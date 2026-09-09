const express = require("express");
const pool = require("./db");
const productsRouter = require("./routes/products");
const ordersRouter = require("./routes/orders");

const app = express();
const {
  httpRequestsTotal,
  httpRequestDuration,
  register,
} = require("./metrics");

app.use((req, res, next) => {
  const start = process.hrtime();

  res.on("finish", () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const durationSeconds = seconds + nanoseconds / 1e9;

    const route = req.baseUrl + (req.route?.path || "").replace(/\/$/, "") || "/";

    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });

    httpRequestDuration.observe(
      {
        method: req.method,
        route,
        status_code: res.statusCode,
      },
      durationSeconds,
    );

    const durationMs = Math.round(durationSeconds * 1000);

    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms`,
    );
  });

  next();
});

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    application: "ShopFlow API v2",
    service: "backend",
    status: "running",
  });
});

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      status: "healthy",
      database: "connected",
    });
  } catch {
    res.status(503).json({
      status: "unhealthy",
      database: "disconnected",
    });
  }
});

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

app.use("/products", productsRouter);

app.use("/orders", ordersRouter);

module.exports = app;
