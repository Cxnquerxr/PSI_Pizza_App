-- Pizzeria Demo Seed Script
-- Inserts products matching the Kiosk catalog into the 'products' table.
-- Safe to re-run: uses ON CONFLICT DO NOTHING.

INSERT INTO products (id, name, price, type, dough_type, size)
VALUES
  (1, 'Margherita',       7.90, 'Pizza', 'Thin',  'Stredná'),
  (2, 'Pepperoni Classic', 8.90, 'Pizza', 'Thick', 'Stredná'),
  (3, 'Quattro Formaggi', 9.90, 'Pizza', 'Thin',  'Stredná'),
  (4, 'Hawai',            8.50, 'Pizza', 'Thick', 'Stredná'),
  (5, 'Prosciutto',       9.50, 'Pizza', 'Thin',  'Stredná'),
  (6, 'Vegetariana',      8.90, 'Pizza', 'Thin',  'Stredná')
ON CONFLICT (id) DO NOTHING;

-- Reset the primary key sequence so future inserts don't collide
SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));
