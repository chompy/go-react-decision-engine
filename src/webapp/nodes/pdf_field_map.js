import { MSG_QUESTION_OR_ANSWER } from '../config';
import UserData from '../user_data';
import AnswerNode from './answer';
import PdfFieldBaseNode from './pdf_field_base';
import QuestionNode, { FIELD_CHOICE, FIELD_DROPDOWN, FIELD_TEXT } from './question';

export default class PdfFieldMapNode extends PdfFieldBaseNode {

    constructor(uid) {
        super(uid);
        this.value = [];
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
        return Object.assign({}, super.getData(), {value: this.value});
    }

    /**
     * @inheritdoc
     */
    builderFields() {
        return [
            ['value', MSG_QUESTION_OR_ANSWER, 'typeahead']
        ];
    }

    /**
     * Map answer/question uids in to value PDF form field answers.
     * @param {BaseNode} formRoot
     * @param {UserData} userData
     * @return {Array}
     */
    getFieldValues(formRoot, userData) {
        let out = [];
        for (let i in this.value) {
            let value = this.value[i];
            if (!value) { continue; }
            let formNode = formRoot.getChild(value);
            if (!formNode) { continue; }
            if (formNode instanceof AnswerNode) {
                out[field.fieldName].push(formNode.value);
            } else if (formNode instanceof QuestionNode) {
                let qAnswers = userData.getQuestionAnswers(formNode);
                switch (formNode.type) {
                    case FIELD_TEXT: {
                        if (qAnswers.length > 0) {
                            out.push(qAnswers[0]);
                        }
                        break;
                    }
                    case FIELD_CHOICE:
                    case FIELD_DROPDOWN: {
                        for (let j in qAnswers) {
                            let qAnswer = formRoot.getChild(qAnswers[j]);
                            if (qAnswer && qAnswer.value) {
                                out.push(qAnswer.value);
                            }
                        }   
                        break;
                    }
                }
            }
        }
        return out;
    }

}
