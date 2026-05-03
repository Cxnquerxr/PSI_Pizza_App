/**
 * Demo seed script — run once to populate the database with the Kiosk catalog.
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register seed.ts
 */
import 'reflect-metadata';
import { dataSourceOptions } from './src/database/data-source';
import { DataSource } from 'typeorm';

async function seed() {
  const dataSource = new DataSource(dataSourceOptions);
  await dataSource.initialize();
  console.log('✅ Connected to database.');

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

  // Seed demo employees (cook + waiter) so employee_orders FK targets exist
  await dataSource.query(`
    INSERT INTO employees (id, name, surname, role)
    VALUES
      (1, 'Mario',  'Rossi',   'cook'),
      (2, 'Luigi',  'Bianchi', 'waiter')
    ON CONFLICT (id) DO NOTHING;
  `);

  // Keep sequences in sync so future inserts get the right next ids
  await dataSource.query(`SELECT setval('products_id_seq',  (SELECT MAX(id) FROM products));`);
  await dataSource.query(`SELECT setval('employees_id_seq', (SELECT MAX(id) FROM employees));`);

  const products = await dataSource.query(`SELECT id, name, price FROM products ORDER BY id;`);
  console.log('\n📦 Products now in database:');
  console.table(products);

  const employees = await dataSource.query(`SELECT id, name, surname, role FROM employees ORDER BY id;`);
  console.log('\n👷 Employees now in database:');
  console.table(employees);

  await dataSource.destroy();
  console.log('\n🎉 Seed complete.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
