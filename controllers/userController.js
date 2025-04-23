import pool from "../config/db.js";

export async function toggleFavorite(req, res) {
  const userId = req.user.id;
  const productId = parseInt(req.params.productId);

  const existing = await pool.query(
    "SELECT * FROM favorites WHERE user_id = $1 AND product_id = $2",
    [userId, productId]
  );

  if (existing.rows.length > 0) {
    await pool.query(
      "DELETE FROM favorites WHERE user_id = $1 AND product_id = $2",
      [userId, productId]
    );
    return res.json({ message: "Eliminado de favoritos" });
  } else {
    await pool.query(
      "INSERT INTO favorites (user_id, product_id) VALUES ($1, $2)",
      [userId, productId]
    );
    return res.json({ message: "Agregado a favoritos" });
  }
}

export async function getFavorites(req, res) {
  const userId = req.user.id;
  const result = await pool.query(
    `
    SELECT p.* FROM products p
    JOIN favorites f ON f.product_id = p.id
    WHERE f.user_id = $1
  `,
    [userId]
  );
  res.json(result.rows);
}

export async function purchaseItems(req, res) {
  const userId = req.user.id;
  const items = req.body.items;
  for (const item of items) {
    await pool.query(
      "INSERT INTO purchases (user_id, product_id, quantity, size) VALUES ($1, $2, $3, $4)",
      [userId, item.productId, item.quantity, item.size]
    );
  }
  res.status(201).json({ message: "Compra registrada" });
}

export async function getPurchases(req, res) {
  const userId = req.user.id;
  const result = await pool.query(
    `
    SELECT p.*, pu.quantity, pu.size, pu.created_at
    FROM products p
    JOIN purchases pu ON p.id = pu.product_id
    WHERE pu.user_id = $1
    ORDER BY pu.created_at DESC
  `,
    [userId]
  );
  res.json(result.rows);
}

export async function getUserSales(req, res) {
  const userId = req.user.id;
  try {
    const result = await pool.query(
      `SELECT 
        p.*, 
        pu.quantity, 
        pu.size, 
        pu.created_at, 
        u.name AS buyer_name 
      FROM purchases pu
      JOIN products p ON p.id = pu.product_id
      JOIN users u ON u.id = pu.user_id
      WHERE p.user_id = $1
      ORDER BY pu.created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error en getUserSales:", error);
    res.status(500).json({ error: error.message });
  }
}