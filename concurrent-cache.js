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
    if (err) { callback(err, reply); return; }

    if (reply) {
      // Already cached, just call callback
      callback(null, reply);
    } else {
      // Not cached
      that.client.exists('concurrent-cache:processing:'+key, function(err, beingProcessed) {
        if (err) { callback(err); return; }

        if (beingProcessed) {
          waitOnProcessing(that, key, callback)
        } else {
          processMyself(that, key, load, callback);
        }
      });
    }
  });
};

function waitOnProcessing(instance, key, callback) {
  instance.client.on("message", function (channel, message) {
     if (channel == "concurrent-cache:processed:"+key) {
       callback(null, message);
     }
   });
  instance.client.subscribe("concurrent-cache:processed:"+key);
}

function processMyself(instance, key, load, callback) {
  instance.client.setex('concurrent-cache:processing:'+key, 3, true);
  load(function(err, data) {
    if (err) { callback(err, data); return; }

    instance.client.del('concurrent-cache:processing:'+key);
    instance.client.publish('concurrent-cache:processed:'+key, data);
    instance.client.setex(key, instance.ttl, data);
    callback(null, data);
  });
}
Bucket.prototype.exists = function(keyData, callback) {
  var key = this.buildKey(keyData);
  this.client.exists(key, function(err, exists) {
    callback(err, !!exists);
  });
};

Bucket.prototype.invalidate = function(keyData, callback) {
  var key = this.buildKey(keyData);
  this.client.del(key, callback);
};

Bucket.prototype.buildKey = function(keyData) {
  if (Array.isArray(keyData)) {
    keyData = keyData.join(':');
  }
  return this.name+':'+keyData;
};