var assert = require('assert')
  , concurrentCache = require('./concurrent-cache')
  , redis = require("redis-mock")
  , client = redis.createClient();

describe("concurrent-cache", function() {
  function loadFunction(done) {
    counter++;
    done(null, 'Loaded: '+counter);
  }

  var counter;
  beforeEach(function(){
    counter = 0;
    redis.storage = {};
  });
  
  it("should call load and then callback with the loaded data", function(done) {
    var bucket = concurrentCache.createBucket({ client: client });
    bucket.cache(['foo',1,true], loadFunction, function(err, data) {
      assert.equal(data, 'Loaded: 1');
      done();
    });
  });

  it("should recall from cache if it's in the cache", function(done) {
    var bucket = concurrentCache.createBucket({ client: client });
    bucket.cache(['foo',1,true], loadFunction, function(err, data) {
      bucket.cache(['foo',1,true], loadFunction, function(err, data) {
        assert.equal(data, 'Loaded: 1');
        assert.equal(counter, 1);
        done();
      });
    });
  });

  it("should isolate caching requests with differing key data", function(done) {
    var bucket = concurrentCache.createBucket({ client: client });
    bucket.cache(['foo',1,true], loadFunction, function(err, data) {
      bucket.cache(['foo',7,false], loadFunction, function(err, data) {
        assert.equal(data, 'Loaded: 2');
        assert.equal(counter, 2);
        done();
      });
    });
  });

  it("should call load again if the ttl has passed", function(done) {
    var bucket = concurrentCache.createBucket({ client: client, ttl: 1 });
    bucket.cache(['foo',1,true], loadFunction, function(err, data) {
     setTimeout(function() {
        bucket.cache(['foo',1,true], loadFunction, function(err, data) {
          assert.equal(data, 'Loaded: 2');
          assert.equal(counter, 2);
          done();
        });
      }, 1100);
    });
  });

  it("should use the redisclient provided, or create one ");
  it("should allow key invalidation");
  it("should not call load if another load for the same key is in progress");
  it("should trigger waiting requests when one loads");
  it("should handle errors in the load function");
});