import DecisionRootComponent from '../components/decision_root.js';
import DecisionBase from './base.js';

export const DECISION_TYPE_FORM = 'form';
export const DECISION_TYPE_DOCUMENT = 'document';
export default class DecisionRoot extends DecisionBase {

    constructor(uid) {
        super(uid);
        this.name = '';
        this.type = '';
        this.next = '';
        this.previous = '';
        this.versionHash = '';
    }

    /**
     * @inheritdoc
     */
    static getTypeName() {
        return 'decision_root';
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
        out['name'] = this.name;
        out['type'] = this.type;
        out['next'] = this.next;
        out['previous'] = this.previous;
        return out;
    }

    /**
     * @inheritdoc
     */
    static importJSON(data) {
        let obj = super.importJSON(data);
        obj.importValues(
            {
                'name' : 'name',
                'type' : 'type',
                'next' : 'next',
                'previous' : 'previous',
                'version_hash' : 'versionHash',
                'embeds' : 'embeds'
            },
            data
        )
        return obj;
    }


}
