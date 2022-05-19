import md5 from 'blueimp-md5';

export const KEY_UID = 'uid';
export const KEY_VERSION = 'ver';
export const KEY_PARENT = 'par';
export const KEY_TYPE = 'typ';
export const KEY_TAGS = 'tag';
export const KEY_DATA = 'dat';

/**
 * Base decision object node.
 */
export default class BaseNode {

    constructor(uid) {
        this.uid = uid;
        this.version = 0;
        this.level = 0;
        this.tags = [];
        this.embeds = {};
        this.children = [];
        this.parent = '';
    }

    /**
     * Get type name of decision object.
     * @return {string}
     */
    static getTypeName() {
        return 'base';
    }

    /**
     * Get React component used to render decision object.
     * @return {React.Component}
     */
    getComponent() {
        return null;
    }

    /**
     * Search children for object of given UID.
     * @param {string} uid 
     */
    getChild(uid) {
        if (uid == this.uid) {
            return this;
        }
        for (let i in this.children) {
            let res = this.children[i].getChild(uid);
            if (res) {
                return res;
            }
        }
        return null;
    }

    /**
     * Add child object.
     * @param {BaseNode} object 
     */
    addChild(object) {
        if (!(object instanceof BaseNode)) {
            return;
        }
        if (this.getChild(object.uid)) {
            return;
        }
        this.children.push(object);
    }

    /**
     * Given root object find parent for this object.
     * @param {BaseNode} root 
     * @returns {BaseNode}
     */
    getParent(root) {
        let ittChildren = function(obj, match) {
            for (let i in obj.children) {
                let child = obj.children[i];
                if (child.uid == match) {
                    return obj;
                }
                let res = ittChildren(child, match);
                if (res) {
                    return res;
                }
            }
            return null;
        };
        return ittChildren(root, this.uid);
    }

    /**
     * Check if a rule of given type exists as child.
     * @param {string} ruleType 
     * @returns {boolean}
     */
    hasRuleOfType(ruleType) {
        for (let i in this.children) {
            let child = this.children[i];
            if (
                child.constructor.getTypeName() == 'rule' &&
                (child.type == ruleType || (ruleType == 'visibility' && !child.type))
            ) {
                return true;
            }
        }
        return false;
    }

    /**
     * @return {string}
     */
    toString() {
        return this.uid;
    }

    /**
     * Get display name for object.
     * @returns 
     */
    getName() {
        if (typeof this.name != 'undefined' && this.name) {
            return this.name;
        } else if (typeof this.label != 'undefined' && this.label) {
            return this.label;
        }
        return this.uid;
    }

    /**
     * Get extra data to be exported with this object.
     * @returns {object}
     */
    getData() {
        return {};
    }

    /**
     * Export to JSON compatible object.
     * @return {Array}
     */
    exportJSON() {
        let out = [{
            [KEY_UID]: this.uid,
            [KEY_VERSION]: this.verison,
            [KEY_TYPE]: this.constructor.getTypeName(),
            [KEY_TAGS]: this.tags,
            [KEY_DATA]: this.getData()
        }];
        for (let i in this.children) {
            out = out.concat(this.children[i].exportJSON());
        }
        return out;
    }

    /**
     * Import from JSON compatible object.
     * @param {object} data 
     * @return {BaseNode}
     */
    static importJSON(data) {
        if (typeof data[KEY_UID] == 'undefined') {
            return null;
        }
        let obj = new this(data[KEY_UID]);
        obj.version = typeof data[KEY_VERSION] == 'undefined' ? null : data[KEY_VERSION];
        obj.type = typeof data[KEY_TYPE] == 'undefined' ? null : data[KEY_TYPE];
        obj.parent = typeof data[KEY_PARENT] == 'undefined' ? '' : data[KEY_PARENT];
        obj.tags = typeof data[KEY_TAGS] == 'undefined' ? [] : data[KEY_TAGS];
        if (typeof data[KEY_DATA] != 'undefined') {
            for (let k in data[KEY_DATA]) {
                obj[k] = data[KEY_DATA][k];
            }
        }
        return obj;
    }

    /**
     * Post decision object build hook.
     * @param {BaseNode} rootObj 
     */
    postBuildHook(rootObj) {
        for (let i in this.children) {
            this.children[i].postBuildHook(rootObj);
        }
    }

    /**
     * Generate an UID.
     * @returns {string}
     */
    static generateUid() {
        return parseInt(md5((Date.now() + Math.random())), 16).toString(36);
    }

    /**
     * List form fields for builder.
     * @return {Array}
     */
     builderFields() {
        return [];
    }

}