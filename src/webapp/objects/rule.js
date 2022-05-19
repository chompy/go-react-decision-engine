import BaseNode, { KEY_DATA } from './base.js';

export const RULE_TYPE_VISIBILITY = 'visibility';
export const RULE_TYPE_VALIDATION = 'validation';

export default class RuleNode extends BaseNode {

    constructor(uid) {
        super(uid);
        this.label = '';
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
    exportJSON() {
        let out = super.exportJSON();
        out[KEY_DATA] = {
            'type' : this.type,
            'label' : this.label,
            'script' : this.script
        };
        return out;
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
            return scriptData.fields;
        } catch {}
        return {};
    }

}
