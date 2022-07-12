import React from 'react';
import shortcode from '../../lib/shortcode-parser';
import NodeRule, { RULE_TYPE_VALIDATION, RULE_TYPE_VISIBILITY } from '../../nodes/rule';
import BaseNode from '../../nodes/base';
import UserData from '../../user_data';
import RootNode from '../../nodes/root';
import RuleEngine from '../../rule_engine';
import RuleNode from '../../nodes/rule';
import MatrixNode from '../../nodes/matrix';
import Events from '../../events';

export default class BaseNodeComponent extends React.Component {

    constructor(props) {
        super(props);
        this.updateCallback = props?.onUpdate;
        this.node = props?.node ? props?.node : new RootNode;
        this.root = props?.root ? props?.root : this.node;
        this.userData = props?.userData ? props?.userData : new UserData;
        this.readOnly = props?.readOnly;
        this.matrix = props?.matrix;
        this.level = props?.level ? props?.level : 1;
        this.state = {
            visible: !this.userData.isHidden(this.node, null, this.matrix)
        };
        this.rules = [];
        this.checkValidation = false;
        this.onUpdateCallback = this.onUpdateCallback.bind(this);
        this.onPreRuleEvaluation = this.onPreRuleEvaluation.bind(this);
        this.onRuleEvaluation = this.onRuleEvaluation.bind(this);
    }

    /**
     * {@inheritdoc}
     */
    componentDidMount() {
        Events.listen('pre-rule-evaluation', this.onPreRuleEvaluation);
        Events.listen('rule-evaluation', this.onRuleEvaluation);
    }

    /**
     * {@inheritdoc}
     */
    componentWillUnmount() {
        Events.remove('pre-rule-evaluation', this.onPreRuleEvaluation);
        Events.remove('rule-evaluation', this.onRuleEvaluation);
    }

    /**
     * @param {BaseNode} node 
     * @param {String} matrix
     */
    onUpdateCallback(node, matrix) {
        if (this.updateCallback) { this.updateCallback(node, matrix); }
    }

    /**
     * @param {Event} e 
     */
    onPreRuleEvaluation(e) {
        this.setState({
            messages: [],
            visible: !this.userData.isHidden(this.node, null, this.matrix)
        });
    }

    /**
     * @param {Event} e 
     */
    onRuleEvaluation(e) {
        let results = e.detail;
        if (
            !results?.rule || !results?.parent ||
            this.node.uid != results.parent.uid || this.matrix != results.matridId
        ) {
            return;
        }
        switch (results.rule.type) {
            case RULE_TYPE_VALIDATION: {
                if (!results.results && results.message) {
                    this.setState(function(state, props) {
                        let newValue = [ ...state.messages, results.message];
                        return { messages: newValue };
                    });
                }           
                break;
            }
            default: {
                this.setState({
                    visible: !this.userData.isHidden(this.node, null, this.matrix)
                });
                break;
            }
        }
    }

    /**
     * Compile all rules.
     * @returns {Array}
     */
    compileRules() {
        let compileChildRules = function(node, matrixId) {
            let out = [];
            // handle matrix
            if (node instanceof MatrixNode) {
                let matrixIds = this.userData.findMatrixIds(node);
                for (let i in matrixIds) {
                    let matrixId = matrixIds[i];
                    for (let j in node.children) {
                        out = out.concat(compileChildRules(node.children[j], matrixId));
                    }
                }
                return out;
            }
            for (let i in node.children) {
                let child = node.children[i];
                if (child instanceof RuleNode) {
                    let ruleEngine = new RuleEngine;
                    ruleEngine.matrixId = matrixId;
                    ruleEngine.setUserData(this.userData);
                    ruleEngine.setRootNode(this.root);
                    ruleEngine.setRuleNode(child);
                    out.push(ruleEngine);
                    continue;
                }
                out = out.concat(compileChildRules(child));
            }
            return out;
        };
        compileChildRules = compileChildRules.bind(this);
        return compileChildRules(this.node);
    }

    /**
     * Evaluate all child rules.
     */
    evaluateRules() {
        // reset validation
        this.userData.questionValidationMessages = {};
        this.userData.valid = true;
        // hide nodes with visibility rules
        for (let i in this.rules) {
            /** @var RuleEngine */
            let ruleEngine = this.rules[i];
            if (!ruleEngine.rule.type || ruleEngine.rule.type == RULE_TYPE_VISIBILITY) {
                let parent = ruleEngine.rule.getParent(this.root);
                if (!parent) { continue; }
                this.userData.setHidden(parent, true, ruleEngine.matrixId);
            }
        }
        // fire 'pre' event
        Events.dispatch('pre-rule-evaluation');
        // evaluate rules
        for (let i in this.rules) {
            /** @var RuleEngine */
            let ruleEngine = this.rules[i];
            let res = ruleEngine.evaluate();
            switch (ruleEngine.rule.type) {
                case RULE_TYPE_VALIDATION: {
                    if (!res.results) {
                        this.userData.addValidationMessage(
                            res.parent, res.message, res.matrixId
                        );
                        this.userData.valid = false;
                    }
                    break;
                }
                default: {
                    if (res.results) {
                        this.userData.setHidden(res.parent, false, res.matrixId);
                    }
                    break;
                }
            }
            Events.dispatch('rule-evaluation', res);
        }
        this.setState({visible: !this.userData.isHidden(this.node, this.root, this.matrix)});
    }

    /**
     * Get node type name.
     * @return {String}
     */
    static getTypeName() {
        return 'base';
    }

    /**
     * Get element id.
     * @return string
     */
    getId() {
        return (this.getTypeName() + '-' + this.node.uid + (this.matrix ? ('-' + this.matrix) : '')).replace('_', '-');
    }

    /**
     * Get element class.
     * @return string
     */
    getClass() {
        let out = 'tree-node tree-' + this.constructor.getTypeName() + ' tree-level-' + this.level;
        if (this.node?.tags && this.node.tags.length > 0) {
            out += ' tag-' + this.node.tags.join(' tag-');
        }
        if (!this.state.visible) {
            out += ' hidden';
        }
        return out;
    }

    /**
     * Parse shortcode.
     * @param {string} content 
     * @return {string}
     */
    parseShortcode(content) {
        if (!content) {
            return '';
        }
        return shortcode.parse(content);
    }

    /**
     * List of available child node types.
     * @return {Array}
     */
    availableChildTypes() {
        return [];
    }

    /**
     * Render child nodes.
     * @return {Array}
     */
    renderChildren() {
        let out = [];
        let childTypes = this.availableChildTypes();
        for (let i in this.node.children) {
            let child = this.node.children[i];
            for (let j in childTypes) {
                let Component = childTypes[j];
                if (Component.getTypeName() == child.constructor.getTypeName()) {
                    out.push(
                        <Component 
                            key={this.userData.uid + '_' + child.uid} 
                            node={child}
                            root={this.root}
                            onUpdate={this.onUpdateCallback}
                            userData={this.userData}
                            readOnly={this.readOnly}
                            matrix={this.matrix}
                            level={this.level+1}
                        />
                    );
                    break;
                }
            }
        }
        return out;
    }

    /**
     * {@inheritdoc}
     */
    render() {
        return null;
    }

}