// Setup:
    var concurrentCache = require('concurrent-cache');
    
    concurrentCache.configure({
      ttl: 60 // Recommended: Time-to-live for keys (seconds)
      prefix: 'my-project' // Recommended: Redis namespace to avoid conflicts. Usually the project name
      redisClient: redisClient // Optional: Redis client to use
    });

// API:

    // Cache in a bucket or the global space. ttl is optional (set default in config)
    cache = concurrentCache.bucket(bucketname, ttl); // or .global()
    
    // keyData: array/string of properties uniquely identifying this data
    // loadData: function called if data doesn't exist in cache
    // callback: function(err, data) called once data is retrieved
    cache(keyData, loadData, callback);