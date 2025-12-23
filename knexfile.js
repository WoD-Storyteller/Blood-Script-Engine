require('dotenv').config({
  path: process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

module.exports = {
  client: 'pg',
  connection: process.env.DATABASE_URL,

  migrations: {
    directory: './db/migrations',
    extension: 'js',
    loadExtensions: ['.js'],
  },

  pool: {
    min: 1,
    max: 5,
  },
};

