import md5 from 'blueimp-md5';

export const KEY_UID = '_uid';
export const KEY_VERSION = '_ver';
export const KEY_CHILDREN = '_chi';
export const KEY_TYPE = '_typ';
export const KEY_LANGUAGE = '_lan';
export const KEY_PRIORITY = '_pri';
export const KEY_TAGS = '_tag';

export default class DecisionBase {

    constructor(uid) {
        this.uid = uid;
        this.version = 0;
        this.language = '';
        this.children = [];
        this.priority = 0;
        this.instanceId = null;
        this.level = 0;
        this.tags = [];
        this.embeds = {};
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
     * @param {DecisionBase} object 
     */
    addChild(object) {
        if (!(object instanceof DecisionBase)) {
            return;
        }
        if (this.getChild(object.uid)) {
            return;
        }
        this.children.push(object);
    }

    /**
     * Given root object find parent for this object.
     * @param {DecisionBase} root 
     * @returns {DecisionBase}
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
                child.constructor.getTypeName() == 'decision_rule' &&
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
     * Export to JSON compatible object.
     * @return {object}
     */
    exportJSON() {
        let children = [];
        for (let i in this.children) {
            children.push(this.children[i].exportJSON());
        }
        return {
            [KEY_UID]: this.uid,
            [KEY_VERSION]: this.verison,
            [KEY_TYPE]: this.constructor.getTypeName(),
            [KEY_LANGUAGE]: this.language,
            [KEY_CHILDREN]: children,
            [KEY_PRIORITY]: this.priority,
            [KEY_TAGS]: this.tags
        };
    }

    /**
     * Import from JSON compatiable object.
     * @param {object} data 
     */
    static importJSON(data) {
        let obj = new this(data[KEY_UID]);
        obj.importValues(
            {
                [KEY_VERSION] : 'version',
                [KEY_LANGUAGE] : 'language',
                [KEY_PRIORITY] : 'priority',
                [KEY_TAGS]: 'tags',
            },
            data
        );
        return obj;
    }

    /**
     * Import properties from JSON given a key mapping.
     * @param {object} map 
     * @param {object} data 
     */
    importValues(map, data) {
        for (let key in map) {
            let property = map[key];
            this[property] = null;
            if (typeof data[key] == 'undefined') {
                continue;
            }
            this[property] = data[key];
        }
    }

    /**
     * Post decision object build hook.
     * @param {DecisionBase} rootObj 
     */
    postBuildHook(rootObj) {
        for (let i in this.children) {
            this.children[i].postBuildHook(rootObj);
        }
    }

    /**
     * @param {} userData
     * @return {object}
     */
    toPdfMake(userData) {
        let out = [];
        for (let i in this.children) {
            if (userData.isHidden(this.children[i])) {
                continue;
            }
            out = out.concat(
                this.children[i].toPdfMake(userData)
            );
        }
        return out;
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