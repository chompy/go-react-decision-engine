import BaseNode, { KEY_DATA } from './base.js';

/**
 * Decision answer node.
 */
export default class AnswerNode extends BaseNode {

    constructor(uid) {
        super(uid);
        this.label = '';
        this.value = '';
    }

    /**
     * @inheritdoc
     */
    static getTypeName() {
        return 'answer';
    }

    /**
     * @inheritdoc
     */
    exportJSON() {
        let out = super.exportJSON();
        out[KEY_DATA] = {
            'label' : this.label,
            'value' : this.value
        }
        return out;
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
