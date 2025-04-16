import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';        // ✅ Asegúrate de que estos están bien
import productRoutes from './routes/products.js'; // ✅ con los controladores que corresponden
import userRoutes from './routes/users.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);

export default app;