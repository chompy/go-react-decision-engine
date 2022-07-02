import DecisionRootComponent from '../components/nodes/root';
import BaseNode, { KEY_DATA } from './base';

export const DECISION_TYPE_FORM = 'form';
export const DECISION_TYPE_DOCUMENT = 'document';

export default class RootNode extends BaseNode {

    constructor(uid) {
        super(uid);
        this.type = '';
        this.versionHash = '';
    }

    /**
     * @inheritdoc
     */
    static getTypeName() {
        return 'root';
    }

    /**
     * @inheritdoc
     */
    getComponent() {
        return DecisionRootComponent;
    }

    /**
     * @inheritdoc
     */
    getData() {
        return {
            'type' : this.type            
        };
    }

}
