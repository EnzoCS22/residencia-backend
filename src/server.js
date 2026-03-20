require('dotenv').config();

const app = require('./app');
const pool = require('./config/db');

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    const result = await pool.query('SELECT NOW() AS fecha');
    console.log('Conexión a Supabase OK:', result.rows[0].fecha);

    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error.message);
    process.exit(1);
  }
}

startServer();