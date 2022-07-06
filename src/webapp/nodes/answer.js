import BaseNode from './base.js';

/**
 * Decision answer node.
 */
export default class AnswerNode extends BaseNode {

    constructor(uid) {
        super(uid);
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
    getData() {
        return {
            'value' : this.value            
        };
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
