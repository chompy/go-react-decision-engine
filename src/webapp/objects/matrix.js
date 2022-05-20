import BaseNode, { KEY_DATA } from './base';
import MatrixNodeComponent from '../components/nodes/matrix';

export default class MatrixNode extends BaseNode {

    constructor(uid) {
        super(uid);
        this.name = '';
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
    exportJSON() {
        let out = super.exportJSON();
        out[KEY_DATA] = {
            'name' : this.name
        }
        return out;
    }

    /**
     * @inheritdoc
     */
    builderFields() {
        return [
            ['name', 'Name', 'text'],
        ];
    }

}
