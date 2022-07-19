import PdfFieldBaseNode, { FIELD_CHECKBOX, FIELD_COMBOBOX } from './pdf_field_base';
export default class PdfFieldValueNode extends PdfFieldBaseNode {

    constructor(uid) {
        super(uid);
        this.value = '';
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
        if (this.getFieldType() == FIELD_CHECKBOX) {
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
        super.setField(field);
        switch (this.getFieldType()) {
            case FIELD_CHECKBOX: {
                this.value = true;
                break;
            }
            case FIELD_COMBOBOX: {
                if (!this.value) {
                    let fieldChoices = this.getFieldChoices();
                    this.value = fieldChoices.length > 0 ? fieldChoices[0] : '';
                }
                break;
            }
        }
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
        let fieldType = this.getFieldType();
        switch (fieldType) {
            case FIELD_CHECKBOX: {
                return [];
            }
            case FIELD_COMBOBOX: {
                return [['value', 'Value', 'choice', this.getFieldChoices()]];
            }
            default: {
                return [['value', 'Value', fieldType]];
            }
        }
    }

}
