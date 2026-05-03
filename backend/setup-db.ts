/**
 * setup-db.ts — Unified database setup script.
 *
 * Runs all pending TypeORM migrations then seeds the database with
 * demo products and employees required for a functioning local demo.
 *
 * Usage (after `npm run build`):
 *   npx ts-node -r tsconfig-paths/register setup-db.ts
 *
 * Or via npm script:
 *   npm run setup:db
 */
import 'reflect-metadata';
import { dataSourceOptions } from './src/database/data-source';
import { DataSource } from 'typeorm';

async function setup() {
  // ── 1. Connect ────────────────────────────────────────────────────────────
  // Override migrations to point at TypeScript source files so this script
  // works on a clean install without requiring `nest build` to have run first.
  const dataSource = new DataSource({
    ...dataSourceOptions,
    migrations: ['src/database/migrations/*.ts'],
  });
  await dataSource.initialize();
  console.log('✅ Connected to database.\n');

  // ── 2. Run migrations ─────────────────────────────────────────────────────
  console.log('🔄 Running pending migrations…');
  const migrations = await dataSource.runMigrations({ transaction: 'each' });
  if (migrations.length === 0) {
    console.log('   No new migrations to run (schema is up to date).');
  } else {
    migrations.forEach(m => console.log(`   ✔ ${m.name}`));
  }
  console.log();

  // ── 3. Seed products ──────────────────────────────────────────────────────
  console.log('🍕 Seeding products…');
  await dataSource.query(`
    INSERT INTO products (id, name, price, type, dough_type, size)
    VALUES
      (1, 'Margherita',        7.90, 'Pizza', 'Thin',  'Stredná'),
      (2, 'Pepperoni Classic', 8.90, 'Pizza', 'Thick', 'Stredná'),
      (3, 'Quattro Formaggi',  9.90, 'Pizza', 'Thin',  'Stredná'),
      (4, 'Hawai',             8.50, 'Pizza', 'Thick', 'Stredná'),
      (5, 'Prosciutto',        9.50, 'Pizza', 'Thin',  'Stredná'),
      (6, 'Vegetariana',       8.90, 'Pizza', 'Thin',  'Stredná')
    ON CONFLICT (id) DO NOTHING;
  `);
  await dataSource.query(`SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));`);

  // ── 4. Seed employees ─────────────────────────────────────────────────────
  console.log('👷 Seeding employees…');
  await dataSource.query(`
    INSERT INTO employees (id, name, surname, role)
    VALUES
      (1, 'Mario', 'Rossi',   'cook'),
      (2, 'Luigi', 'Bianchi', 'waiter')
    ON CONFLICT (id) DO NOTHING;
  `);
  await dataSource.query(`SELECT setval('employees_id_seq', (SELECT MAX(id) FROM employees));`);

  // ── 5. Summary ────────────────────────────────────────────────────────────
  const products  = await dataSource.query(`SELECT id, name, price FROM products  ORDER BY id;`);
  const employees = await dataSource.query(`SELECT id, name, surname, role FROM employees ORDER BY id;`);

  console.log('\n📦 Products in database:');
  console.table(products);

  console.log('👷 Employees in database:');
  console.table(employees);

  await dataSource.destroy();
  console.log('🎉 Database setup complete. You can now start the backend.');
}

setup().catch((err) => {
  console.error('\n❌ Setup failed:', err.message ?? err);
  process.exit(1);
});
