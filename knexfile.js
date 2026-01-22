// knexfile.js
const path = require('path');
const dotenv = require('dotenv');

// Load the correct env file BEFORE exporting config
dotenv.config({
  path:
    process.env.NODE_ENV === 'production'
      ? path.resolve(__dirname, '.env.production')
      : path.resolve(__dirname, '.env'),
});

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

module.exports = {
  client: 'pg',
  connection: process.env.DATABASE_URL,
  migrations: {
    directory: './db/migrations',
    tableName: 'knex_migrations',
  },
};