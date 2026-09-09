const express = require("express");
const pool = require("./db");
const productsRouter = require("./routes/products");
const ordersRouter = require("./routes/orders");

const app = express();

app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;

    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`,
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

app.use("/products", productsRouter);

app.use("/orders", ordersRouter);

module.exports = app;
