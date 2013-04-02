*note: This isn't finished and is by no means production-ready*

node-concurrent-cache
============

Our existing caching mechanism only let us retrieve a page from the cache after the first request had generated it. A spike in traffic to an uncached URL would result in high load as each request is processed simultaneously. (In our use case, this could happen fairly regularly).

node-concurrent-cache has an awareness of the requests already in progress. If 100 requests hit the same page at the same time, only the first will render, with the others bound to return when it has finished.

## Usage

```js
  var concurrentCache = require('concurrent-cache');
  
  var bucket = concurrentCache.bucket({
      name:   // The name of the bucket. If not provided, will default to the global bucket. This is important (see below)
      ttl:    // Time to live for keys in seconds. Default: 60
      client: // An (optional) instance of redisClient
    });
  
  // keyData: array/string of properties uniquely identifying this item in the bucket
  // loadFunction: function(done) called if data doesn't exist in cache. Call done() with the data
  bucket.cache(keyData, loadFunction, function(err, data) {
    console.log(data);
  });
```

## Buckets

Cached items are grouped into buckets, with the bucket name is used behind the scenes in Redis. How you organise buckets is at your discretion. It could simply be the name of your project, or you could use a more complicated scheme. Naming a bucket photos:1234 would allow you to group keys for photo 1234 - which you could then expire when photo 1234 changes.
