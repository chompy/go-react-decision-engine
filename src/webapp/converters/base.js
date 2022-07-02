import BaseNode from '../nodes/base';

/**
 * Base class for decision node converter which allows import and export
 * of decision trees from various data store formats (json, xml, csv, etc).
 */
export default class BaseConverter {

    constructor() {
        this.userData = null;
    }

    /**
     * Import in to decision engine.
     * @param {*} data
     * @returns {BaseNode}
     */
    import(data) {
        throw this.constructor.name + ' does not support "import" method.';
    }

    /**
     * Export from decision engine.
     * @param {BaseNode} node
     * @return {*}
     */
    export(node) {
        throw this.constructor.name + ' does not support "export" method.';
    }

}