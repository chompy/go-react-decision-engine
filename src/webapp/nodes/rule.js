import BaseNode from './base.js';

export const RULE_TYPE_VISIBILITY = 'visibility';
export const RULE_TYPE_VALIDATION = 'validation';

export default class RuleNode extends BaseNode {

    constructor(uid) {
        super(uid);
        this.type = RULE_TYPE_VISIBILITY;
        this.script = '';
        this.scriptFieldValues = {};
    }

    /**
     * @inheritdoc
     */
    static getTypeName() {
        return 'rule';
    }

    /**
     * @inheritdoc
     */
    getData() {
        return {
            'type' : this.type,
            'script' : this.script            
        };
    }
    
    /**
     * @inheritdoc
     */
    builderFields() {
        let out = [
            ['label', 'Label', 'text'],
            ['script', 'Template', 'code'],
        ];
        return out;
    }

    /**
     * Get Lua script to use to evaluate this rule.
     * @returns {string}
     */
    getScript() {
        try {
            let scriptData = JSON.parse(this.script);
            return scriptData.value.trim();
        } catch {}
        return this.script.trim();
    }

    /**
     * @returns {Object}
     */
    getRuleFieldValues() {
        try {
            let scriptData = JSON.parse(this.script);
            console.log(scriptData);
            return scriptData.fields;
        } catch {}
        return {};
    }

}
