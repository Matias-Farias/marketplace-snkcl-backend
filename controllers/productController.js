import { query } from '../config/db.js';

export async function getAllProducts(req, res) {
  try {
    const result = await query('SELECT * FROM products ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error en getAllProducts:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function createProduct(req, res) {
  try {
    const { name, price, description, images, sizes } = req.body;
    const result = await query(
      'INSERT INTO products (name, price, description, images, sizes, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, price, description, images, sizes, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error en createProduct:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const { name, price, description, images, sizes } = req.body;

    const product = await query(
      'SELECT * FROM products WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (product.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found or unauthorized' });
    }

    const result = await query(
      'UPDATE products SET name = $1, price = $2, description = $3, images = $4, sizes = $5 WHERE id = $6 RETURNING *',
      [name, price, description, images, sizes, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error en updateProduct:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function deleteProduct(req, res) {
  try {
    const { id } = req.params;

    const product = await query(
      'SELECT * FROM products WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (product.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found or unauthorized' });
    }

    await query('DELETE FROM products WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    console.error('❌ Error en deleteProduct:', error);
    res.status(500).json({ error: error.message });
  }
}