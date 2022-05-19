import React from 'react';
import Events from '../events';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import 'react-quill/dist/quill.bubble.css';
import RuleEditorComponent, { RULE_MODE_BUILDER } from '../components/rule_editor';
import TypeaheadComponent from './typeahead';
import RuleNode from '../objects/rule';

const UPDATE_TIMEOUT = 250; 
export default class BuilderFormFieldComponent extends React.Component {

    constructor(props) {
        super(props);
        this.node = props.node;
        this.root = props.root;
        this.field = props.field;
        this.ruleTemplateInstanceId = '';
        this.state = {
            value: this.getValue()
        };
        this.onChange = this.onChange.bind(this);
        this.onRteChange = this.onRteChange.bind(this);
        this.onUpdateTimeout = this.onUpdateTimeout.bind(this);
        this.onRuleTemplate = this.onRuleTemplate.bind(this);
        this.timeout = null;
        this.hasUserInput = this.getValue() != '';
    }

    /**
     * {@inheritdoc}
     */
    componentDidMount() {
        Events.listen('rule_template_selection', this.onRuleTemplate);
    }

    /**
     * {@inheritdoc}
     */
    componentWillUnmount() {
        Events.remove('rule_template_selection', this.onRuleTemplate);
    }

    /**
     * @returns {string}
     */
    getFieldType() {
        return this.field[2];
    }

    /**
     * @returns {string}
     */
    getLabel() {
        return this.field[1];
    }

    /**
     * @returns {string}
     */
    getId() {
        return 'field_' + this.node.uid + '_' + this.field[0];
    }

    /**
     * @returns {string}
     */
    getValue() {
        return this.node[this.field[0]] ? this.node[this.field[0]] : '';
    }

    /**
     * @param {Event} e 
     */
    onChange(e) {
        switch (this.getFieldType()) {
            case 'text':
            case 'textarea':
            case 'number': {
                this.node[this.field[0]] = e.target.value;
                break;
            }
            case 'checkbox': {
                this.node[this.field[0]] = e.target.checked;
                break;
            }
            case 'code': {
                this.node[this.field[0]] = JSON.stringify(e);
                break;
            }
            case 'typeahead': {
                this.node[this.field[0]] = e;
                break;
            }
        }
        this.setState({
            value: this.getValue()
        });
        clearTimeout(this.timeout);
        this.hasUserInput = true;
        this.timeout = setTimeout(this.onUpdateTimeout, UPDATE_TIMEOUT);
    }

    onRteChange(content, delta, source, editor) {
        this.node[this.field[0]] = editor.getHTML();
        clearTimeout(this.timeout);
        this.hasUserInput = true;
        this.timeout = setTimeout(this.onUpdateTimeout, UPDATE_TIMEOUT);
    }

    onUpdateTimeout() {
        clearTimeout(this.timeout);
        Events.dispatch('update', this.node);
    }

    /**
     * Fires when rule template is selected.
     * @param {Event} e 
     */
    onRuleTemplate(e) {
        if (
            !(this.node instanceof RuleNode) ||
            (
                this.hasUserInput && (
                    this.node[this.field[0]] && this.node[this.field[0]] != 'Rule ' + this.node.uid) &&
                    this.node[this.field[0]] != e.detail.label
                )
        ) {
            return;
        }
        if (!this.ruleTemplateInstanceId) {
            this.ruleTemplateInstanceId = e.detail.instanceId;
        }
        if (this.ruleTemplateInstanceId != e.detail.instanceId) {
            return;
        }
        switch (this.field[0]) {
            case 'label': {
                this.node[this.field[0]] = e.detail.label;
                this.setState({
                    value: this.node[this.field[0]]
                });
                this.hasUserInput = false;
                break;
            }
        }
    }

    /**
     * {@inheritdoc}
     */
     render() {
        switch (this.getFieldType()) {
            case 'text': {
                return <div className='build-field text'>
                    <label htmlFor={this.getId()}>{this.getLabel()}</label>
                    <input type='text' id={this.getId()} value={this.getValue()} onChange={this.onChange} />
                </div>;
            }
            case 'textarea': {
                return <div className='build-field textarea'>
                    <label htmlFor={this.getId()}>{this.getLabel()}</label>
                    <textarea id={this.getId()} onChange={this.onChange} value={this.getValue()} />
                </div>;
            }
            case 'checkbox': {
                return <div className='build-field checkbox'>
                    <label htmlFor={this.getId()}>{this.getLabel()}</label>
                    <input type='checkbox' id={this.getId()} checked={this.getValue()} onChange={this.onChange} />
                </div>;
            }
            case 'number': {
                return <div className='build-field number'>
                    <label htmlFor={this.getId()}>{this.getLabel()}</label>
                    <input type='number' id={this.getId()} value={this.getValue()} onChange={this.onChange} />
                </div>;
            }
            case 'richtext': {
                let buttons = {};
                Events.dispatch(
                    'quill_custom_buttons',
                    {
                        add: function(name, callback) {
                            buttons[name] = callback;
                        }
                    }
                );
                let modules = {
                    toolbar: {
                        container: [
                            [{ 'header': [1, 2, 3, false] }],
                            ['bold', 'italic', 'underline','strike', 'blockquote'],
                            [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
                            ['link'],
                            Object.keys(buttons),
                            ['clean'],
                        ],
                        handlers: buttons
                    }
                };
                return <div className='build-field richtext'>
                    <label>{this.getLabel()}</label>
                    <ReactQuill
                        onChange={this.onRteChange}
                        value={this.getValue()}
                        modules={modules}
                    />
                </div>;
            }
            case 'code': {
                let data = {};
                try { data = JSON.parse(this.getValue()) } catch {};
                return <div className='build-field code'>
                    <label>{this.getLabel()}</label>
                    <RuleEditorComponent
                        id={this.getId()}
                        onChange={this.onChange}
                        data={data}
                        root={this.root}
                        mode={RULE_MODE_BUILDER}
                    />
                </div>;
            }
            case 'typeahead': {
                return <div className='build-field typeahead'>
                    <label>{this.getLabel()}</label>
                    <TypeaheadComponent
                        root={this.root}
                        value={this.node[this.field[0]]}
                        onChange={this.onChange}
                    />
                </div>;
            }
        }
    }

}