const request = require("supertest");
const app = require("../app");
const pool = require("../db");

beforeEach(async () => {
  await pool.query("TRUNCATE order_items, orders RESTART IDENTITY");

  await pool.query(`
    UPDATE products
    SET stock = CASE id
      WHEN 1 THEN 25
      WHEN 2 THEN 100
      WHEN 3 THEN 50
      WHEN 4 THEN 75
      ELSE stock
    END
  `);
});

describe("GET /", () => {
  test("returns ShopFlow application information", async () => {
    const response = await request(app).get("/");

    expect(response.statusCode).toBe(200);

    expect(response.body).toEqual({
      application: "ShopFlow API v2",
      service: "backend",
      status: "running",
    });
  });
});

describe("GET /health", () => {
  test("returns healthy status when database is connected", async () => {
    const response = await request(app).get("/health");

    expect(response.statusCode).toBe(200);

    expect(response.body).toEqual({
      status: "healthy",
      database: "connected",
    });
  });
});

describe("POST /orders", () => {
  test("creates an order successfully", async () => {
    const response = await request(app)
      .post("/orders")
      .send({
        items: [
          {
            productId: 2,
            quantity: 1,
          },
        ],
      });

    expect(response.statusCode).toBe(201);

    expect(response.body.message).toBe("Order created successfully");

    expect(response.body.order).toHaveProperty("id");
    expect(response.body.order.status).toBe("pending");
    expect(Number(response.body.order.total)).toBe(39.99);
  });

  test("rejects an order with no items", async () => {
    const response = await request(app)
      .post("/orders")
      .send({
        items: [],
      });

    expect(response.statusCode).toBe(400);

    expect(response.body).toEqual({
      error: "Order must contain at least one item",
    });
  });
});

describe("GET /orders", () => {
  test("returns a list of orders", async () => {
    await request(app)
      .post("/orders")
      .send({
        items: [
          {
            productId: 2,
            quantity: 1,
          },
        ],
      });

    const response = await request(app).get("/orders");

    expect(response.statusCode).toBe(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);

    expect(response.body[0]).toHaveProperty("id");
    expect(response.body[0]).toHaveProperty("status");
    expect(response.body[0]).toHaveProperty("total");
    expect(response.body[0]).toHaveProperty("items");
  });
});

afterAll(async () => {
  await pool.end();
});
