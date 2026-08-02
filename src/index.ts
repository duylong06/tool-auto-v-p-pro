import 'dotenv/config';
import express from 'express';
import { taskRouter } from './api/task.route';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api', taskRouter);

app.get('/', (_req, res) => {
  res.json({ status: 'Office Agent is running' });
});

app.listen(PORT, () => {
  console.log(`[Server] Running at http://localhost:${PORT}`);
});