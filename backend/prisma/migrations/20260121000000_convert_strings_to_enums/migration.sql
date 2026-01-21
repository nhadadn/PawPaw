-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'CUSTOMER');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'SHIPPED', 'CANCELLED');
CREATE TYPE "InventoryChangeType" AS ENUM ('RESERVE', 'RELEASE', 'CHECKOUT_CONFIRMED', 'UPDATE', 'RELEASE_EXPIRED');

-- AlterTable User
-- Convert 'role' from String to Enum UserRole
-- Default: 'customer' -> 'CUSTOMER'
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" 
  ALTER COLUMN "role" TYPE "UserRole" 
  USING (
    CASE lower("role")
      WHEN 'admin' THEN 'ADMIN'::"UserRole"
      ELSE 'CUSTOMER'::"UserRole"
    END
  );
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'CUSTOMER';

-- AlterTable Order
-- Convert 'status' from String to Enum OrderStatus
-- Default: 'pending' -> 'PENDING'
ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "orders" 
  ALTER COLUMN "status" TYPE "OrderStatus" 
  USING (
    CASE lower("status")
      WHEN 'paid' THEN 'PAID'::"OrderStatus"
      WHEN 'shipped' THEN 'SHIPPED'::"OrderStatus"
      WHEN 'cancelled' THEN 'CANCELLED'::"OrderStatus"
      ELSE 'PENDING'::"OrderStatus"
    END
  );
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable InventoryLog
-- Convert 'changeType' from String to Enum InventoryChangeType
-- Mapping 'adjustment' to 'UPDATE' based on business logic decision
ALTER TABLE "inventory_logs" 
  ALTER COLUMN "change_type" TYPE "InventoryChangeType" 
  USING (
    CASE "change_type"
      WHEN 'reserve' THEN 'RESERVE'::"InventoryChangeType"
      WHEN 'release' THEN 'RELEASE'::"InventoryChangeType"
      WHEN 'checkout_confirmed' THEN 'CHECKOUT_CONFIRMED'::"InventoryChangeType"
      WHEN 'adjustment' THEN 'UPDATE'::"InventoryChangeType"
      WHEN 'update' THEN 'UPDATE'::"InventoryChangeType"
      WHEN 'release_expired' THEN 'RELEASE_EXPIRED'::"InventoryChangeType"
      ELSE 'UPDATE'::"InventoryChangeType" -- Safe fallback
    END
  );
