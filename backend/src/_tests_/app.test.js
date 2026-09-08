const request = require("supertest");
const app = require("../app");
const pool = require("../db");

describe("GET /", () => {
  test("returns ShopFlow application information", async () => {
    const response = await request(app).get("/");

    expect(response.statusCode).toBe(200);

    expect(response.body).toEqual({
      application: "ShopFlow",
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

afterAll(async () => {
  await pool.end();
});
