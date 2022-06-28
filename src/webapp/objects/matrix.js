import BaseNode, { KEY_DATA } from './base';
import MatrixNodeComponent from '../components/nodes/matrix';

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
    getComponent() {
        return MatrixNodeComponent;
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
