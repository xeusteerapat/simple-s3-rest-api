import { buildServer } from './server.ts';

const start = async () => {
  try {
    const server = await buildServer();
    const port = parseInt(process.env.PORT || '3009', 10);

    await server.listen({ port, host: '0.0.0.0' });

    console.log(`Server is running on port ${port}`);
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
};

start();
