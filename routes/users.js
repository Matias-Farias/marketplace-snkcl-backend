import express from 'express';
import { query } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get user purchases
router.get('/purchases', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        p.*,
        pr.name as product_name,
        pr.price as product_price
      FROM purchases p
      JOIN products pr ON p.product_id = pr.id
      WHERE p.user_id = $1
      ORDER BY p.created_at DESC
    `, [req.user.id]);
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create purchase
router.post('/purchase', authenticateToken, async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    
    const { items } = req.body;
    const purchases = [];

    for (const item of items) {
      const result = await client.query(
        'INSERT INTO purchases (user_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *',
        [req.user.id, item.id, item.quantity || 1]
      );
      purchases.push(result.rows[0]);
    }

    await client.query('COMMIT');
    res.status(201).json(purchases);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// Get user sales
router.get('/sales', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        p.*,
        pr.name as product_name,
        pr.price as product_price,
        u.name as buyer_name
      FROM purchases p
      JOIN products pr ON p.product_id = pr.id
      JOIN users u ON p.user_id = u.id
      WHERE pr.user_id = $1
      ORDER BY p.created_at DESC
    `, [req.user.id]);
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle favorite
router.post('/favorites/:productId', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Check if favorite exists
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
    res.status(500).json({ error: error.message });
  }
});

// Get user favorites
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
    res.status(500).json({ error: error.message });
  }
});

export default router;