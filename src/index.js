const ExtrinsicPromise = require("extrinsic-promises");

const complete = (p, tracker) => {
    tracker.finished = true;
    p.fulfill({
        failed: tracker.failed,
        synchronous: tracker.synchronous,
        error: tracker.error,
        value: tracker.value
    });
    return tracker;
};

module.exports = function track(what) {
    const p = new ExtrinsicPromise();
    const tracker = p.hide();
    tracker.finished = false;
    tracker.value = undefined;
    tracker.error = undefined;
    tracker.failed = undefined;
    let syncReturn;
    try {
        syncReturn = typeof what === "function" ? what() : what;
    } catch (syncError) {
        tracker.failed = true;
        tracker.synchronous = true;
        tracker.error = syncError;
        return complete(p, tracker);
    }
    if (
        syncReturn === null ||
        typeof syncReturn === "undefined" ||
        typeof syncReturn.then !== "function"
    ) {
        tracker.failed = false;
        tracker.synchronous = true;
        tracker.value = syncReturn;
        return complete(p, tracker);
    } else {
        tracker.synchronous = false;
        try {
            syncReturn.then(
                fulfillValue => {
                    tracker.failed = false;
                    tracker.value = fulfillValue;
                    complete(p, tracker);
                    return null;
                },
                reason => {
                    tracker.failed = true;
                    tracker.error = reason;
                    complete(p, tracker);
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
};
