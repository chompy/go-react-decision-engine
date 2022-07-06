import BaseNode from './base';
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
    getData() {
        return {
            'type' : this.type            
        };
    }

}
