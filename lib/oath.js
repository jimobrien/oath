
// Since objects only compare === to the same object (i.e. the same reference)
// we can do something like this instead of using integer enums because we can't
// ever accidentally compare these to other values and get a false-positive.
var rejected = {}, resolved = {}, waiting = {};

// This is a promise. It's a value with an associated temporal
// status. The value might exist or might not, depending on
// the status.
var Promise = function (value) {
  this.value      = value;
  this._status    = 'waiting';
  this._handlers  = [];
  // this._onSuccess = [];
  // this._onFailure = [];
};

// var all.then(function(){ reutrn val }).then()

// The user-facing way to add functions that want
// access to the value in the promise when the promise
// is resolved.
Promise.prototype.then = function (success, _failure) {
  // console.log('then invoked');
  // success  ? this._onSuccess.push(success) : undefined;
  // _failure ? this._onFailure.push(_failure) : undefined;
  var promise = new Promise();
  var handlerMap = {
    resolved: 'success',
    rejected: 'failure'
  };

  if ( success || _failure ) {
    this._handlers.push({
      success: success,
      failure: _failure,
      promise: promise
    });
  }

  if ( handlerMap[this._status] ) {
    for (var i = 0; i < this._handlers.length; i++) {
      var handler = this._handlers[i][this._status];

      if ( typeof handler === 'function' ) {
        promise.value = handler(this.value);
      }
    }
  }

  return promise;
  // if (this._status === 'resolved') {
  //   for (var i = 0; i < this._onSuccess.length; i++) {
  //     var val = this._onSuccess[i](this.value);
  //     console.log(val instanceof Promise)
  //     if( val instanceof Promise) {
  //       return val;
  //     } else {
  //       this.value = val;
  //     }
  //     // console.log(this.value, 'type of val', typeof this.value)
  //   }

  // } else if (this._status === 'rejected') {
  //   for (var i = 0; i < this._onFailure.length; i++) {
  //     this.value = this._onFailure[i](this.value);
  //   }

  // }

  // return this;

};


// The user-facing way to add functions that should fire on an error. This
// can be called at the end of a long chain of .then()s to catch all .reject()
// calls that happened at any time in the .then() chain. This makes chaining
// multiple failable computations together extremely easy.
Promise.prototype.catch = function (failure) {
  // register failure listener
  this.then(null, failure);
};



// This is the object returned by defer() that manages a promise.
// It provides an interface for resolving and rejecting promises
// and also provides a way to extract the promise it contains.
var Deferred = function (promise) {
  this.promise = promise;
};

// Resolve the contained promise with data.
Deferred.prototype.resolve = function (data) {
  this.promise._status = 'resolved';
  this.promise.value = data;

  return this.promise.then();
};

// Reject the contained promise with an error.
Deferred.prototype.reject = function (error) {
  this.promise._status = 'rejected';
  this.promise.value = error;

  return this.promise.then();
};

// The external interface for creating promises
// and resolving them. This returns a Deferred
// object with an empty promise.
var defer = function () {
  return new Deferred( new Promise({}) );
};


module.exports.defer = defer;

