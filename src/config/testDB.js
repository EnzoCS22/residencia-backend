const pool = require('./db');

async function testDB() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('Base de datos conectada correctamente');
    console.log(result.rows[0]);
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error.message);
  }
}

testDB();