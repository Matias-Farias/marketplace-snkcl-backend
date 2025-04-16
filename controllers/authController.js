import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';

const jwtSecret = process.env.JWT_SECRET;

export async function register(req, res) {
  const { name, email, password } = req.body;
  try {
    const userExists = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users(name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, hashed]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id }, jwtSecret);

    res.status(201).json({ user, token });
  } catch (error) {
    console.error('❌ Error en register:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function login(req, res) {
  const { email, password } = req.body;
  try {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id }, jwtSecret);
    res.json({
      user: { id: user.id, name: user.name, email: user.email },
      token
    });
  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}