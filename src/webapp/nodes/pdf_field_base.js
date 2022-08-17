import BaseNode from './base';

export const FIELD_TEXT = 'text';
export const FIELD_TEXTAREA = 'textarea';
export const FIELD_CHECKBOX = 'checkbox';
export const FIELD_COMBOBOX = 'combobox';

export default class PdfFieldBaseNode extends BaseNode {

    constructor(uid) {
        super(uid);
        this.field = null;
        this.fieldName = '';
        this.label = '';
        this.formNode = null;
        this.typeahead
    }

    /**
     * @inheritdoc
     */
    static getTypeName() {
        return 'pdf-field-base';
    }

    /**
     * @param {Object} field 
     */
    setField(field) {
        this.field = field;
        this.fieldName = field?.name;
        this.label = field.name;
        for (let i in this.children) {
            let child = this.children[i];
            if (child instanceof PdfFieldBaseNode) {
                child.formNode = this.formNode;
                child.setField(field);
            }
        }
    }

    /**
     * @inheritdoc
     */
    addChild(object) {
        if (object instanceof PdfFieldBaseNode && this.field) {
            object.formNode = this.formNode;
            object.setField(this.field);
        }
        super.addChild(object);
    }

    /**
     * @inheritdoc
     */
    getData() {
        return {
            'fieldName': this.fieldName
        };
    }

    /**
     * @inheritdoc
     */
    builderFields() {
        return [];
    }

    /**
     * @returns {String}
     */
    getFieldType() {
        if (!this.field) { return FIELD_TEXT; }
        return this.field.type == FIELD_TEXT && this.field?.multiline ? FIELD_TEXTAREA : this.field.type;
    }

    /**
     * @returns {Array}
     */
    getFieldChoices() {
        if (!this.field || this.getFieldType() != FIELD_COMBOBOX) { return []; }
        let out = [];
        for (let i in this.field.items) {
            out.push(
                this.field.items[i]?.exportValue ? this.field.items[i].exportValue : this.field.items[i]?.displayValue
            );
        }
        return out;
    }

}
