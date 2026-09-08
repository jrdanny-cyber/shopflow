const pool = require("../db");

async function createOrder(req, res) {
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      error: "Order must contain at least one item",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let total = 0;
    const orderItems = [];

    for (const item of items) {
      const { productId, quantity } = item;

      if (!Number.isInteger(productId) || !Number.isInteger(quantity)) {
        throw new Error("Invalid product ID or quantity");
      }

      if (quantity <= 0) {
        throw new Error("Quantity must be greater than zero");
      }

      const result = await client.query(
        "SELECT id, name, price, stock FROM products WHERE id = $1 FOR UPDATE",
        [productId]
      );

      if (result.rows.length === 0) {
        throw new Error(`Product ${productId} not found`);
      }

      const product = result.rows[0];

      if (product.stock < quantity) {
        throw new Error(`Not enough stock for ${product.name}`);
      }

      const price = Number(product.price);

      total += price * quantity;

      orderItems.push({
        productId,
        quantity,
        price,
      });
    }

    const orderResult = await client.query(
      `INSERT INTO orders (status, total)
       VALUES ($1, $2)
       RETURNING id, status, total, created_at`,
      ["pending", total]
    );

    const order = orderResult.rows[0];

    for (const item of orderItems) {
      await client.query(
        `INSERT INTO order_items
         (order_id, product_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [order.id, item.productId, item.quantity, item.price]
      );

      await client.query(
        `UPDATE products
         SET stock = stock - $1
         WHERE id = $2`,
        [item.quantity, item.productId]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(error);

    res.status(400).json({
      error: error.message,
    });
  } finally {
    client.release();
  }
}
async function getOrders(req, res) {
  try {
    const result = await pool.query(
      `SELECT
         o.id,
         o.status,
         o.total,
         o.created_at,
         COALESCE(
           json_agg(
             json_build_object(
               'productId', oi.product_id,
               'quantity', oi.quantity,
               'price', oi.price
             )
           ) FILTER (WHERE oi.id IS NOT NULL),
           '[]'
         ) AS items
       FROM orders o
       LEFT JOIN order_items oi
         ON o.id = oi.order_id
       GROUP BY o.id
       ORDER BY o.id DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Unable to retrieve orders",
    });
  }
}

module.exports = {
  createOrder,
  getOrders,	
};
