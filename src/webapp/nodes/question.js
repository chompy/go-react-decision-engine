import BaseNode from './base.js';

export const FIELD_TEXT = 'text';
export const FIELD_CHOICE = 'choice';
export const FIELD_DROPDOWN = 'dropdown';
export const FIELD_UPLOAD = 'upload';

export default class QuestionNode extends BaseNode {

    constructor(uid) {
        super(uid);
        this.type = FIELD_TEXT;
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
    getData() {
        return {
            'type' : this.type,
            'textLines' : this.textLines,
            'defaultAnswer' : this.defaultAnswer,
            'multiple' : this.multiple            
        };
    }

    builderFields() {
        let out = [
            ['label', 'Label', 'text'],
        ];
        switch (this.type) {
            case FIELD_TEXT: {
                out.push(['textLines', 'Text Lines', 'number']);
                out.push(['defaultAnswer', 'Default Answer', 'textarea']);
                break;
            }
            case FIELD_CHOICE:
            case FIELD_DROPDOWN: {
                out.push(['multiple', 'Multiple', 'checkbox'])
                break;
            }
        }
        return out;
    }

}

