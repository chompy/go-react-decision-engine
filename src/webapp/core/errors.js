// @see https://stackoverflow.com/a/27724419/3993829
class BaseException {
    constructor(message) {
        this.message = message;
        // Use V8's native method if available, otherwise fallback
        if ('captureStackTrace' in Error) {
            Error.captureStackTrace(this, BaseException);
        } else {
            this.stack = (new Error()).stack;
        }
    }
    toString() {
        return this.constructor.name + ': ' + this.message;
    }
}
//BaseException.prototype = Object.create(Error.prototype);
//BaseException.prototype.name = 'BaseException';
//BaseException.prototype.constructor = BaseException;

export default class InvalidArgumentException extends BaseException {}
//InvalidArgumentException.prototype = Object.create(Error.prototype);
//InvalidArgumentException.prototype.name = 'InvalidArgumentException';
//InvalidArgumentException.prototype.constructor = InvalidArgumentException;

export class InvalidStateException extends BaseException {}
//InvalidStateException.prototype = Object.create(Error.prototype);
//InvalidStateException.prototype.name = 'InvalidStateException';
//InvalidStateException.prototype.constructor = InvalidStateException;

export class RuleConditionParseException extends BaseException {}
