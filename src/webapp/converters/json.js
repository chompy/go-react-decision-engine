import AnswerNode from '../objects/answer';
import GroupNode from '../objects/group';
import QuestionNode from '../objects/question';
import MatrixNode from '../objects/matrix';
import RootNode from '../objects/root';
import BaseConverter from './base';
import RuleNode from '../objects/rule';

export default class JsonConverter extends BaseConverter{

    constructor() {
        this.classes = [
            RootNode,
            QuestionNode,
            AnswerNode,
            GroupNode,
            MatrixNode,
            RuleNode
        ];
    }

    /**
     * {@inheritdoc}
     */
    import(data) {
        if (!Array.isArray(data)) {
            return null;
        }
        // build list of nodes
        let flatNodeList = [];
        for (let i in data) {
            let nodeData = data[i];
            for (let c in t.classes) {
                if (t.classes[c].getTypeName() == nodeData[KEY_TYPE]) {
                    let node = t.classes[c].importJSON(value);
                    if (node) {
                        flatNodeList.push(node);
                    }
                    break;
                }
            }
        }
        // find root
        let root = null;
        for (let i in flatNodeList) {
            let node = flatNodeList[i];
            if (!node.parent && node instanceof RootNode) {
                root = node;
                break;
            }
        }
        if (!root) {
            throw 'JsonConverter::import error, could not find root node.';
        }
        root.level = 0;
        // itterate and construct tree
        let buildAll = function(node, level) {
            for(let i in flatNodeList) {
                let child = flatNodeList[i];
                if (child.parent == node.uid) {
                    buildAll(child, level+1);
                    node.children.push(child);
                }
            }
        };
        buildAll = buildAll.bind(this);
        buildAll(root, 0);
        return root;
    }

    /**
     * {@inheritdoc}
     */
    export(node) {
        return node.exportJSON();
    }

}