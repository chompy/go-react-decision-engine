import React from 'react';
import shortcode from '../../lib/shortcode-parser';
import NodeRule, { RULE_TYPE_VALIDATION, RULE_TYPE_VISIBILITY } from '../../nodes/rule';
import BaseNode from '../../nodes/base';
import UserData from '../../user_data';
import RootNode from '../../nodes/root';
import RuleEngine from '../../rule_engine';
import RuleNode from '../../nodes/rule';
import Events from '../../events';

export default class BaseNodeComponent extends React.Component {

    constructor(props) {
        super(props);
        this.callback = props?.callback;
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
        this.onRootUpdate = this.onRootUpdate.bind(this);
    }

    /**
     * {@inheritdoc}
     */
    componentDidMount() {
        // compile rules
        if (this.rules.length == 0) {
            for (let i in this.node.children) {
                let child = this.node.children[i];
                if (child instanceof RuleNode) {
                    let rule = new RuleEngine;
                    rule.matrixId = this.matrix;
                    rule.setRootNode(this.root);
                    rule.setUserData(this.userData);
                    rule.setRuleNode(child);
                    this.rules.push(rule);
                }
            }
            if (this.rules.length > 0) {
                this.evaluateRules();
            }
        }
        Events.listen('tree-root-update', this.onRootUpdate);
    }

    /**
     * {@inheritdoc}
     */
    componentWillUnmount() {
        Events.remove('tree-root-update', this.onRootUpdate);
    }

    /**
     * @param {BaseNode} node 
     * @param {String} matrix
     */
    onUpdateCallback(node, matrix) {
        if (this.callback) { this.callback(node, matrix); }
    }

    /**
     * @param {Event} e 
     */
    onRootUpdate(e) {
        this.evaluateRules();
    }

    /**
     * Evaluate all child rules.
     */
    evaluateRules() {
        // reset validation
        this.userData.resetValidationState(this.node);
        // if there are visibility rules then this node should be hidden by default
        if (this.node.hasRuleOfType(RULE_TYPE_VISIBILITY)) {
            this.userData.setHidden(this.node, true, this.matrix);
        }
        if (this.node.hasRuleOfType(RULE_TYPE_VALIDATION)) {
            this.setState({messages: []});
        }
        // evaluate rules
        for (let i in this.rules) {
            let ruleEngine = this.rules[i];
            if (!this.checkValidation && ruleEngine.rule.type == RULE_TYPE_VALIDATION) {
                continue;
            }
            let res = ruleEngine.evaluate();
            switch (ruleEngine.rule.type) {
                case RULE_TYPE_VALIDATION: {
                    if (!res.results) {
                        this.userData.addValidationMessage(
                            res.parent, res.message, res.matrixId
                        );
                        this.setState(function(state, props) {
                            let newValue = [ ...state.messages, res.message];
                            return {
                                messages: newValue
                            };
                        });
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
                            callback={this.onUpdateCallback}
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