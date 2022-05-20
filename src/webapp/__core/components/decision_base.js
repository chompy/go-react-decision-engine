import React from 'react';
import shortcode from '../lib/shortcode-parser';
import Events from '../events';
import DecisionRule, { RULE_TYPE_VISIBILITY } from '../decision_objects/rule';
import DecisionBase from '../decision_objects/base';

export default class DecisionBaseComponent extends React.Component {

    constructor(props) {
        super(props);
        this.object = props.object;
        this.userData = typeof props.userData == 'undefined' ? null : props.userData;
        this.readOnly = typeof props.readOnly == 'undefined' ? false : props.readOnly;
        this.matrix = props.matrix;
        this.state = {
            visible: this.userData ? !this.userData.isHidden(this.object, null, this.matrix) : !this.object.hasRuleOfType(RULE_TYPE_VISIBILITY)
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
     * Fires when a decision object is updated.
     * @param {Event} e 
     */
    onUpdate(e) {
        if (
            typeof(e.detail.object.instanceId) == 'undefined' || 
            e.detail.object.instanceId != this.object.instanceId
        ) { 
            return;
        }
        this.userData = e.detail.userData;
    }

    /**
     * Fires before rules are evaluated.
     * @param {Event} e 
     */
    onPreRuleEvaluation(e) {
        if (e.detail.object.instanceId != this.object.instanceId) {
            return;
        }
        for (let i in this.object.children) {
            let child = this.object.children[i];
            if (child instanceof DecisionRule && (!child.type || child.type == RULE_TYPE_VISIBILITY)) {
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
            !(e.detail.object instanceof DecisionBase) ||
            !(e.detail.rule instanceof DecisionRule) ||
            e.detail.object.instanceId != this.object.instanceId ||
            e.detail.object.uid != this.object.uid
        ) {
            return;
        }
        if ((!e.detail.rule.type || e.detail.rule.type == RULE_TYPE_VISIBILITY) && e.detail.results) {
            this.setState({visible: true});
        }
    }

    /**
     * Get decision object type name.
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
        return (this.getTypeName() + '-' + this.object.uid + (this.matrix ? ('-' + this.matrix) : '')).replace('_', '-');
    }

    /**
     * Get element class.
     * @return string
     */
    getClass() {
        let out = this.getTypeName() + 
            ' decision-object ' + 
            this.getTypeName() + '-uid-' + this.object.uid + 
            ' priority-' + this.object.priority +
            ' level-' + this.object.level + 
            (this.readOnly ? ' read-only' : '') +
            (this.object.tags.length > 0 ? ' tag-' + this.object.tags.join(' tag-') : '') +
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
     * Get list of option buttons to include with this object.
     * @return {Array}
     */
    getOptions() {
        let options = [];
        let addOption = function(name, label, callback) {
            options.push([name, label, callback]);
        };
        Events.dispatch(
            'object_options',
            {
                object: this.object,
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
                <a key={options[i][0]} href='#' className={'object-option object-option-' + options[i][0]} onClick={options[i][2]}>{options[i][1]}</a>
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