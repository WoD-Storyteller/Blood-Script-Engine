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

// Prefer Replit's built-in PostgreSQL using PG* environment variables
// Fall back to DATABASE_URL only if it doesn't point to unreachable Supabase
let connection;
if (process.env.PGHOST && !process.env.PGHOST.includes('supabase')) {
  connection = {
    host: process.env.PGHOST,
    port: parseInt(process.env.PGPORT || '5432', 10),
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
  };
  console.log(`[Knex] Using Replit PostgreSQL: ${process.env.PGHOST}/${process.env.PGDATABASE}`);
} else if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('supabase')) {
  connection = process.env.DATABASE_URL;
  console.log('[Knex] Using DATABASE_URL');
} else {
  throw new Error('No reachable database configuration found. Ensure Replit PostgreSQL is provisioned.');
}

module.exports = {
  client: 'pg',
  connection,
  migrations: {
    directory: './db/migrations',
    tableName: 'knex_migrations',
  },
};