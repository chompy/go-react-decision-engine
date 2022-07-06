import BaseNode from './base';

export default class GroupNode extends BaseNode {

    constructor(uid) {
        super(uid);
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
    getData() {
        return {
            'contentEdit' : this.contentEdit,
            'content' : this.content
        };
    }

    /**
     * @inheritdoc
     */
    builderFields() {
        return [
            ['label', 'Label', 'text'],
            ['contentEdit', 'Content', 'richtext']
        ];
    }

}
