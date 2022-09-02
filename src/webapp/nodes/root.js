import BackendAPI from '../api';
import BaseNode from './base';
import ProxyNode from './proxy';
export default class RootNode extends BaseNode {

    constructor(uid) {
        super(uid);
        this.type = '';
        this.versionHash = '';
        this.data = {};
        this.fetchedNodeVersionList = null;
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

    /**
     * @param {*} callback 
     */
    fetchProxyNodes(callback) {
        if (this.fetchedNodeVersionList) { return; }
        BackendAPI.get(
            'tree/node_list', {id: this.uid, version: this.data?.version}, function(res) {
                if (!res?.success) { return; }
                this.fetchedNodeVersionList = res?.data ? res.data : [];
                if (callback) { callback(this.fetchedNodeVersionList); }
            }.bind(this)
        );
    }

    /**
     * @param {String} uid 
     * @return {ProxyNode}
     */
    findProxyNode(uid) {
        for (let i in this.fetchedNodeVersionList) {
            if (this.fetchedNodeVersionList[i]?.uid == uid) {
                return new ProxyNode(this.fetchedNodeVersionList[i]);
            }
        }
        return null;
    }

}
