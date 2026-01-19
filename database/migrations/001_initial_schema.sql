CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE categories (
  id bigserial PRIMARY KEY,
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  category_id bigint REFERENCES categories(id) ON DELETE SET NULL,
  price_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'MXN',
  is_active boolean NOT NULL DEFAULT true,
  is_drop boolean NOT NULL DEFAULT false,
  drop_date timestamptz,
  max_per_customer integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE product_variants (
  id bigserial PRIMARY KEY,
  product_id bigint NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku text NOT NULL UNIQUE,
  size text,
  color text,
  initial_stock integer NOT NULL,
  reserved_stock integer NOT NULL DEFAULT 0,
  available_stock integer GENERATED ALWAYS AS (initial_stock - reserved_stock) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (initial_stock >= 0),
  CHECK (reserved_stock >= 0),
  CHECK (available_stock >= 0)
);

CREATE TABLE orders (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status text NOT NULL,
  total_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'MXN',
  stripe_payment_intent_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
  id bigserial PRIMARY KEY,
  order_id bigint NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_variant_id bigint NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
  quantity integer NOT NULL,
  unit_price_cents integer NOT NULL,
  total_price_cents integer NOT NULL,
  CHECK (quantity > 0),
  CHECK (unit_price_cents >= 0),
  CHECK (total_price_cents >= 0)
);

CREATE TABLE cart (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE TABLE cart_items (
  id bigserial PRIMARY KEY,
  cart_id bigint NOT NULL REFERENCES cart(id) ON DELETE CASCADE,
  product_variant_id bigint NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
  quantity integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (quantity > 0),
  UNIQUE (cart_id, product_variant_id)
);

CREATE TABLE waitlist (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id bigint NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

CREATE TABLE inventory_logs (
  id bigserial PRIMARY KEY,
  product_variant_id bigint NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  order_id bigint REFERENCES orders(id) ON DELETE SET NULL,
  change_type text NOT NULL,
  quantity_diff integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_drop_date_is_drop ON products (drop_date, is_drop);
CREATE INDEX idx_orders_user_created_at ON orders (user_id, created_at);
CREATE INDEX idx_products_name_fts ON products USING gin (to_tsvector('spanish', name));

CREATE ROLE web_anon NOLOGIN;
CREATE ROLE authenticator NOINHERIT LOGIN PASSWORD 'authenticator_password';
GRANT web_anon TO authenticator;

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY orders_select_own ON orders
  FOR SELECT
  USING (current_setting('request.jwt.claim.user_id', true)::uuid = user_id);

CREATE POLICY orders_select_admin ON orders
  FOR SELECT
  TO web_anon
  USING (current_setting('request.jwt.claim.role', true) = 'admin');

CREATE POLICY users_select_self ON users
  FOR SELECT
  USING (current_setting('request.jwt.claim.user_id', true)::uuid = id);

CREATE FUNCTION log_inventory_update() RETURNS trigger AS
$$
BEGIN
  IF NEW.initial_stock <> OLD.initial_stock OR NEW.reserved_stock <> OLD.reserved_stock THEN
    INSERT INTO inventory_logs (product_variant_id, order_id, change_type, quantity_diff)
    VALUES (NEW.id, NULL, 'update', (NEW.initial_stock - NEW.reserved_stock) - (OLD.initial_stock - OLD.reserved_stock));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_inventory_update
AFTER UPDATE ON product_variants
FOR EACH ROW
EXECUTE FUNCTION log_inventory_update();

INSERT INTO categories (name, slug) VALUES
  ('Hoodies', 'hoodies'),
  ('Sneakers', 'sneakers'),
  ('Accessories', 'accessories');

INSERT INTO users (email, password_hash, role) VALUES
  ('admin@pawpaw.com', 'admin_hashed_password', 'admin'),
  ('customer@pawpaw.com', 'customer_hashed_password', 'customer');

INSERT INTO products (name, slug, description, category_id, price_cents, is_drop, drop_date, max_per_customer) VALUES
  ('Midnight Street Hoodie', 'midnight-street-hoodie', 'Hoodie negro oversize.', 1, 89900, true, now() + interval '7 days', 1),
  ('Neon Pulse Sneakers', 'neon-pulse-sneakers', 'Sneakers con detalles neón.', 2, 149900, true, now() + interval '10 days', 1),
  ('Urban Paw Cap', 'urban-paw-cap', 'Gorra urbana edición limitada.', 3, 49900, true, now() + interval '3 days', 2),
  ('Everyday Street Tee', 'everyday-street-tee', 'Playera básica de uso diario.', 1, 39900, false, NULL, NULL),
  ('City Runner Socks', 'city-runner-socks', 'Calcetas deportivas.', 3, 19900, false, NULL, NULL);

INSERT INTO product_variants (product_id, sku, size, color, initial_stock) VALUES
  (1, 'MID-HOODIE-BLACK-M', 'M', 'Black', 50),
  (2, 'NEON-SNK-WHITE-42', '42', 'White/Neon', 30),
  (3, 'URBAN-CAP-BLACK-OS', 'One Size', 'Black', 100),
  (4, 'TEE-WHITE-M', 'M', 'White', 200),
  (5, 'SOCKS-BLACK-40-42', '40-42', 'Black', 150);

INSERT INTO waitlist (user_id, product_id) VALUES
  ((SELECT id FROM users WHERE email = 'customer@pawpaw.com'), 1),
  ((SELECT id FROM users WHERE email = 'customer@pawpaw.com'), 2);

INSERT INTO cart (user_id) VALUES
  ((SELECT id FROM users WHERE email = 'customer@pawpaw.com'));

INSERT INTO cart_items (cart_id, product_variant_id, quantity) VALUES
  ((SELECT id FROM cart WHERE user_id = (SELECT id FROM users WHERE email = 'customer@pawpaw.com')), 1, 1);

