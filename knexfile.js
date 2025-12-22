require('dotenv').config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

module.exports = {
  client: 'pg',
  connection: process.env.DATABASE_URL,

  migrations: {
    directory: './db/migrations',
    extension: 'js',
<<<<<<< HEAD
    loadExtensions: ['.js'],
=======
>>>>>>> 61fe280 (Fix knex config and apply migrations infrastructure)
  },

  pool: {
    min: 1,
    max: 5,
  },
};

