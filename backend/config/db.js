const { Pool } = require('pg');
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
});

// Test de la connexion et de la table "users"
pool.query('SELECT * FROM users', (err, res) => {
  if (err) {
    console.error('Erreur lors de la requête :', err.stack);
  } else {
    console.log('Résultat de la table users :', res.rows);
  }
});




module.exports = pool;
