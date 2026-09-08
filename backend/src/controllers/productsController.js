const pool = require("../db");

async function getProducts(req, res) {
  try {
    const result = await pool.query(
      "SELECT * FROM products ORDER BY id"
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Unable to retrieve products",
    });
  }
}

module.exports = {
  getProducts,
};
