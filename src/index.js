const ExtrinsicPromise = require("extrinsic-promises");

/**
 * Call when the tracking is finished. This will set the status on the tracker and mark it as finished,
 * and copy the error into the "reason" field. It will also fulfill the tracker with the results.
 */
const complete = (p, tracker, timer) => {
    tracker.finished = true;
    tracker.status =
        tracker.failed || tracker.timedout ? "rejected" : "fulfilled";
    tracker.reason = tracker.error;
    p.fulfill({
        status: tracker.status,
        failed: tracker.failed,
        timedout: tracker.timedout,
        synchronous: tracker.synchronous,
        error: tracker.error,
        reason: tracker.reason,
        value: tracker.value
    });
    if (timer) {
        clearTimeout(timer);
    }
    return tracker;
};

const TIMEOUT = Symbol("timeout");

/**
 * @typedef {object} TrackedResult<T>
 * @typeparam T The type of value being tracked.
 * @property {true} finished
 * @property {boolean} synchronous
 * @property {boolean} failed
 * @property {boolean} timedout
 * @property {"fulfilled"|"rejected"} status Indicates as a string constant whether this was a success or failure, aligned with the Promise.allSettled interface.
 * @property {T|undefined} value The value that the tracked promise fulfilled with, or the tracked function returned, or the tracked immediate value itself.
 * @property {Error|undefined} reason The error that the tracked promise rejected with, or the tracked function threw.
 * @property {Error|undefined} error This is perhaps deprecated; to align with the Promise.allSettled interface, use `reason` instead.
 */

/**
 * The value returned by the {@link track} function contains some information about the value being tracked, but also acts as promise which will fulfill
 * with a {@link TrackedResult} whenever the tracking is complete.
 * @typedef {object} Tracker<T>
 * @typeparam T The type of value being tracked.
 * @property {(onFulfill: (TrackedResult<T>) => (K|Promise<K>), onReject?: (Error) => (K|Promise<K>)) => Promise<K>} then The handler-register for this promise.
 * @property {boolean} finished
 * @property {boolean} synchronous
 * @property {boolean|undefined} failed
 * @property {boolean|undefined} timedout
 * @property {"fulfilled"|"rejected"} status Indicates as a string constant whether this was a success or failure, aligned with the Promise.allSettled interface.
 * @property {T|undefined} value The value that the tracked promise fulfilled with, or the tracked function returned, or the tracked immediate value itself.
 * @property {Error|undefined} reason The error that the tracked promise rejected with, or the tracked function threw.
 * @property {Error|undefined} error This is perhaps deprecated; to align with the Promise.allSettled interface, use `reason` instead.
 */

/**
 *
 * @param {Promise<T>|T|() => Promise<T>|() => T} what The thing to track. Either a promise or an immediate value,
 * or a function that returns either of those.
 * @param {number?} [timeout] Optionally specify a timeout in milliseconds.
 *
 * @returns {Tracker<T>}
 */
function track(what, timeout) {
    const p = new ExtrinsicPromise();
    const tracker = p.hide();
    tracker.finished = false;
    tracker.value = undefined;
    tracker.reason = undefined;
    tracker.error = undefined;
    tracker.failed = undefined;
    tracker.timedout = undefined;
    let syncReturn;
    const race = new ExtrinsicPromise();
    let timer =
        timeout == null
            ? null
            : setTimeout(() => {
                  timer = null;
                  race.fulfill(TIMEOUT);
              }, timeout);
    try {
        syncReturn = typeof what === "function" ? what() : what;
    } catch (syncError) {
        tracker.failed = true;
        tracker.synchronous = true;
        tracker.error = syncError;
        tracker.timedout = false;
        return complete(p, tracker, timer);
    }
    if (
        syncReturn === null ||
        typeof syncReturn === "undefined" ||
        typeof syncReturn.then !== "function"
    ) {
        tracker.failed = false;
        tracker.synchronous = true;
        tracker.value = syncReturn;
        tracker.timedout = false;
        return complete(p, tracker, timer);
    } else {
        tracker.synchronous = false;
        const returnedPromise = syncReturn;
        const promise =
            timeout == null
                ? returnedPromise
                : returnedPromise
                      .then(race.fulfill, race.reject)
                      .then(() => race);
        try {
            promise.then(
                fulfillValue => {
                    if (fulfillValue === TIMEOUT) {
                        tracker.failed = undefined;
                        tracker.timedout = true;
                    } else {
                        tracker.failed = false;
                        tracker.timedout = false;
                        tracker.value = fulfillValue;
                    }
                    complete(p, tracker, timer);
                    return null;
                },
                reason => {
                    tracker.failed = true;
                    tracker.timedout = false;
                    tracker.error = reason;
                    complete(p, tracker, timer);
                    return null;
                }
            );
        } catch (error) {
            const customError = new Error(
                `Returned value looked like a thennable, but threw the following error when registering handlers: ${error.message ||
                    error}`
            );
            customError.name = "InvalidThennableError";
            customError.cause = error;
            throw customError;
        }
        return tracker;
    }
}

module.exports = track;
