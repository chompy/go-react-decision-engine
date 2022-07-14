import BaseNode from './base';

export default class GroupNode extends BaseNode {

    constructor(uid) {
        super(uid);
        this.content = '';
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
            'content' : this.content
        };
    }

    /**
     * @inheritdoc
     */
    builderFields() {
        return [
            ['label', 'Label', 'text'],
            ['content', 'Content', 'richtext']
        ];
    }

}
