var redis = require("redis");

module.exports.createBucket = function(options) {
  options = options || {};
  return new Bucket(options);
}

var Bucket = function(options) {
  this.client = options['client'] || redis.createClient();
  this.name = options['name'] || 'concurrent-cache';
  this.ttl = options['ttl'] || 60; // seconds
}

Bucket.prototype.cache = function(keyData, load, callback) {
  var key = this.buildKey(keyData);
  var that = this;
  
  this.client.get(key, function(err, reply) {
    if (err) {
      callback(err, null);
      return;
    }

    if (reply) {
      // Already cached, just call callback
      callback(null, reply);
    } else {
      // Not cached. Load, cache and callback
      load(function(err, data) {
        if (err) {
          callback(err, data);
          return;
        }

        that.client.setex(key, that.ttl, data);
        callback(null, data);
      });
    }
  });
};

Bucket.prototype.invalidate = function() {
  
};

Bucket.prototype.buildKey = function(keyData) {
  if (Array.isArray(keyData)) {
    keyData = keyData.join(':');
  }
  return this.name+':'+keyData;
};