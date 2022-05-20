import DecisionRoot from './decision_objects/root.js';
import DecisionAnswer from './decision_objects/answer.js';
import DecisionGroup from './decision_objects/group.js';
import DecisionQuestion from './decision_objects/question.js';
import DecisionRule from './decision_objects/rule.js';
import DecisionBase, {KEY_TYPE, KEY_CHILDREN} from './decision_objects/base.js';
import DecisionMatrix from './decision_objects/matrix.js';

export default class DecisionBuilder {

    static buildIdCounter = 1;

    constructor() {
        this.classes = [
            DecisionRoot,
            DecisionQuestion,
            DecisionAnswer,
            DecisionGroup,
            DecisionMatrix,
            DecisionRule
        ];
    }

    /**
     * Fetch and build decision object.
     * @param {string} name 
     * @param {callback} callback 
     */
    fetch(name, callback) {
        let t = this;
        fetch('/f?n=' + name)
            .then(response => response.json())
            .then(response => callback(t.build(response)));
    }

    /**
     * Build decision object from JSON compatible array.
     * @param {Object} value 
     * @return {DecisionBase}
     */
    build(value) {
        if (!(value instanceof Object)) {
            return null;
        }
        let t = this;
        DecisionBuilder.buildIdCounter++;
        let buildRecursive = function(value, level) {
            for (let c in t.classes) {
                if (t.classes[c].getTypeName() == value[KEY_TYPE]) {
                    let res = t.classes[c].importJSON(value);
                    res.instanceId = DecisionBuilder.buildIdCounter;
                    res.children = [];
                    res.level = level;
                    for (let i in value[KEY_CHILDREN]) {
                        res.children.push(
                            buildRecursive(value[KEY_CHILDREN][i], level+1)
                        );
                    }
                    return res;
                }
            }
            return null;
        };
        return buildRecursive(value, 0);
    }

}
