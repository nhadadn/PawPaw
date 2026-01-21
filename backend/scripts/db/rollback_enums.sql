-- Rollback Migration: Convert Enums back to Strings

-- 1. Revert User.role
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" 
  ALTER COLUMN "role" TYPE TEXT 
  USING (
    CASE "role"::text
      WHEN 'ADMIN' THEN 'admin'
      ELSE 'customer'
    END
  );
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'customer';

-- 2. Revert Order.status
ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "orders" 
  ALTER COLUMN "status" TYPE TEXT 
  USING (
    CASE "status"::text
      WHEN 'PENDING' THEN 'pending'
      WHEN 'PAID' THEN 'paid'
      WHEN 'SHIPPED' THEN 'shipped'
      WHEN 'CANCELLED' THEN 'cancelled'
      ELSE 'pending'
    END
  );
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'pending';

-- 3. Revert InventoryLog.changeType
ALTER TABLE "inventory_logs" 
  ALTER COLUMN "changeType" TYPE TEXT 
  USING (
    CASE "changeType"::text
      WHEN 'RESERVE' THEN 'reserve'
      WHEN 'RELEASE' THEN 'release'
      WHEN 'CHECKOUT_CONFIRMED' THEN 'checkout_confirmed'
      WHEN 'UPDATE' THEN 'adjustment' -- Reverting to 'adjustment' based on legacy code found
      WHEN 'RELEASE_EXPIRED' THEN 'release_expired'
      ELSE 'update'
    END
  );

-- 4. Drop Types
DROP TYPE IF EXISTS "UserRole";
DROP TYPE IF EXISTS "OrderStatus";
DROP TYPE IF EXISTS "InventoryChangeType";
