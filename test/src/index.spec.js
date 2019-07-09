/* eslint-env mocha */
/* eslint no-unused-expressions:0 */

// Module under test
const track = require("../../src/index");

// Support

// assertions library
const chai = require("chai");
chai.use(require("chai-as-promised"));

class SubjectExpectations {
    constructor(subject) {
        Object.defineProperty(this, "expect", {
            get() {
                return chai.expect(subject);
            }
        });
    }

    toBeFinished() {
        this.expect.to.haveOwnProperty("finished").which.is.true;
        return this;
    }

    toNotBeFinished() {
        this.expect.to.haveOwnProperty("finished").which.is.false;
        return this;
    }

    toHaveSucceeded() {
        this.expect.to.haveOwnProperty("failed").which.is.false;
        return this;
    }

    toHaveFailed() {
        this.expect.to.haveOwnProperty("failed").which.is.true;
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
        return this;
    }

    toHaveErrorUndefined() {
        this.expect.to.haveOwnProperty("error").which.is.undefined;
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
            });

            it("should have tracker fields set as expected upon settling", async () => {
                const { expect, tracker, testValue } = setup();
                await tracker;
                expect.tracker.toBeFinished();
                expect.tracker.toHaveSucceeded();
                expect.tracker.toBeSynchronous();
                expect.tracker.valueToBe(testValue);
                expect.tracker.toHaveErrorUndefined();
            });

            it("should fulfill to a result object with fields as expected", async () => {
                const { expect, testValue } = setup();
                await expect.withResult(expectResult => {
                    expectResult.toHaveSucceeded();
                    expectResult.toBeSynchronous();
                    expectResult.valueToBe(testValue);
                    expectResult.toHaveErrorUndefined();
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
                const { expect, testValue } = setup();
                expect.tracker.toNotBeFinished();
                expect.tracker.toHaveFailedUndefined();
                expect.tracker.toNotBeSynchronous();
                expect.tracker.toHaveValueUndefined(testValue);
                expect.tracker.toHaveErrorUndefined();
            });

            it("should have tracker fields set as expected upon settling", async () => {
                const { expect, tracker, testValue } = setup();
                await tracker;
                expect.tracker.toBeFinished();
                expect.tracker.toHaveSucceeded();
                expect.tracker.toNotBeSynchronous();
                expect.tracker.valueToBe(testValue);
                expect.tracker.toHaveErrorUndefined();
            });

            it("should fulfill to a result object with fields as expected", async () => {
                const { expect, testValue } = setup();
                await expect.withResult(expectResult => {
                    expectResult.toHaveSucceeded();
                    expectResult.toNotBeSynchronous();
                    expectResult.valueToBe(testValue);
                    expectResult.toHaveErrorUndefined();
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
        });

        it("should have tracker fields set as expected upon settling", async () => {
            const { expect, tracker, testError } = setup();
            await tracker;
            expect.tracker.toBeFinished();
            expect.tracker.toHaveFailed();
            expect.tracker.toBeSynchronous();
            expect.tracker.toHaveValueUndefined();
            expect.tracker.errorToBe(testError);
        });

        it("should fulfill to a result object with fields as expected", async () => {
            const { expect, testError } = setup();
            await expect.withResult(expectResult => {
                expectResult.toHaveFailed();
                expectResult.toBeSynchronous();
                expectResult.toHaveValueUndefined();
                expectResult.errorToBe(testError);
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
                const { expect, testValue } = setup();
                expect.tracker.toNotBeFinished();
                expect.tracker.toHaveFailedUndefined();
                expect.tracker.toNotBeSynchronous();
                expect.tracker.toHaveValueUndefined(testValue);
                expect.tracker.toHaveErrorUndefined();
            });

            it("should have tracker fields set as expected upon settling", async () => {
                const { expect, tracker, testError } = setup();
                await tracker;
                expect.tracker.toBeFinished();
                expect.tracker.toHaveFailed();
                expect.tracker.toNotBeSynchronous();
                expect.tracker.toHaveValueUndefined();
                expect.tracker.errorToBe(testError);
            });

            it("should fulfill to a result object with fields as expected", async () => {
                const { expect, testError } = setup();
                await expect.withResult(expectResult => {
                    expectResult.toHaveFailed();
                    expectResult.toNotBeSynchronous();
                    expectResult.toHaveValueUndefined();
                    expectResult.errorToBe(testError);
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
});
