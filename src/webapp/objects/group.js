import BaseNode, { KEY_DATA } from './base';
import GroupNodeComponent from '../components/node_group';

export default class GroupNode extends BaseNode {

    constructor(uid) {
        super(uid);
        this.name = '';
        this.content = '';
        this.contentEdit = '';
    }

    /**
     * @inheritdoc
     */
    static getTypeName() {
        return 'group';
    }

    /**
     * @inheritdoc
     */
    getComponent() {
        return GroupNodeComponent;
    }

    /**
     * @inheritdoc
     */
    exportJSON() {
        let out = super.exportJSON();
        out[KEY_DATA] = {
            'name' : this.name,
            'contentEdit' : this.contentEdit,
            'content' : this.content
        };
        return out;
    }

    /**
     * @inheritdoc
     */
    static importJSON(data) {
        let node = super.importJSON(data);
        if (!node.contentEdit) {
            node.contentEdit = node.content;
        }
        return node;
    }

    /**
     * @inheritdoc
     */
    builderFields() {
        return [
            ['name', 'Name', 'text'],
            ['contentEdit', 'Content', 'richtext']
        ];
    }

}
