-- Add optional video_url column to products
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "video_url" TEXT;
