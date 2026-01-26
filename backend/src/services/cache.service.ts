import redis from '../lib/redis';
import logger from '../lib/logger';

/**
 * CacheService
 *
 * Implements a caching strategy using Redis to reduce database load.
 *
 * Strategy:
 * - Cache-Aside: Application code looks in cache before DB.
 * - TTL (Time To Live): Default 300s to ensure eventual consistency.
 * - Invalidation:
 *   - "products:list:*" keys are invalidated on Product Create/Update/Delete.
 *   - "product:detail:${slug}" key is invalidated on Product Update/Delete.
 *   - "categories:list" should be invalidated on Category changes (if applicable).
 *
 * Keys:
 * - Products List: `products:list:${limit}:${offset}:${categorySlug}`
 * - Product Detail: `product:detail:${slug}`
 * - Categories List: `categories:list`
 *
 * Fallback:
 * - If Redis is down, methods return null (or catch errors), causing
 *   the application to fall back to the database transparently.
 */
export class CacheService {
  /**
   * Get value from cache
   * @param key Cache key
   * @returns Parsed value or null
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);
      if (data) {
        logger.info(`[Cache] HIT: ${key}`);
        return JSON.parse(data) as T;
      }
      logger.info(`[Cache] MISS: ${key}`);
      return null;
    } catch (error) {
      logger.error(`[Cache] Error getting key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache
   * @param key Cache key
   * @param value Value to store
   * @param ttl Time to live in seconds (default: 300)
   */
  async set<T>(key: string, value: T, ttl: number = 300): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
      logger.info(`[Cache] SET: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      logger.error(`[Cache] Error setting key ${key}:`, error);
    }
  }

  /**
   * Delete key or pattern
   * @param pattern Key or pattern (e.g. "products:*")
   */
  async del(pattern: string): Promise<void> {
    try {
      if (pattern.includes('*')) {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          // Iterate to be safe with MockRedis which might not support varargs del
          await Promise.all(keys.map((k) => redis.del(k)));
          logger.info(`[Cache] CLEARED pattern ${pattern} (${keys.length} keys)`);
        } else {
          logger.info(`[Cache] No keys found for pattern ${pattern}`);
        }
      } else {
        await redis.del(pattern);
        logger.info(`[Cache] DELETED key ${pattern}`);
      }
    } catch (error) {
      logger.error(`[Cache] Error deleting pattern ${pattern}:`, error);
    }
  }

  /**
   * Delete multiple patterns
   * @param patterns Array of patterns
   */
  async delMultiple(patterns: string[]): Promise<void> {
    await Promise.all(patterns.map((p) => this.del(p)));
  }
}
