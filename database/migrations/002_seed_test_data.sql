-- Limpiar datos anteriores
TRUNCATE TABLE product_variants CASCADE;
TRUNCATE TABLE products CASCADE;
TRUNCATE TABLE categories CASCADE;
TRUNCATE TABLE users CASCADE;

-- Reset sequences
ALTER SEQUENCE categories_id_seq RESTART WITH 1;
ALTER SEQUENCE products_id_seq RESTART WITH 1;
ALTER SEQUENCE product_variants_id_seq RESTART WITH 1;

-- Insertar Categorías
INSERT INTO categories (name, slug, created_at, updated_at) VALUES
('Ropa Urbana', 'ropa-urbana', NOW(), NOW()),
('Gorras', 'gorras', NOW(), NOW()),
('Jerseys Deportivos', 'jerseys-deportivos', NOW(), NOW()),
('Dispositivos Roku', 'dispositivos-roku', NOW(), NOW());
-- Note: Schema for categories: id, name, slug, created_at, updated_at. No description.

-- Insertar Productos
INSERT INTO products (name, slug, description, category_id, price_cents, currency, max_per_customer, created_at, updated_at) VALUES
('Hoodie Negro Premium', 'hoodie-negro-premium', 'Hoodie urbano premium 100% algodón, perfecto para estilo casual', 1, 3999, 'MXN', 2, NOW(), NOW()),
('Gorra Snapback Azul', 'gorra-snapback-azul', 'Gorra snapback ajustable con bordado de logo', 2, 1999, 'MXN', 5, NOW(), NOW()),
('Jersey NBA Lakers', 'jersey-nba-lakers', 'Jersey deportivo oficial de los Lakers, talla única', 3, 2999, 'MXN', 1, NOW(), NOW()),
('Roku Streaming Stick 4K', 'roku-streaming-stick-4k', 'Dispositivo de streaming 4K con control remoto', 4, 4999, 'MXN', 1, NOW(), NOW()),
('Sudadera Gris', 'sudadera-gris', 'Sudadera gris oscuro con capucha, cómoda y duradera', 1, 2999, 'MXN', 2, NOW(), NOW()),
('Gorra Deportiva Roja', 'gorra-deportiva-roja', 'Gorra deportiva roja con ajuste trasero', 2, 1499, 'MXN', 5, NOW(), NOW());

-- Insertar Product Variants
INSERT INTO product_variants (product_id, sku, size, color, initial_stock, reserved_stock, created_at, updated_at) VALUES
-- Hoodie Negro
(1, 'HOOD-001-S', 'S', 'Negro', 50, 0, NOW(), NOW()),
(1, 'HOOD-001-M', 'M', 'Negro', 75, 0, NOW(), NOW()),
(1, 'HOOD-001-L', 'L', 'Negro', 60, 0, NOW(), NOW()),
(1, 'HOOD-001-XL', 'XL', 'Negro', 40, 0, NOW(), NOW()),

-- Gorra Snapback Azul
(2, 'GORRA-001-OS', 'One Size', 'Azul', 100, 0, NOW(), NOW()),
(2, 'GORRA-001-OS-RED', 'One Size', 'Rojo', 80, 0, NOW(), NOW()),

-- Jersey NBA Lakers
(3, 'JERSEY-001-S', 'S', 'Amarillo', 20, 0, NOW(), NOW()),
(3, 'JERSEY-001-M', 'M', 'Amarillo', 30, 0, NOW(), NOW()),
(3, 'JERSEY-001-L', 'L', 'Amarillo', 25, 0, NOW(), NOW()),

-- Roku Streaming Stick 4K
(4, 'ROKU-001', NULL, 'Negro', 20, 0, NOW(), NOW()),
(4, 'ROKU-002', NULL, 'Blanco', 15, 0, NOW(), NOW()),

-- Sudadera Gris
(5, 'SUDAD-001-S', 'S', 'Gris', 40, 0, NOW(), NOW()),
(5, 'SUDAD-001-M', 'M', 'Gris', 50, 0, NOW(), NOW()),
(5, 'SUDAD-001-L', 'L', 'Gris', 45, 0, NOW(), NOW()),

-- Gorra Deportiva Roja
(6, 'GORRA-002-OS', 'One Size', 'Rojo', 60, 0, NOW(), NOW());

-- Insertar usuario de prueba
INSERT INTO users (email, password_hash, role, created_at, updated_at) VALUES
('test@pawpaw.com', 'hashed_password_here', 'customer', NOW(), NOW()),
('admin@pawpaw.com', 'hashed_password_here', 'admin', NOW(), NOW());

-- Verificar datos insertados
SELECT COUNT(*) as total_categories FROM categories;
SELECT COUNT(*) as total_products FROM products;
SELECT COUNT(*) as total_variants FROM product_variants;
SELECT COUNT(*) as total_users FROM users;
