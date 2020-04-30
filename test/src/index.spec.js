/* eslint-env mocha */
/* eslint no-unused-expressions:0 */

// Module under test
const track = require("../../src/index");

// Support
const bluebird = require("bluebird");

// assertions library
const chai = require("chai");
chai.use(require("chai-as-promised"));

// Mocking library
const sinon = require("sinon");

class SubjectExpectations {
    constructor(subject) {
        this.tracker = subject;
        Object.defineProperty(this, "expect", {
            get() {
                return chai.expect(subject);
            }
        });
    }

    toBeFinished() {
        this.expect.to.haveOwnProperty("finished").which.is.true;
        this.expect.to.haveOwnProperty("status");
        return this;
    }

    toBeTimedout() {
        this.expect.to.haveOwnProperty("timedout").which.is.true;
        return this;
    }

    toNotBeTimedout() {
        this.expect.to.haveOwnProperty("timedout").which.is.false;
        return this;
    }

    toHaveTimedoutUndefined() {
        this.expect.to.haveOwnProperty("timedout").which.is.undefined;
        return this;
    }

    toNotBeFinished() {
        this.expect.to.haveOwnProperty("finished").which.is.false;
        this.expect.to.not.haveOwnProperty("status");
        return this;
    }

    toHaveSucceeded() {
        this.expect.to.haveOwnProperty("failed").which.is.false;
        this.expect.to.haveOwnProperty("status").which.equals("fulfilled");
        this.expect.to.haveOwnProperty("value");
        return this;
    }

    toHaveFailed() {
        this.expect.to.haveOwnProperty("failed").which.is.true;
        this.expect.to.haveOwnProperty("status").which.equals("rejected");
        this.expect.to
            .haveOwnProperty("reason")
            .which.deep.equals(this.tracker.error);
        this.expect.to
            .haveOwnProperty("error")
            .which.deep.equals(this.tracker.reason);
        return this;
    }

    toHaveFailedUndefined() {
        this.expect.to.haveOwnProperty("failed").which.is.undefined;
        return this;
    }

    toBeSynchronous() {
        this.expect.to.haveOwnProperty("synchronous").which.is.true;
        return this;
    }

    toNotBeSynchronous() {
        this.expect.to.haveOwnProperty("synchronous").which.is.false;
        return this;
    }

    valueToBe(testValue) {
        this.expect.to
            .haveOwnProperty("value")
            .which.satisfies(val => Object.is(val, testValue));
        return this;
    }

    toHaveValueUndefined() {
        this.expect.to.haveOwnProperty("value").which.is.undefined;
        return this;
    }

    errorToBe(testError) {
        this.expect.to
            .haveOwnProperty("error")
            .which.satisfies(val => Object.is(val, testError));
        this.expect.to
            .haveOwnProperty("reason")
            .which.satisfies(val => Object.is(val, testError));
        return this;
    }

    toHaveErrorUndefined() {
        this.expect.to.haveOwnProperty("error").which.is.undefined;
        this.expect.to.haveOwnProperty("reason").which.is.undefined;
        return this;
    }
}

class Expectations {
    constructor(given) {
        this.tracker = new SubjectExpectations(given.tracker);
        this.withResult = async func => {
            const result = await given.tracker;
            func(new SubjectExpectations(result));
        };
    }
}

