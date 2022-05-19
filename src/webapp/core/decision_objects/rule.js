import DecisionBase from './base.js';

export const RULE_TYPE_VISIBILITY = 'visibility';
export const RULE_TYPE_VALIDATION = 'validation';

export default class DecisionRule extends DecisionBase {

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
        return 'decision_rule';
    }

    /**
     * @inheritdoc
     */
    exportJSON() {
        let out = super.exportJSON();
        out['type'] = this.type;
        out['label'] = this.label;
        out['script'] = this.script;
        return out;
    }

    /**
     * @inheritdoc
     */
    static importJSON(data) {
        let obj = super.importJSON(data);
        obj.importValues(
            {
                'type' : 'type',
                'label': 'label',
                'script' : 'script',
            },
            data
        )
        return obj;
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
