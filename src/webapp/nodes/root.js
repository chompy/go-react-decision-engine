import BaseNode from './base';
export default class RootNode extends BaseNode {

    constructor(uid) {
        super(uid);
        this.type = '';
        this.versionHash = '';
        this.data = {};
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
        return Object.assign(
            {},
            {
                type: this.type,
            },
            this.data
        );
    }

    /**
     * @param {object} data 
     */
    importData(data) {
        this.data = {};
        for (let k in data) {
            this.data[k] = data[k];
        }
        if ('type' in data) {
            this.type = data['type'];
        }
    }

    /**
     * @inheritDoc
     */
    builderCanDelete() {
        return false;
    }

}
