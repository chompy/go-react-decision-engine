import React from 'react';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-lua';
import 'ace-builds/src-noconflict/theme-github';
import RuleTemplateSelectComponent from './template_select';
import Events from '../../core/events';
import md5 from 'blueimp-md5';
import RuleTesterComponent from './tester';
import RuleEngine from '../../core/rule_engine';
import DecisionBase from '../../core/decision_objects/base';
import DecisionRule from '../../core/decision_objects/rule';
import DecisionUserData from '../../core/decision_user_data';
import RuleFormField from '../../core/rule_field';
import RuleFormFieldComponent from './rule_form_field';

export const RULE_MODE_NONE = '';
export const RULE_MODE_BUILDER = 'builder';
export const RULE_MODE_IBEXA = 'ibexa';
export const RULE_MODE_TEMPLATE_BUILDER = 'template-builder';

export default class RuleEditorComponent extends React.Component {

    constructor(props) {
        super(props);
        this.instanceId = DecisionBase.generateUid();
        this.id = props.id ? props.id : 'rule-editor';
        let value = typeof props.data.value != 'undefined' ? props.data.value.toString() : '';
        this.state = {
            value: value,
            hash: md5(value),
            fields: typeof props.data.fields != 'undefined' ? props.data.fields : {}
        };
        this.mode = props.mode ? props.mode : RULE_MODE_NONE;
        this.root = props.root ? props.root : null;
        this.ruleEngine = new RuleEngine;
        if (value) {
            this.processRuleFields(this.state.value, this.state.fields);
        }
        this.template = null;
        this.changeTimeout = null;
        this.externalOnChange = props.onChange;
        this.onTemplateSelection = this.onTemplateSelection.bind(this);
        this.onSet = this.onSet.bind(this);
        this.onChange = this.onChange.bind(this);
        this.fetchCallback = this.fetchCallback.bind(this);
        this.processRuleFields = this.processRuleFields.bind(this);
        this.onRuleFieldChange = this.onRuleFieldChange.bind(this);
        this.isUserModified = false;
    }

    /**
     * {@inheritdoc}
     */
    componentDidMount() {
        Events.dispatch('rule_editor_init', {
            set: this.onSet
        });
    }

    /**
     * Fires when a template is selected.
     * @param {string} name 
     * @param {object} template
     * @returns {boolean}
     */
    onTemplateSelection(hash, template) {
        let label = template ? template.name : '';
        let script = template ? template.script : '';
        let eventParams = {
            instanceId: this.instanceId,
            hash: hash,
            template: template,
            label: label,
            script: script
        };
        if (this.isUserModified && this.state.value != script) {
            let ask = confirm('This will overwrite the current script. Are you sure?');
            if (!ask) {
                return false;
            }
            this.template = template;
            this.onChange(script, true);
            Events.dispatch('rule_template_selection', eventParams);
            return true;
        }
        this.template = template;
        this.onChange(script, true);
        Events.dispatch('rule_template_selection', eventParams);
        return true;
    }

    /**
     * Fires when 'set' method is fired, passed via 'rule_editor_init' event.
     * @param {Object} data 
     * @param {string} mode
     */
    onSet(data, mode) {
        let value = typeof data.value != 'undefined' ? data.value.toString() : '';
        let hash = md5(value)
        let fields = typeof data.fields != 'undefined' ? data.fields :  {};
        if (mode) {
            this.mode = mode;
        }
        this.processRuleFields(value, fields);
        this.setState({
            value: value,
            hash: hash,
            fields: fields
        });
    }

    /**
     * Fires when user modifys script.
     * @param {string} value
     * @param {boolean} notUserModified
     */
    onChange(value, notUserModified) {
        if (typeof notUserModified != 'boolean') {
            notUserModified = false;
        }
        let onChangeTimeout = function(value, notUserModified) {
            this.isUserModified = !notUserModified;
            let hash = md5(value);
            this.setState({
                value: value,
                hash: hash
            });
            let data = {
                id: this.id,
                value: value,
                hash: hash,
                fields: this.state.fields,
                template: (this.template && this.template.script == value) ? this.template.id : null
            };
            this.processRuleFields(value, this.state.fields);
            Events.dispatch('rule_editor_update', data);
            if (this.externalOnChange) {
                this.externalOnChange(data);
            }
        }
        onChangeTimeout = onChangeTimeout.bind(this);
        clearTimeout(this.onChangeTimeout);
        this.onChangeTimeout = setTimeout(onChangeTimeout, 500, value, notUserModified);
    }

    /**
     * @returns {string}
     */
    fetchCallback() {
        return {
            script: this.state.value,
            fields: this.state.fields,
            template: (this.template && this.template.script == this.state.value) ? this.template.id : null
        };
    }

    /**
     * Evaluate current rule to process fields.
     * @param {string} script
     */
    processRuleFields(script, values) {
        this.ruleEngine.fields = [];
        this.ruleEngine.fieldValues = values;
        if (!script) {
            return;
        }
        let rule = new DecisionRule('_TEST');
        rule.script = script;
        this.ruleEngine.setUserData(new DecisionUserData);
        try { this.ruleEngine.setRuleObject(rule); } catch {};
    }

    /**
     * @param {RuleFormField} field
     * @param {*} value 
     */
    onRuleFieldChange(field, value) {
        let onStateChange = function() {
            let data = {
                id: this.id,
                value: this.state.value,
                hash: this.state.hash,
                fields: this.state.fields,
                template: (this.template && this.template.script == this.state.value) ? this.template.id : null
            };
            Events.dispatch('rule_editor_update', data);
            if (this.externalOnChange) {
                this.externalOnChange(data);
            }
        };
        onStateChange = onStateChange.bind(this);
        this.setState(function(state, props) {
            state.fields[field.name] = value;
            return {
                fields: state.fields
            };
        }, onStateChange);
    }

    /**
     * Render template selection.
     */
    renderTemplateSelect() {
        if (this.mode == RULE_MODE_TEMPLATE_BUILDER) {
            return null;
        }
        return <RuleTemplateSelectComponent
            id={this.id}
            value={this.state.hash}
            onChange={this.onTemplateSelection}
        />;
    }

    /**
     * Render out rule form fields.
     */
    renderFields() {
        let out = [];
        if (this.mode != RULE_MODE_TEMPLATE_BUILDER) {
            for (let i in this.ruleEngine.fields) {
                let field = this.ruleEngine.fields[i];
                if (!field.name) {
                    continue;
                }
                out.push(
                    <RuleFormFieldComponent
                        key={'ff-' + field.name + '-' +i}
                        field={field}
                        value={this.state.fields[field.name]}
                        mode={this.mode}
                        root={this.root}
                        onChange={this.onRuleFieldChange}
                    />
                );
            }
        }
        return out;
    }

    /**
     * {@inheritdoc}
     */
     render() {
        return <div className='rule-editor'>
            {this.renderTemplateSelect()}
            {this.renderFields()}
            <details>
                <summary>Rule Editor</summary>
                <AceEditor 
                    mode='lua'
                    theme='github'
                    name={this.id}
                    onChange={this.onChange}
                    value={this.state.value}
                    width='100%'
                    setOptions={{
                        useWorker: false
                    }}
                />
                <RuleTesterComponent scriptCallback={this.fetchCallback}/>
            </details>
        </div>;
    }

}
