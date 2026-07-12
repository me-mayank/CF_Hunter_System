import { createServer } from './src/api/server.js';
const app = createServer();
const server = app.listen(3001, async () => {
  try {
    const res = await fetch('http://localhost:3001/docs/');
    if (res.ok) {
      console.log('Swagger UI loaded successfully');
    } else {
      console.error('Failed to load Swagger UI:', res.status);
    }
  } catch (err) {
    console.error(err);
  } finally {
    server.close();
  }
});
