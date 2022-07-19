import PdfFieldBaseNode from './pdf_field_base';

export default class PdfFieldNode extends PdfFieldBaseNode {

    /**
     * @inheritdoc
     */
    static getTypeName() {
        return 'pdf-field';
    }

}
