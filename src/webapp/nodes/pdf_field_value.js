import BaseNode from './base';

export const FIELD_TEXT = 'text';
export const FIELD_TEXTAREA = 'textarea';
export const FIELD_CHECKBOX = 'checkbox';
export const FIELD_COMBOBOX = 'combobox';

export default class PdfFieldValueNode extends BaseNode {

    constructor(uid) {
        super(uid);
        this.value = '';
        this.fieldType = FIELD_TEXT;
        this.fieldChoices = [];
    }

    /**
     * @inheritdoc
     */
    static getTypeName() {
        return 'pdf-field-value';
    }

    /**
     * @inheritdoc
     */
    getName() {
        if (this.fieldType == FIELD_CHECKBOX) {
            return 'Checked';
        } else if (this.value) {
            return this.value;
        }
        return '(empty)';
    }

    /**
     * @param {Object} field 
     */
    setField(field) {
        this.fieldType = field.type == FIELD_TEXT && field?.multiline ? FIELD_TEXTAREA : field.type;
        if (this.fieldType == FIELD_COMBOBOX) {
            this.fieldChoices = [];
            for (let i in field.items) {
                this.fieldChoices.push(
                    field.items[i]?.exportValue ? field.items[i].exportValue : field.items[i]?.displayValue
                );
            }
            this.value = this.fieldChoices[0];
        }
    }

    /**
     * @inheritdoc
     */
    getData() {
        return {
            'value' : this.value,
            'fieldType': this.fieldType,
            'fieldChoices': this.fieldChoices
        };
    }

    /**
     * @inheritdoc
     */
    builderFields() {
        switch (this.fieldType) {
            case FIELD_CHECKBOX: {
                return [];
            }
            case FIELD_COMBOBOX: {
                return [['value', 'Value', 'choice', this.fieldChoices]];
            }
            default: {
                return [['value', 'Value', this.fieldType]];
            }
        }
    }

}
