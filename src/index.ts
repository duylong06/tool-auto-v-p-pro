import 'dotenv/config';
import express from 'express';
import { taskRouter } from './api/task.route';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api', taskRouter);

app.get('/', (_req, res) => {
  res.json({ status: 'Office Agent đang chạy 🤖' });
});

app.listen(PORT, () => {
  console.log(`✅ Office Agent server đang chạy tại http://localhost:${PORT}`);
});
