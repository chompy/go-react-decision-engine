import React from 'react';
import Events from '../../events';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import 'react-quill/dist/quill.bubble.css';
import TypeaheadComponent from '../helper/typeahead';
import RuleEditorTemplateSelectComponent from '../rule/template_select';

const UPDATE_TIMEOUT = 250; 

export const FIELD_TYPE_TEXT = 'text';
export const FIELD_TYPE_TEXTAREA = 'textarea';
export const FIELD_TYPE_NUMBER = 'number';
export const FIELD_TYPE_CHECKBOX = 'checkbox';
export const FIELD_TYPE_CODE = 'code';
export const FIELD_TYPE_TYPEAHEAD = 'typeahead';
export const FIELD_TYPE_RICHTEXT = 'richtext';
export const FIELD_TYPE_CHOICE = 'choice';
export const FIELD_TYPE_RULE_TEMPLATE = 'rule_template';

export default class BuilderFormFieldComponent extends React.Component {

    constructor(props) {
        super(props);
        this.node = props.node;
        this.root = props.root;
        this.field = props.field;
        this.formNode = props?.formNode ? props.formNode : this.root;
        this.state = {
            value: this.getValue()
        };
        this.onChange = this.onChange.bind(this);
        this.onRteChange = this.onRteChange.bind(this);
        this.onUpdateTimeout = this.onUpdateTimeout.bind(this);
        this.timeout = null;
        this.hasUserInput = this.getValue() != '';
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
            case FIELD_TYPE_TEXT:
            case FIELD_TYPE_TEXTAREA:
            case FIELD_TYPE_NUMBER:
            case FIELD_TYPE_CHOICE: {
                this.node[this.field[0]] = e.target.value;
                break;
            }
            case FIELD_TYPE_CHECKBOX: {
                this.node[this.field[0]] = e.target.checked;
                break;
            }
            case FIELD_TYPE_CODE:
            case FIELD_TYPE_RULE_TEMPLATE: {
                this.node[this.field[0]] = e;
                break;
            }
            case FIELD_TYPE_TYPEAHEAD: {
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
     * {@inheritdoc}
     */
     render() {
        switch (this.getFieldType()) {
            case FIELD_TYPE_TEXT: {
                return <div className={'build-field ' + this.getFieldType()}>
                    <label htmlFor={this.getId()}>{this.getLabel()}</label>
                    <input type='text' id={this.getId()} value={this.getValue()} onChange={this.onChange} />
                </div>;
            }
            case FIELD_TYPE_TEXTAREA: {
                return <div className={'build-field ' + this.getFieldType()}>
                    <label htmlFor={this.getId()}>{this.getLabel()}</label>
                    <textarea id={this.getId()} onChange={this.onChange} value={this.getValue()} />
                </div>;
            }
            case FIELD_TYPE_CHECKBOX: {
                return <div className={'build-field ' + this.getFieldType()}>
                    <label htmlFor={this.getId()}>{this.getLabel()}</label>
                    <input type='checkbox' id={this.getId()} checked={this.getValue()} onChange={this.onChange} />
                </div>;
            }
            case FIELD_TYPE_NUMBER: {
                return <div className={'build-field ' + this.getFieldType()}>
                    <label htmlFor={this.getId()}>{this.getLabel()}</label>
                    <input type='number' id={this.getId()} value={this.getValue()} onChange={this.onChange} />
                </div>;
            }
            case FIELD_TYPE_CHOICE: {
                let items = [];
                if (this.field.length >= 4) {
                    for (let i in this.field[3]) {
                        items.push(
                            <option
                                key={this.getId() + '-opt-' + this.field[3][i]}
                                value={this.field[3][i]}
                            >
                                {this.field[3][i]}
                            </option>
                        );
                    }
                }
                return <div className={'build-field ' + this.getFieldType()}>
                    <label htmlFor={this.getId()}>{this.getLabel()}</label>
                    <select id={this.getId()} value={this.getValue()} onChange={this.onChange}>{items}</select>
                </div>;
            }
            case FIELD_TYPE_RICHTEXT: {
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
                return <div className={'build-field ' + this.getFieldType()}>
                    <label>{this.getLabel()}</label>
                    <ReactQuill
                        onChange={this.onRteChange}
                        value={this.getValue()}
                        modules={modules}
                    />
                </div>;
            }
            case FIELD_TYPE_CODE:
            case FIELD_TYPE_RULE_TEMPLATE: {
                return <div className={'build-field ' + this.getFieldType()}>
                    <label>{this.getLabel()}</label>
                    <RuleEditorTemplateSelectComponent
                        value={this.getValue()}
                        onChange={this.onChange}
                        formNode={this.formNode}
                    />
                </div>;
            }
            case FIELD_TYPE_TYPEAHEAD: {
                return <div className={'build-field ' + this.getFieldType()}>
                    <label>{this.getLabel()}</label>
                    <TypeaheadComponent
                        id={this.formNode.uid}
                        version={this.formNode.version}
                        value={this.node[this.field[0]]}
                        onChange={this.onChange}
                    />
                </div>;
            }
        }
    }

}