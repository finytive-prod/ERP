import { app, ensureDbInitialized } from './app';

const PORT = process.env.PORT || 5055;

async function startServer() {
  try {
    await ensureDbInitialized();
    app.listen(PORT, () => {
      console.log(`🚀 PostgreSQL ERP API Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
  }
}

startServer();
