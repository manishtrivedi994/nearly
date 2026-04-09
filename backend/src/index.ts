import express from 'express';
import digestRouter from './routes/digest.js';
import citiesRouter from './routes/cities.js';
import adminRouter from './routes/admin.js';

// db/client is imported for its side effect: schema init + city seeding
import './db/client.js';

const app = express();

app.use(express.json());

app.use('/api/digest', digestRouter);
app.use('/api/cities', citiesRouter);
app.use('/api/admin', adminRouter);

// Simple health check — useful for Railway deploy probes
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const PORT = Number(process.env.PORT ?? 3001);

app.listen(PORT, () => {
  console.log(`[INFO] Server listening on port ${PORT}`);
});

export default app;
