export default class RuleError {

    constructor(errorNumber, message, rule) {
        this.errorNumber = errorNumber;
        this.message = message;
        this.rule = rule;
    }

    toString() {
        let message = this.message;
        if (!this.message) {
            message = '(no message)';
        }
        return '-ERROR-\n\nERROR NO:\n' + this.errorNumber + '\n\nMESSAGE:\n' + message;
    }

}