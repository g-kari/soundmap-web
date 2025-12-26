/**
 * Rate limiting utilities for preventing abuse
 */

// Default rate limit configurations
export const UPLOAD_RATE_LIMIT = {
  maxRequests: 10,
  windowMs: 60 * 60 * 1000, // 1 hour
} as const;

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitInfo {
  count: number;
  resetAt: number;
}

/**
 * Check if a user/IP has exceeded the rate limit
 * @param kv - KV namespace to store rate limit data
 * @param key - Unique identifier (userId or IP address)
 * @param config - Rate limit configuration
 * @returns Object with allowed status and remaining requests
 * 
 * Note: This implementation has a potential race condition with concurrent requests,
 * as the read-modify-write operation is not atomic. For the use case of preventing
 * abuse, slight overruns are acceptable and won't cause significant issues.
 */
export async function checkRateLimit(
  kv: KVNamespace,
  key: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const rateLimitKey = `rate_limit:${key}`;
  const now = Date.now();
  
  // Get current rate limit info
  const data = await kv.get(rateLimitKey);
  let info: RateLimitInfo;
  
  if (data) {
    try {
      info = JSON.parse(data) as RateLimitInfo;
      
      // Check if the window has expired
      if (now >= info.resetAt) {
        // Reset the counter
        info = {
          count: 0,
          resetAt: now + config.windowMs,
        };
      }
    } catch {
      // Invalid data, reset
      info = {
        count: 0,
        resetAt: now + config.windowMs,
      };
    }
  } else {
    // No existing rate limit data
    info = {
      count: 0,
      resetAt: now + config.windowMs,
    };
  }
  
  // Check if limit exceeded
  if (info.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: info.resetAt,
    };
  }
  
  // Increment counter
  info.count += 1;
  
  // Store updated info with expiration
  const ttlSeconds = Math.ceil((info.resetAt - now) / 1000);
  await kv.put(rateLimitKey, JSON.stringify(info), {
    expirationTtl: ttlSeconds,
  });
  
  return {
    allowed: true,
    remaining: config.maxRequests - info.count,
    resetAt: info.resetAt,
  };
}
