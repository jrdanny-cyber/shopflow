const express = require("express");
const pool = require("./db");
const productsRouter = require("./routes/products");
const ordersRouter = require("./routes/orders");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    application: "ShopFlow",
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
