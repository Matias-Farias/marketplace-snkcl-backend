import express from 'express';
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/productController.js';
import { authenticateToken } from '../middleware/auth.js';
import { query } from '../config/db.js';

const router = express.Router();

router.get('/', getAllProducts);
router.post('/', authenticateToken, createProduct);
router.put('/:id', authenticateToken, updateProduct);
router.delete('/:id', authenticateToken, deleteProduct);

router.get('/mine', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM products WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error al obtener productos del usuario:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;