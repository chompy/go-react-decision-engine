import BaseNode from './base';

export default class MatrixNode extends BaseNode {

    constructor(uid) {
        super(uid);
    }

    /**
     * @inheritdoc
     */
    static getTypeName() {
        return 'matrix';
    }

    /**
     * @inheritdoc
     */
    builderFields() {
        return [
            ['label', 'Label', 'text'],
        ];
    }

}
