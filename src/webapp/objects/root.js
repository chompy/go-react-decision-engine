import DecisionRootComponent from '../components/node_root.js';
import BaseNode, { KEY_DATA } from './base.js';

export const DECISION_TYPE_FORM = 'form';
export const DECISION_TYPE_DOCUMENT = 'document';

export default class RootNode extends BaseNode {

    constructor(uid) {
        super(uid);
        this.name = '';
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
    exportJSON() {
        let out = super.exportJSON();
        out[KEY_DATA] = {
            'name' : this.name,
            'type' : this.type
        };
        return out;
    }

}
