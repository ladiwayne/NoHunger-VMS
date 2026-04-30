/**
 * Simple in-memory response caching middleware for GET requests
 * Caches for 2 minutes (120 seconds) to reduce database load
 */

const cache = new Map();

// Clean up expired cache entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (value.expiry < now) {
      cache.delete(key);
    }
  }
}, 5 * 60 * 1000);

const cacheMiddleware = (duration = 120000) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Create cache key from path and query
    const key = `${req.path}?${new URLSearchParams(req.query).toString()}`;
    
    // Check if response is in cache
    const cached = cache.get(key);
    if (cached && cached.expiry > Date.now()) {
      res.set('X-Cache', 'HIT');
      return res.json(cached.data);
    }

    // Override res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = function(data) {
      // Only cache successful responses
      if (res.statusCode === 200) {
        cache.set(key, {
          data,
          expiry: Date.now() + duration,
        });
        res.set('X-Cache', 'MISS');
      }
      return originalJson(data);
    };

    next();
  };
};

module.exports = cacheMiddleware;
