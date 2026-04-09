import express from 'express';
import cors from 'cors';
import digestRouter from './routes/digest.js';
import citiesRouter from './routes/cities.js';
import adminRouter from './routes/admin.js';
import pushRouter from './routes/push.js';
import searchRouter from './routes/search.js';
import flagRouter from './routes/flag.js';
import authRouter from './routes/auth.js';

// db/client is imported for its side effect: schema init + city seeding
import './db/client.js';

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN ?? '*')
  .split(',')
  .map((o) => o.trim());

app.use(cors({
  origin: allowedOrigins.includes('*') ? '*' : allowedOrigins,
}));
app.use(express.json());

app.use('/api/digest', digestRouter);
app.use('/api/cities', citiesRouter);
app.use('/api/admin', adminRouter);
app.use('/api/push', pushRouter);
app.use('/api/search', searchRouter);
app.use('/api/flag', flagRouter);
app.use('/api/auth', authRouter);

// Simple health check — useful for Railway deploy probes
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const PORT = Number(process.env.PORT ?? 3001);

app.listen(PORT, () => {
  console.log(`[INFO] Server listening on port ${PORT}`);
});

export default app;
