import express from 'express';
import { query, getClient } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/purchases', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        p.id,
        p.quantity,
        p.size,
        p.created_at,
        pr.name AS product_name,
        pr.price AS product_price,
        pr.images
      FROM purchases p
      JOIN products pr ON p.product_id = pr.id
      WHERE p.user_id = $1
      ORDER BY p.created_at DESC
    `, [req.user.id]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error al obtener compras:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/purchase', authenticateToken, async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { items } = req.body;
    const purchases = [];

    for (const item of items) {
      const result = await client.query(
        'INSERT INTO purchases (user_id, product_id, quantity, size) VALUES ($1, $2, $3, $4) RETURNING *',
        [req.user.id, item.id, item.quantity || 1, item.selectedSize || '']
      );
      purchases.push(result.rows[0]);
    }

    await client.query('COMMIT');
    res.status(201).json(purchases);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error al registrar compra:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

router.get('/sales', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        p.id,
        p.quantity,
        p.size,
        p.created_at,
        pr.name AS product_name,
        pr.price AS product_price,
        pr.images,
        u.name AS buyer_name
      FROM purchases p
      JOIN products pr ON p.product_id = pr.id
      JOIN users u ON p.user_id = u.id
      WHERE pr.user_id = $1
      ORDER BY p.created_at DESC
    `, [req.user.id]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error al obtener ventas:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/favorites/:productId', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;

    const existing = await query(
      'SELECT * FROM favorites WHERE user_id = $1 AND product_id = $2',
      [req.user.id, productId]
    );

    if (existing.rows.length > 0) {
      await query(
        'DELETE FROM favorites WHERE user_id = $1 AND product_id = $2',
        [req.user.id, productId]
      );
      res.json({ message: 'Favorite removed' });
    } else {
      await query(
        'INSERT INTO favorites (user_id, product_id) VALUES ($1, $2)',
        [req.user.id, productId]
      );
      res.json({ message: 'Favorite added' });
    }
  } catch (error) {
    console.error('❌ Error en favoritos:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/favorites', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT p.*
      FROM favorites f
      JOIN products p ON f.product_id = p.id
      WHERE f.user_id = $1
      ORDER BY f.created_at DESC
    `, [req.user.id]);

    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error al obtener favoritos:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;