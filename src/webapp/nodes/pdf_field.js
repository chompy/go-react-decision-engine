import BaseNode from './base';
import PdfFieldValueNode from './pdf_field_value';

export default class PdfFieldNode extends BaseNode {

    constructor(uid) {
        super(uid);
        this.field = null;
        this.label = '';
    }

    /**
     * @inheritdoc
     */
    static getTypeName() {
        return 'pdf-field';
    }

    /**
     * @param {Object} field 
     */
    setField(field) {
        this.field = field;
        this.label = field.name;
    }

    /**
     * @inheritdoc
     */
    addChild(object) {
        if (object instanceof PdfFieldValueNode && this.field) {
            object.setField(this.field);
        }
        super.addChild(object);
    }

    /**
     * @inheritdoc
     */
    getData() {
        return {
            'value' : this.value,
            'field_type': this.fieldType
        };
    }

    /**
     * @inheritdoc
     */
    builderFields() {
        return [];
    }

    /**
     * @inheritDoc
     */
    builderCanDelete() {
        return false;
    }

}
