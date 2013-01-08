var assert = require('assert')
  , concurrentCache = require('./concurrent-cache')
  , redis = require("redis-mock")
  , client = redis.createClient();

describe("concurrent-cache", function() {
  counter = 0;
  function loadFunction(err, done) {
    counter++;
    done('Loaded: '+counter);
  }
  
  it("should call load and then callback for the first request");
  it("if it should call load and run if it isn't cached");
  it("it should recall from cache if it's in the cache");
  it("it should use the redisclient provided, or create one ");
  it("it should allow key invalidation");
  it("it should not call load if another load for the same key is in progress");
  it("it should trigger waiting requests when one loads");
  it("it should handle errors in the load function");
});