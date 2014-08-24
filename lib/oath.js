
// Since objects only compare === to the same object (i.e. the same reference)
// we can do something like this instead of using integer enums because we can't
// ever accidentally compare these to other values and get a false-positive.
var rejected = {}, resolved = {}, waiting = {};

// This is a promise. It's a value with an associated temporal
// status. The value might exist or might not, depending on
// the status.
var Promise = function (value, status) {
  this.value     = value;
  this._status   = status || 'waiting';
  this._handlers = [];

};

// The user-facing way to add functions that want
// access to the value in the promise when the promise
// is resolved.
Promise.prototype.then = function (success, _failure) { 
  if ( this._status === 'waiting' ) {
    this._handlers.push({
      success: success,
      failure: _failure
    });
  }

  return this;
};


// The user-facing way to add functions that should fire on an error. This
// can be called at the end of a long chain of .then()s to catch all .reject()
// calls that happened at any time in the .then() chain. This makes chaining
// multiple failable computations together extremely easy.
Promise.prototype.catch = function (failure) {
  if ( typeof failure === 'function')
    this._handlers.push({ failure: failure });
};

// This is the object returned by defer() that manages a promise.
// It provides an interface for resolving and rejecting promises
// and also provides a way to extract the promise it contains.
var Deferred = function (promise) {
  this.promise = promise;
};

// Resolve the contained promise with data.
Deferred.prototype.resolve = function (data) {
  var handlers = this.promise._handlers;
  var handler  = handlers.shift();
  var handled  = handler ? handler.success(data) : undefined;

  // this.promise._status = 'resolved';  

  if ( handled instanceof Promise ) {
    this.promise = handled;
    this.promise._handlers = handlers;
  }

};

// Reject the contained promise with an error.
Deferred.prototype.reject = function (error) {
  var handlers  = this.promise._handlers;
  
  // this.promise._status = 'rejected';  

  for (var i = 0; i < handlers.length; i++) {
    if ( handlers[i].failure ) {
      handlers[i].failure(error);
    }
  }
};


// The external interface for creating promises
// and resolving them. This returns a Deferred
// object with an empty promise.
var defer = function () {
  return new Deferred( new Promise() );
};

var promisify = function (asyncFn) {

  return function () {
    var args = [].slice.call(arguments);
    var defer = new Deferred( new Promise() );

    // add custom callback
    args.push( function () {
      var args = [].slice.call(arguments);
      
      if (args[0]) {
        defer.resolve(args[0]);
      } else {
        defer.reject(args[1]);
      }

    });

    asyncFn.apply(this, args);

    return defer.promise;
  };
};

module.exports = {
  defer: defer,
  promisify: promisify
};

