var assert = require('assert')
  , concurrentCache = require('./concurrent-cache')
  , redis = require("redis-mock")
  , client = null;

describe("concurrent-cache", function() {
  function loadFunction(done) {
    counter++;
    done(null, 'Loaded: '+counter);
  }
  function neverCalled() {
    done('neverCalled was called');
  }

  var counter;
  beforeEach(function(){
    counter = 0;
    client = redis.createClient();
    redis.storage = {};
    redis.subscriptions = {};
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
      bucket.cache(['foo',1,true], neverCalled, function(err, data) {
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

  it("should accept a string or array as key data", function() {
    var bucket = concurrentCache.createBucket({ client: client });
    var key1 = bucket.buildKey(['foo',1,true]);
    var key2 = bucket.buildKey('foo:1:true');
    assert.equal(key1, key2);
  });

  it("should expose an 'exists' function", function(done) {
    var bucket = concurrentCache.createBucket({ client: client });
    bucket.cache(['foo',1,true], loadFunction, function(err, data) {
      bucket.exists(['foo',1,true], function(err, exists) {
        assert.ok(exists);
        bucket.exists(['bar',2,false], function(err, exists) {
          assert.ok(!exists);
          done();
        });
      });
    });
  });

  it("should allow invalidation of a single key", function(done) {
    var bucket = concurrentCache.createBucket({ client: client });
    bucket.cache(['foo',1,true], loadFunction, function(err, data) {
      bucket.cache(['bar',2,false], loadFunction, function(err, data) {

        bucket.invalidate(['foo',1,true], function(err) {

          bucket.exists(['foo',1,true], function(err, exists) {
            assert.ok(!exists);
            bucket.exists(['bar',2,false], function(err, exists) {
              assert.ok(exists);
              done();
            });
          });

        });

      });
    });
  });

  it("should not call load if another load for the same key is in progress", function(done) {
    function longLoadFunction(done) {
      setTimeout(function() {
        loadFunction(done);
      }, 1000);
    }
    function then() {
      done();
    }

    var bucket = concurrentCache.createBucket({ client: client });
    bucket.cache(['foo',1,true], longLoadFunction, done);

    setTimeout(function() {
      bucket.cache(['foo',1,true], neverCalled, function(){});
      bucket.cache(['foo',1,true], neverCalled, function(){});
    }, 1);
  });

  it("should trigger waiting requests when one loads", function(done) {
    function longLoadFunction(done) {
      setTimeout(function() {
        loadFunction(done);
      }, 1000);
    }

    var calledBackCount = 0;
    function then(err, data) {
      if (++calledBackCount == 3) {
        assert.equal(data, 'Loaded: 1');
        assert.equal(counter, 1);
        done();
      }
    }

    var bucket = concurrentCache.createBucket({ client: client });
    bucket.cache(['foo',1,true], longLoadFunction, then);

    setTimeout(function() {
      bucket.cache(['foo',1,true], neverCalled, then);
      bucket.cache(['foo',1,true], neverCalled, then);
    }, 1);
  });

  it("should drop subscriptions when done");

  it("should handle errors in the load function");
});