import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false,
  },
});

export const query = (text, params) => pool.query(text, params);
export const getClient = () => pool.connect();