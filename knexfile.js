require('dotenv-flow').config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

module.exports = {
  client: 'pg',
  connection: process.env.DATABASE_URL,
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    directory: './db/migrations',
    extension: 'js',
  },
};