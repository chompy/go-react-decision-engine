import BaseNode, { KEY_DATA } from './base.js';

export const DECISION_FORM_TYPE_TEXT = 'text';
export const DECISION_FORM_TYPE_CHOICE = 'choice';
export const DECISION_FORM_TYPE_DROPDOWN = 'dropdown';
export const DECISION_FORM_TYPE_UPLOAD = 'upload';

export default class QuestionNode extends BaseNode {

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
        return 'question';
    }

    /**
     * @inheritdoc
     */
    getComponent() {
        return QuestionNode;
    }

    /**
     * @inheritdoc
     */
    exportJSON() {
        let out = super.exportJSON();
        out[KEY_DATA] = {
            'label' : this.label,
            'type' : this.type,
            'textLines' : this.textLines,
            'defaultAnswer' : this.defaultAnswer,
            'multiple' : this.multiple
        };
        return out;
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

