/* eslint-env mocha */
/* eslint no-unused-expressions:0 */

// Module under test
const track = require("../../src/index");

// Support

// Your own custom test utilities.
// const testUtils = require("../test-utils");

// assertions library
const chai = require("chai");
const { expect } = chai;
chai.use(require("chai-as-promised"));

// mocks and stubs
// const sinon = require("sinon");

// chai plugin for assertino on sinon stuff
// const sinonChai = require("sinon-chai");
// chai.use(sinonChai);

describe("tracking-promise", () => {
    it("with a function that returns synchronously", async () => {
        const testValue = {};
        const tracker = track(() => testValue);

        expect(
            tracker,
            "expect tracker fields to be set upon return"
        ).to.include({
            finished: true,
            failed: false,
            synchronous: true,
            value: testValue
        });

        expect(
            tracker.value,
            "expect tracker.value to be identical to the returned value"
        ).to.satisfy(val => Object.is(val, testValue));

        expect(tracker.error, "expect tracker.error to be undefined").to.be
            .undefined;

        const result = await tracker;
        expect(
            result,
            "expect tracker to be a promise that fulfills with the expected object"
        ).to.deep.equal({
            failed: false,
            synchronous: true,
            error: undefined,
            value: testValue
        });

        expect(
            result.value,
            "expect result.value to be identical to the returned value"
        ).to.satisfy(val => Object.is(val, testValue));
    });

    it("with a function that throws synchronously", async () => {
        const testError = new Error("test error");
        const tracker = track(() => {
            throw testError;
        });

        expect(
            tracker,
            "expect tracker fields to be set upon return"
        ).to.include({
            finished: true,
            failed: true,
            synchronous: true,
            error: testError
        });

        expect(
            tracker.error,
            "expect tracker.error to be identical to the thrown error"
        ).to.satisfy(val => Object.is(val, testError));

        expect(tracker.value, "expect tracker.value to be undefined").to.be
            .undefined;

        const result = await tracker;
        expect(
            result,
            "expect tracker to be a promise that fulfills with the expected object"
        ).to.deep.equal({
            failed: true,
            synchronous: true,
            error: testError,
            value: undefined
        });

        expect(
            result.error,
            "expect result.error to be identical to the thrown error"
        ).to.satisfy(val => Object.is(val, testError));
    });

    it("with a function that returns a promise that fulfills", async () => {
        const testValue = {};
        const tracker = track(() => Promise.resolve(testValue));

        expect(
            tracker,
            "expect tracker.finished to be false upon return"
        ).to.haveOwnProperty("finished").that.is.false;

        expect(
            tracker,
            "expect tracker's synchronous field to be set upon return"
        ).to.haveOwnProperty("synchronous").that.is.false;

        expect(
            tracker.failed,
            "expect tracker's failed field is not set upon return"
        ).to.be.undefined;

        expect(
            tracker.value,
            "expect tracker's value field is not set upon return"
        ).to.be.undefined;

        expect(
            tracker.error,
            "expect tracker's error field is not set upon return"
        ).to.be.undefined;

        const result = await tracker;

        expect(
            tracker,
            "expect tracker fields to be set upon settling"
        ).to.include({
            finished: true,
            failed: false,
            synchronous: false,
            value: testValue
        });

        expect(
            tracker.value,
            "expect tracker.value to be identical to the returned value"
        ).to.satisfy(val => Object.is(val, testValue));

        expect(tracker.error, "expect tracker.error to be undefined").to.be
            .undefined;

        expect(
            result,
            "expect tracker to be a promise that fulfills with the expected object"
        ).to.deep.equal({
            failed: false,
            synchronous: false,
            error: undefined,
            value: testValue
        });

        expect(
            result.value,
            "expect result.value to be identical to the returned value"
        ).to.satisfy(val => Object.is(val, testValue));
    });

    it("with a function that returns a promise that rejects", async () => {
        const testError = new Error("test error");
        const tracker = track(() => Promise.reject(testError));

        expect(
            tracker,
            "expect tracker.finished to be false upon return"
        ).to.haveOwnProperty("finished").that.is.false;

        expect(
            tracker,
            "expect tracker's synchronous field to be set upon return"
        ).to.haveOwnProperty("synchronous").that.is.false;

        expect(
            tracker.failed,
            "expect tracker's failed field is not set upon return"
        ).to.be.undefined;

        expect(
            tracker.value,
            "expect tracker's value field is not set upon return"
        ).to.be.undefined;

        expect(
            tracker.error,
            "expect tracker's error field is not set upon return"
        ).to.be.undefined;

        const result = await tracker;

        expect(
            tracker,
            "expect tracker fields to be set upon settling"
        ).to.include({
            finished: true,
            failed: true,
            synchronous: false,
            error: testError
        });

        expect(
            tracker.error,
            "expect tracker.error to be identical to the thrown error"
        ).to.satisfy(val => Object.is(val, testError));

        expect(tracker.value, "expect tracker.value to be undefined").to.be
            .undefined;

        expect(
            result,
            "expect tracker to be a promise that fulfills with the expected object"
        ).to.deep.equal({
            failed: true,
            synchronous: false,
            error: testError,
            value: undefined
        });

        expect(
            result.error,
            "expect result.error to be identical to the thrown error"
        ).to.satisfy(val => Object.is(val, testError));
    });

    it("with a non-promise value", async () => {
        const testValue = {};
        const tracker = track(testValue);

        expect(
            tracker,
            "expect tracker fields to be set upon return"
        ).to.include({
            finished: true,
            failed: false,
            synchronous: true,
            value: testValue
        });

        expect(
            tracker.value,
            "expect tracker.value to be identical to the returned value"
        ).to.satisfy(val => Object.is(val, testValue));

        expect(tracker.error, "expect tracker.error to be undefined").to.be
            .undefined;

        const result = await tracker;
        expect(
            result,
            "expect tracker to be a promise that fulfills with the expected object"
        ).to.deep.equal({
            failed: false,
            synchronous: true,
            error: undefined,
            value: testValue
        });

        expect(
            result.value,
            "expect result.value to be identical to the returned value"
        ).to.satisfy(val => Object.is(val, testValue));
    });

    it("with a promise that fulfills", async () => {
        const testValue = {};
        const tracker = track(Promise.resolve(testValue));

        expect(
            tracker,
            "expect tracker.finished to be false upon return"
        ).to.haveOwnProperty("finished").that.is.false;

        expect(
            tracker,
            "expect tracker's synchronous field to be set upon return"
        ).to.haveOwnProperty("synchronous").that.is.false;

        expect(
            tracker.failed,
            "expect tracker's failed field is not set upon return"
        ).to.be.undefined;

        expect(
            tracker.value,
            "expect tracker's value field is not set upon return"
        ).to.be.undefined;

        expect(
            tracker.error,
            "expect tracker's error field is not set upon return"
        ).to.be.undefined;

        const result = await tracker;

        expect(
            tracker,
            "expect tracker fields to be set upon settling"
        ).to.include({
            finished: true,
            failed: false,
            synchronous: false,
            value: testValue
        });

        expect(
            tracker.value,
            "expect tracker.value to be identical to the returned value"
        ).to.satisfy(val => Object.is(val, testValue));

        expect(tracker.error, "expect tracker.error to be undefined").to.be
            .undefined;

        expect(
            result,
            "expect tracker to be a promise that fulfills with the expected object"
        ).to.deep.equal({
            failed: false,
            synchronous: false,
            error: undefined,
            value: testValue
        });

        expect(
            result.value,
            "expect result.value to be identical to the returned value"
        ).to.satisfy(val => Object.is(val, testValue));
    });

    it("with a promise that rejects", async () => {
        const testError = new Error("test error");
        const tracker = track(Promise.reject(testError));

        expect(
            tracker,
            "expect tracker.finished to be false upon return"
        ).to.haveOwnProperty("finished").that.is.false;

        expect(
            tracker,
            "expect tracker's synchronous field to be set upon return"
        ).to.haveOwnProperty("synchronous").that.is.false;

        expect(
            tracker.failed,
            "expect tracker's failed field is not set upon return"
        ).to.be.undefined;

        expect(
            tracker.value,
            "expect tracker's value field is not set upon return"
        ).to.be.undefined;

        expect(
            tracker.error,
            "expect tracker's error field is not set upon return"
        ).to.be.undefined;

        const result = await tracker;

        expect(
            tracker,
            "expect tracker fields to be set upon settling"
        ).to.include({
            finished: true,
            failed: true,
            synchronous: false,
            error: testError
        });

        expect(
            tracker.error,
            "expect tracker.error to be identical to the thrown error"
        ).to.satisfy(val => Object.is(val, testError));

        expect(tracker.value, "expect tracker.value to be undefined").to.be
            .undefined;

        expect(
            result,
            "expect tracker to be a promise that fulfills with the expected object"
        ).to.deep.equal({
            failed: true,
            synchronous: false,
            error: testError,
            value: undefined
        });

        expect(
            result.error,
            "expect result.error to be identical to the thrown error"
        ).to.satisfy(val => Object.is(val, testError));
    });

    it("with a thenable that throws on registration", async () => {
        const testError = new Error("test error");
        const badThenable = {
            then: () => {
                throw testError;
            }
        };

        try {
            track(badThenable);
        } catch (error) {
            expect(error)
                .to.haveOwnProperty("cause")
                .that.satisfies(cause => Object.is(cause, testError));
            return;
        }
        throw new Error("Expected track to throw");
    });

    it("with a function that returns a thenable that throws on registration", async () => {
        const testError = new Error("test error");
        const badThenable = {
            then: () => {
                throw testError;
            }
        };

        try {
            track(() => badThenable);
        } catch (error) {
            expect(error)
                .to.haveOwnProperty("cause")
                .that.satisfies(cause => Object.is(cause, testError));
            return;
        }
        throw new Error("Expected track to throw");
    });

    it("with a thenable that does not return a thenable on registration");
    it(
        "with a function that returns a thenable that does not return a thenable registration"
    );
});
