/**
 * Special node type created from the 'node_list' API fetch.
 */
export default class ProxyNode {

    constructor(data) {
        this.uid = data?.uid;
        this.type = data?.type;
        this.version = parseInt(data?.version);
        this.label = data?.label;
        this.value = data?.answer_value;
        this.parent = data?.parent;
    }

    getName() {
        return this.label;
    }

}
