# tracking-promise

A JavaScript library for tracking the success/failure of a promise without rejecting itself.

A simple use case for tracking is to _trap_ a promise so that you get a fulfillment regardless of whether
that promise fulfills or rejects. You can then inspect the results to determine how it settled.

More generally, you can track promises, immediate values, or functions that return either.
This gives you access to a `Tracker` object that tracks information about the current
state: whether or not it is finished, whether it succeeded (returned or fulfilled) or failed
(threw or rejected), and what value or error it finished with.

The `Tracker` object also serves as a promise (a _thenable_) which will fulfill (always) when
the tracked value finishes, regardless of how it finishes.

## Overview

Install however you install npm packages, e.g.:

```console
npm install --save tracking-promise
```

Example use case:

```javascript
function functionToTrack() {
    /* ... */
}

const TIMEOUT_MS = 1000;

const track = require("track");

async function main() {
    // The `track` function will invoke the given function synchronously,
    // and return a "Tracker" object for it.
    // the timeout argument is optional, and has some important limitations!
    const tracker = track(functionToTrack, TIMEOUT_MS);

    // Some tracker fields are always set immediately (synchronously) and are available
    // upong returning from `track`.
    tracker.finished; // has the tracked value ended
    tracker.synchronous; // is the tracked value is synchronous or async

    // A Tracker is a promise, it fulfills when the tracked value has ended
    const results = await tracker;

    // It fulfills with information about the tracked value:
    results.synchronous; // was the tracked value synchronous or async?
    results.failed; // did the tracked object reject or throw?
    results.error; // if failed, what was the error?
    results.value; // if succeeded, what was the resulting value?
    results.timedout; // Did the tracked value timeout (if a timeout was given)?

    // Once the tracked value is finished, the Tracker has all the same
    // fields set as well.
}
```

## Tracked Values

You can pass any of the following in as the first argument to the `track` function:

1. An async function (a function that returns a promise)
2. A synchronous function (a function that returns an immediate/non-promise value, or that synchronously throws an error)
3. A promise (or any other _thenable_)
4. An immediate (non-promise) value.

When a function is given (options 1 and 2), it is invoked synchronously inside the `track` function,
with any thrown errors being caught.

Options 2 and 4 are considered _synchronous_, while 1 and 3 are _asynchronous_.

Synchronous values are considered to be _finished_ immediately (i.e., by the time the `track` function returns).
If a synchronous function (option 2) throws an error, it is considered _failed_ with that _error_. Otherwise, its
_value_ is the value it returns. An immediate value (option 4) cannot fail, and it is considered to be its own _value_.

Asynchronous values are considered to be _finished_ when the promise settles (either fulfills or rejects). Either
async option is considered _failed_ if and only if the promise rejects, and its _error_ is whatever value it rejects
with. Otherwise, it's _value_ is whatever value it fulfills with.

## Fields

The following fields are available on the `Tracker` object returned by a call to `track`. Values that are set upon return from `track` may
subsequently change values for asynchronous tracked values. No additional changes will be made once `finished`
is set to `true`.

Values that are not set upon return from `track` are present but explicitly set to `undefined`.

All of these fields except for `finished` are also present on the object that the `Tracker` promise fulfills with
(finished is not needed because the fact that `Tracker` has fulfilled implies that it is finished).

| Field Name             | Set upon Return from `track` | Immediate Values | Synchronous Functions                        | Promises and Async Functions                                                |
| ---------------------- | ---------------------------- | ---------------- | -------------------------------------------- | --------------------------------------------------------------------------- |
| `finished`             | yes                          | always `true`    | always `true`                                | `false` until promise settles, then `true`                                  |
| `synchronous`          | yes                          | always `true`    | always `true`                                | always `false`                                                              |
| `value` †              | for synchronous only         | the value itself | the returned value                           | the value the promise fulfills with                                         |
| `error` ‡              | for synchronous only         | never set        | the thrown error                             | the value the promise rejects with                                          |
| `failed`               | for synchronous only         | always `true`    | `true` if function throws, otherwise `false` | `true` if the promise rejects, otherwise `false`                            |
| `timedout`<sup>§</sup> | for synchronous only         | always `false`   | always `false`                               | `true` if a timeout argument is given and the promise times out<sup>§</sup> |

† - Only given when `failed` is false, otherwise explicitly set to `undefined`. <br />
‡ - Only given when `failed` is true, otherwise explicitly set to `undefined`. <br />
§ - See "Timeouts" below for details.

## Timeouts

The optional second argument to the `track` function is a timeout, in milliseconds. Timeouts have the following
limitations:

1. Timeouts only apply to asynchronous tracked value (promises, and functions that return promises). Synchronous
   tracked values will never be marked as _timedout_, regardless of how long a synchronous function runs for.
2. Timeouts do not have any affect on already executing jobs: there is no cancel or abort or anything else.
3. There's no way to guarantee that the `Tracker` will settle within any finite amount of time.
4. There's no way to guarantee that the `track` function will return within any finite amount of time.

The last two limitations are a consequence of the JavaScript execution engine. In short: JavaScript is single
threaded and there is no pre-emption. The soonest any job can execute is when all jobs that already existed on
the queue have completed. If your asynchronus function pushes a long-running job to the job-queue, no other job
can run until this one has completed, including the promise-handler jobs that will settle the `Tracker` (hence point
3).

Additionally, the given function is actually executed synchronously inside the `track` invocation (that's the only
way we can know if it's going to return a promise or not). Thus even if it's an "asynchronous" function, but does
a lot of synchronous work before returning the promise, the `track` function won't continue or finish before your
function finishes its asynchronous work (hence point 4).

None of this should be too surprising if you're generally familiar with how timers work in JavaScript, and the
subtleties generally won't matter. For when they do, this is the general flow of the `track` function (the parts
relevant to timeout):

1. A timer `T` is started.
2. If the tracked value is a function, it's invoked synchronously
3. If the tracked value is a promise, or a function that returns a promise, onfulfill and onreject handlers are
   synchronously registered with it (by calling it's `then` method).
4. After timer `T` expires, it's callback will check if either promise handler has executed yet: if they have
   then the timer callback does nothing; if they have not then the timer fulfills the `Tracker` promise, marking it
   as a timeout.
5. When either promise handler is invoked, if the timer callback has already executed the
   handlers do nothing. Otherwise, the handler will cancel timer `T` and fulfill the `Tracker` promise appropriately
   (not as a timeout).
