import DecisionBase from './base.js';
import DecisionQuestionComponent from '../components/decision_question.js';

export const DECISION_FORM_TYPE_TEXT = 'text';
export const DECISION_FORM_TYPE_CHOICE = 'choice';
export const DECISION_FORM_TYPE_DROPDOWN = 'dropdown';
export const DECISION_FORM_TYPE_UPLOAD = 'upload';

export default class DecisionQuestion extends DecisionBase {

    constructor(uid) {
        super(uid);
        this.label = '';
        this.type = DECISION_FORM_TYPE_TEXT;
        this.textLines = 1;
        this.defaultAnswer = '';
        this.multiple = false;
    }

    /**
     * @inheritdoc
     */
    static getTypeName() {
        return 'decision_question';
    }

    /**
     * @inheritdoc
     */
    getComponent() {
        return DecisionQuestionComponent;
    }

    /**
     * @inheritdoc
     */
    exportJSON() {
        let out = super.exportJSON();
        out['label'] = this.label;
        out['type'] = this.type;
        out['text_lines'] = this.textLines;
        out['default_answer'] = this.defaultAnswer;
        out['multiple'] = this.multiple;
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
                'type' : 'type',
                'text_lines' : 'textLines',
                'default_answer' : 'defaultAnswer',
                'multiple' : 'multiple'
            },
            data
        )
        return obj;
    }

    builderFields() {
        let out = [
            ['label', 'Label', 'text'],
        ];
        switch (this.type) {
            case DECISION_FORM_TYPE_TEXT: {
                out.push(['textLines', 'Text Lines', 'number']);
                out.push(['defaultAnswer', 'Default Answer', 'textarea']);
                break;
            }
            case DECISION_FORM_TYPE_CHOICE:
            case DECISION_FORM_TYPE_DROPDOWN: {
                out.push(['multiple', 'Multiple', 'checkbox'])
                break;
            }
        }
        return out;
    }

}

