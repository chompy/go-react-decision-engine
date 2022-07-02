import AnswerNode from '../nodes/answer';
import GroupNode from '../nodes/group';
import QuestionNode from '../nodes/question';
import MatrixNode from '../nodes/matrix';
import RootNode from '../nodes/root';
import BaseConverter from './base';
import RuleNode from '../nodes/rule';
import { KEY_TYPE } from '../nodes/base';

export default class JsonConverter extends BaseConverter {

    constructor() {
        super();
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
            for (let c in this.classes) {
                if (this.classes[c].getTypeName() == nodeData[KEY_TYPE]) {
                    let node = this.classes[c].importJSON(data[i]);
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