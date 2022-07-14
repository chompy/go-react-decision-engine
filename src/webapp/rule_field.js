
export const RULE_FIELD_TEXT = 'text';
export const RULE_FIELD_NODE = 'node';
export const RULE_FIELD_ANSWER = 'answer';
export const RULE_FIELD_CHOICE = 'choice';

export default class RuleFormField {

    constructor(name) {
        this.name = name;
        this.type = RULE_FIELD_TEXT;
        this.default = null;
        this.rule = null;
        this.root = null;
        this.options = {};
    }

    getType() {
        if (!(this.type in [RULE_FIELD_NODE, RULE_FIELD_ANSWER, RULE_FIELD_CHOICE])) {
            return RULE_FIELD_TEXT;
        }
        return this.type;
    }

}