describe("tracking-promise", () => {
    [
        [
            "with a function that returns synchronously",
            testValue => () => testValue
        ],
        ["with a non-promise non-function value", testValue => testValue]
    ].forEach(([desc, getTracked]) => {
        describe(desc, async () => {
            function setup() {
                const testValue = {};
                const tracker = track(getTracked(testValue));
                const expect = new Expectations({
                    tracker
                });
                return {
                    testValue,
                    tracker,
                    expect
                };
            }

            it("should have tracker fields set as expected upon returning synchronously from track function", () => {
                const { expect, testValue } = setup();
                expect.tracker.toBeFinished();
                expect.tracker.toHaveSucceeded();
                expect.tracker.toBeSynchronous();
                expect.tracker.valueToBe(testValue);
                expect.tracker.toHaveErrorUndefined();
                expect.tracker.toNotBeTimedout();
            });

            it("should have tracker fields set as expected upon settling", async () => {
                const { expect, tracker, testValue } = setup();
                await tracker;
                expect.tracker.toBeFinished();
                expect.tracker.toHaveSucceeded();
                expect.tracker.toBeSynchronous();
                expect.tracker.valueToBe(testValue);
                expect.tracker.toHaveErrorUndefined();
                expect.tracker.toNotBeTimedout();
            });

            it("should fulfill to a result object with fields as expected", async () => {
                const { expect, testValue } = setup();
                await expect.withResult(expectResult => {
                    expectResult.toHaveSucceeded();
                    expectResult.toBeSynchronous();
                    expectResult.valueToBe(testValue);
                    expectResult.toHaveErrorUndefined();
                    expectResult.toNotBeTimedout();
                });
            });
        });
    });

    [
        [
            "with a function that returns a promise that fulfills",
            testValue => () => Promise.resolve(testValue)
        ],
        [
            "with a promise that fulfills",
            testValue => Promise.resolve(testValue)
        ]
    ].forEach(([desc, getTracked]) => {
        describe(desc, async () => {
            function setup() {
                const testValue = {};
                const tracker = track(getTracked(testValue));
                const expect = new Expectations({
                    tracker
                });
                return {
                    testValue,
                    tracker,
                    expect
                };
            }

            it("should have tracker fields set as expected upon returning synchronously from track function", () => {
                const { expect } = setup();
                expect.tracker.toNotBeFinished();
                expect.tracker.toHaveFailedUndefined();
                expect.tracker.toNotBeSynchronous();
                expect.tracker.toHaveValueUndefined();
                expect.tracker.toHaveErrorUndefined();
                expect.tracker.toHaveTimedoutUndefined();
            });

            it("should have tracker fields set as expected upon settling", async () => {
                const { expect, tracker, testValue } = setup();
                await tracker;
                expect.tracker.toBeFinished();
                expect.tracker.toHaveSucceeded();
                expect.tracker.toNotBeSynchronous();
                expect.tracker.valueToBe(testValue);
                expect.tracker.toHaveErrorUndefined();
                expect.tracker.toNotBeTimedout();
            });

            it("should fulfill to a result object with fields as expected", async () => {
                const { expect, testValue } = setup();
                await expect.withResult(expectResult => {
                    expectResult.toHaveSucceeded();
                    expectResult.toNotBeSynchronous();
                    expectResult.valueToBe(testValue);
                    expectResult.toHaveErrorUndefined();
                    expectResult.toNotBeTimedout();
                });
            });
        });
    });

    describe("with a function that throws synchronously", async () => {
        function setup() {
            const testError = new Error("test-error");
            const tracker = track(() => {
                throw testError;
            });
            const expect = new Expectations({
                tracker
            });
            return {
                testError,
                tracker,
                expect
            };
        }

        it("should have tracker fields set as expected upon returning synchronously from track function", () => {
            const { expect, testError } = setup();
            expect.tracker.toBeFinished();
            expect.tracker.toHaveFailed();
            expect.tracker.toBeSynchronous();
            expect.tracker.toHaveValueUndefined();
            expect.tracker.errorToBe(testError);
            expect.tracker.toNotBeTimedout();
        });

        it("should have tracker fields set as expected upon settling", async () => {
            const { expect, tracker, testError } = setup();
            await tracker;
            expect.tracker.toBeFinished();
            expect.tracker.toHaveFailed();
            expect.tracker.toBeSynchronous();
            expect.tracker.toHaveValueUndefined();
            expect.tracker.errorToBe(testError);
            expect.tracker.toNotBeTimedout();
        });

        it("should fulfill to a result object with fields as expected", async () => {
            const { expect, testError } = setup();
            await expect.withResult(expectResult => {
                expectResult.toHaveFailed();
                expectResult.toBeSynchronous();
                expectResult.toHaveValueUndefined();
                expectResult.errorToBe(testError);
                expectResult.toNotBeTimedout();
            });
        });
    });

    [
        [
            "with a function that returns a promise that rejects",
            testError => () => Promise.reject(testError)
        ],
        ["with a promise that rejects", testError => Promise.reject(testError)]
    ].forEach(([desc, getTracked]) => {
        describe(desc, async () => {
            function setup() {
                const testError = new Error("test-error");
                const tracker = track(getTracked(testError));
                const expect = new Expectations({
                    tracker
                });
                return {
                    testError,
                    tracker,
                    expect
                };
            }

            it("should have tracker fields set as expected upon returning synchronously from track function", () => {
                const { expect } = setup();
                expect.tracker.toNotBeFinished();
                expect.tracker.toHaveFailedUndefined();
                expect.tracker.toNotBeSynchronous();
                expect.tracker.toHaveValueUndefined();
                expect.tracker.toHaveErrorUndefined();
                expect.tracker.toHaveTimedoutUndefined();
            });

            it("should have tracker fields set as expected upon settling", async () => {
                const { expect, tracker, testError } = setup();
                await tracker;
                expect.tracker.toBeFinished();
                expect.tracker.toHaveFailed();
                expect.tracker.toNotBeSynchronous();
                expect.tracker.toHaveValueUndefined();
                expect.tracker.errorToBe(testError);
                expect.tracker.toNotBeTimedout();
            });

            it("should fulfill to a result object with fields as expected", async () => {
                const { expect, testError } = setup();
                await expect.withResult(expectResult => {
                    expectResult.toHaveFailed();
                    expectResult.toNotBeSynchronous();
                    expectResult.toHaveValueUndefined();
                    expectResult.errorToBe(testError);
                    expectResult.toNotBeTimedout();
                });
            });
        });
    });

    [
        [
            "when tracking a promise that fulfills after the given timeout",
            delay => new Promise(resolve => setTimeout(resolve, delay))
        ],
        [
            "when tracking a promise that rejects after the given timeout",
            delay => {
                return new Promise((resolve, reject) =>
                    setTimeout(() => {
                        reject(new Error("test-delayed-error"));
                    }, delay)
                );
            }
        ]
    ].forEach(([desc, getTracked]) => {
        describe(desc, () => {
            let clock;

            beforeEach(() => {
                clock = null;
            });

            afterEach(() => {
                if (clock) {
                    clock.restore();
                }
            });

            function setup() {
                const TIMEOUT = 1;
                const DELAY = TIMEOUT + 1;
                const tracker = track(getTracked(DELAY), TIMEOUT);
                const expect = new Expectations({
                    tracker
                });
                return {
                    tracker,
                    expect,
                    advancePastTimeout: () => {
                        clock.tick(TIMEOUT);
                        clock.next();
                    },
                    advancePastDelay: () => {
                        clock.tick(DELAY);
                        clock.next();
                    },
                    wait: async () => {
                        const p = new Promise(resolve => setImmediate(resolve));
                        if (clock) {
                            clock.runAll();
                        }
                        return p;
                    }
                };
            }

            it("should have tracker fields set as expected upon returning synchronously from track function", () => {
                const { expect } = setup();
                expect.tracker.toNotBeFinished();
                expect.tracker.toHaveFailedUndefined();
                expect.tracker.toNotBeSynchronous();
                expect.tracker.toHaveValueUndefined();
                expect.tracker.toHaveErrorUndefined();
                expect.tracker.toHaveTimedoutUndefined();
            });

            it("should have tracker fields set as expected upon settling", async () => {
                clock = sinon.useFakeTimers();
                const {
                    expect,
                    tracker,
                    wait,
                    advancePastDelay,
                    advancePastTimeout
                } = setup();
                const verify = () => {
                    expect.tracker.toBeFinished();
                    expect.tracker.toHaveFailedUndefined();
                    expect.tracker.toNotBeSynchronous();
                    expect.tracker.toHaveValueUndefined();
                    expect.tracker.toHaveErrorUndefined();
                    expect.tracker.toBeTimedout();
                };
                advancePastTimeout();
                await tracker;
                verify();
                advancePastDelay();
                await wait();
                verify();
            });

            it("should fulfill to a result object with fields as expected", async () => {
                clock = sinon.useFakeTimers();
                const {
                    expect,
                    wait,
                    advancePastDelay,
                    advancePastTimeout
                } = setup();
                advancePastTimeout();
                await expect.withResult(async expectResult => {
                    const verify = () => {
                        expectResult.toHaveFailedUndefined();
                        expectResult.toNotBeSynchronous();
                        expectResult.toHaveValueUndefined();
                        expectResult.toHaveErrorUndefined();
                        expectResult.toBeTimedout();
                    };
                    verify();
                    advancePastDelay();
                    await wait();
                    verify();
                });
            });
        });
    });

    [
        [
            "when tracking a function that returns a thennable that throws on registration",
            testError => () => ({
                then() {
                    throw testError;
                }
            })
        ],
        [
            "when tracking a thennable that throws on registration",
            testError => ({
                then() {
                    throw testError;
                }
            })
        ]
    ].forEach(([desc, getTracked]) => {
        describe(desc, () => {
            it("should throw synchronously", () => {
                const testError = new Error("test-error");
                chai.expect(() => track(getTracked(testError))).to.throw;
            });

            it("should throw an error with name InvalidThennableError", () => {
                const testError = new Error("test-error");
                try {
                    track(getTracked(testError));
                } catch (error) {
                    chai.expect(error)
                        .to.haveOwnProperty("name")
                        .which.equals("InvalidThennableError");
                    return;
                }
                throw new Error("Should have thrown an error");
            });

            it("should throw an error with the cause set to the error thrown by the thennable", () => {
                const testError = new Error("test-error");
                try {
                    track(getTracked(testError));
                } catch (error) {
                    chai.expect(error)
                        .to.haveOwnProperty("cause")
                        .which.satisfies(val => Object.is(val, testError));
                    return;
                }
                throw new Error("Should have thrown an error");
            });
        });
    });

    describe("with long-running asynchronous jobs", () => {
        let clock;

        beforeEach(() => {
            clock = null;
        });

        afterEach(() => {
            if (clock) {
                clock.restore();
            }
        });

        [
            ["builtin promises", Promise],
            ["bluebird promises", bluebird]
        ].forEach(([desc, P]) => {
            [
                ["fulfills", resolve => resolve],
                ["rejects", (resolve, reject) => reject]
            ].forEach(([action, getSettler]) => {
                it(`should timeout as expected when the promise ${action} using ${desc}`, async () => {
                    clock = sinon.useFakeTimers();
                    const TIMEOUT = 1;
                    const DELAY = TIMEOUT + 1;
                    const tracked = () => {
                        return new P((resolve, reject) => {
                            clock.tick(DELAY);
                            getSettler(resolve, reject)("test-value");
                        });
                    };
                    const tracker = track(tracked, TIMEOUT);
                    await tracker;
                    chai.expect(tracker.timedout).to.be.true;
                });
            });
        });
    });
});
