const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, '..', 'db', 'migrations');

for (const file of fs.readdirSync(migrationsDir)) {
  if (!file.endsWith('.sql')) continue;

  const sqlPath = path.join(migrationsDir, file);
  const jsPath = sqlPath.replace(/\.sql$/, '.js');

  const sql = fs.readFileSync(sqlPath, 'utf8');

  // JSON.stringify safely escapes *everything*
  const wrappedSql = JSON.stringify(sql);

  const js = [
    "exports.up = async function (knex) {",
    `  await knex.raw(${wrappedSql});`,
    "};",
    "",
    "exports.down = async function () {",
    "  // no automatic rollback",
    "};",
    "",
  ].join('\n');

  fs.writeFileSync(jsPath, js, 'utf8');
  fs.unlinkSync(sqlPath);

  console.log(`Converted ${file} → ${path.basename(jsPath)}`);
}

console.log('All SQL migrations converted successfully.');
