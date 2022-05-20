import React from 'react';
import shortcode from '../../lib/shortcode-parser';
import Events from '../../events';
import NodeRule, { RULE_TYPE_VISIBILITY } from '../../objects/rule';
import BaseNode from '../../objects/base';

export default class BaseNodeComponent extends React.Component {

    constructor(props) {
        super(props);
        this.node = props.node;
        this.userData = typeof props.userData == 'undefined' ? null : props.userData;
        this.readOnly = typeof props.readOnly == 'undefined' ? false : props.readOnly;
        this.matrix = props.matrix;
        this.state = {
            visible: this.userData ? !this.userData.isHidden(this.node, null, this.matrix) : !this.node.hasRuleOfType(RULE_TYPE_VISIBILITY)
        };
        this.onUpdate = this.onUpdate.bind(this);
        this.onPreRuleEvaluation = this.onPreRuleEvaluation.bind(this);
        this.onRuleEvaluation = this.onRuleEvaluation.bind(this);
    }

    /**
     * {@inheritdoc}
     */
    componentDidMount() {
        Events.listen('update', this.onUpdate);
        Events.listen('pre_rule_evaluation', this.onPreRuleEvaluation);
        Events.listen('rule_evaluation', this.onRuleEvaluation);
    }

    /**
     * {@inheritdoc}
     */
    componentWillUnmount() {
        Events.remove('update', this.onUpdate);
        Events.remove('pre_rule_evaluation', this.onPreRuleEvaluation);
        Events.remove('rule_evaluation', this.onRuleEvaluation);
    }

    /**
     * Fires when a decision node is updated.
     * @param {Event} e 
     */
    onUpdate(e) {
        this.userData = e.detail.userData;
    }

    /**
     * Fires before rules are evaluated.
     * @param {Event} e 
     */
    onPreRuleEvaluation(e) {
        for (let i in this.node.children) {
            let child = this.node.children[i];
            if (child instanceof NodeRule && (!child.type || child.type == RULE_TYPE_VISIBILITY)) {
                this.setState({visible: false});
                return;
            }
        } 
    }

    /**
     * Fires when a rule is evaluated.
     * @param {Event} e 
     */
    onRuleEvaluation(e) {
        if (
            !(e.detail.node instanceof BaseNode) ||
            !(e.detail.rule instanceof RuleNode) ||
            e.detail.node.uid != this.node.uid
        ) {
            return;
        }
        if ((!e.detail.rule.type || e.detail.rule.type == RULE_TYPE_VISIBILITY) && e.detail.results) {
            this.setState({visible: true});
        }
    }

    /**
     * Get decision node type name.
     * @return string
     */
    getTypeName() {
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
        let out = this.getTypeName() + 
            ' decision-node ' + 
            this.getTypeName() + '-uid-' + this.node.uid + 
            ' priority-' + this.node.priority +
            ' level-' + this.node.level + 
            (this.readOnly ? ' read-only' : '') +
            (this.node.tags.length > 0 ? ' tag-' + this.node.tags.join(' tag-') : '') +
            (this.state.visible ? '' : ' hidden')
        ;
        out = out.replaceAll('_', '-');
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
     * Get list of option buttons to include with this node.
     * @return {Array}
     */
    getOptions() {
        let options = [];
        let addOption = function(name, label, callback) {
            options.push([name, label, callback]);
        };
        Events.dispatch(
            'node_options',
            {
                node: this.node,
                call: addOption                
            }
        );
        return options;
    }

    /**
     * Render additional options.
     * @returns 
     */
    renderOptions() {
        let options = this.getOptions();
        let optionElements = [];
        for (let i in options) {
            optionElements.push(
                <a key={options[i][0]} href='#' className={'node-option node-option-' + options[i][0]} onClick={options[i][2]}>{options[i][1]}</a>
            );
        }
        if (optionElements.length == 0) {
            return null;
        }
        return <div className='options'>{optionElements}</div>;
    }

    /**
     * {@inheritdoc}
     */
    render() {
        return null;
    }

}