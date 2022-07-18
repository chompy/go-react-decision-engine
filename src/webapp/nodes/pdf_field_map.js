import { MSG_QUESTION_OR_ANSWER } from '../config';
import BaseNode from './base';

export default class PdfFieldMapNode extends BaseNode {

    constructor(uid) {
        super(uid);
        this.value = [];
        this.ruleNode = null;
    }

    /**
     * @inheritdoc
     */
    static getTypeName() {
        return 'pdf-field-map';
    }

    /**
     * @inheritdoc
     */
    getName() {
        if (this.ruleNode && this.value && this.value.length > 0) {
            let firstValue = this.ruleNode.getChild(this.value[0]);
            return '"' + firstValue.getName() + '"' + (this.value.length > 1 ? ' +' + (this.value.length-1) + ' more' : '');
        }
        return '(empty)';
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
            ['value', MSG_QUESTION_OR_ANSWER, 'typeahead']
        ];
    }

}
