import DecisionBase from './base.js';

/**
 * Decision answer object.
 */
export default class DecisionAnswer extends DecisionBase {

    constructor(uid) {
        super(uid);
        this.label = '';
        this.value = '';
    }

    /**
     * @inheritdoc
     */
    static getTypeName() {
        return 'decision_answer';
    }

    /**
     * @inheritdoc
     */
    exportJSON() {
        let out = super.exportJSON();
        out['label'] = this.label;
        out['value'] = this.value;
        return out;
    }

    /**
     * @inheritdoc
     */
    static importJSON(data) {
        let obj = super.importJSON(data);
        obj.importValues(
            {
                'label' : 'label',
                'value' : 'value'
            },
            data
        )
        return obj;
    }

    /**
     * @inheritdoc
     */
    builderFields() {
        return [
            ['label', 'Label', 'text'],
            ['value', 'Value', 'text']
        ];
    }

}
