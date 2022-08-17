
import React from 'react';
import RuleFormField, { RULE_FIELD_ANSWER, RULE_FIELD_CHOICE, RULE_FIELD_NODE } from '../../rule_field';
import BaseNode from '../../nodes/base';
import TypeaheadComponent from '../helper/typeahead';

export default class RuleEditorFormFieldComponent extends React.Component {

    constructor(props) {
        super(props);
        this.id = 'rf-' + BaseNode.generateUid();
        this.field = new RuleFormField('unknown');
        this.formNode = props?.formNode;
        if (props?.field instanceof RuleFormField) {
            this.field = props.field;
        }
        this.state = {
            value: props.value ? props.value : this.field.default
        };
        this.externalOnChange = typeof props.onChange != 'undefined' ? props.onChange : null;
        this.onChange = this.onChange.bind(this);
    }

    /**
     * @param {*} e 
     */
    onChange(e) {
        switch (this.field.type) {
            case RULE_FIELD_NODE:
            case RULE_FIELD_ANSWER: {
                this.setState({value: e});
                if (this.externalOnChange) {
                    this.externalOnChange(this.field, e);
                }
                break;
            }
            default: {
                this.setState({value: e.target.value});
                if (this.externalOnChange) {
                    this.externalOnChange(this.field, e.target.value);
                }
                break;
            }
        }
    }

    renderField() {
        switch (this.field.type) {
            case RULE_FIELD_NODE:
            case RULE_FIELD_ANSWER: {
                return <TypeaheadComponent
                    id={this.formNode ? this.formNode.uid : null}
                    version={this.formNode ? this.formNode.version : 0}
                    value={this.state.value}
                    onChange={this.onChange}
                />;
            }
            case RULE_FIELD_CHOICE: {
                let options = [];
                for (let key in this.field.options) {
                    options.push(
                        <option key={this.id + '-choice-' + key} value={key}>{this.field.options[key]}</option>
                    );
                }
                return <select
                    name={this.id + '-input'}
                    id={this.id + '-input'}
                    value={this.state.value ? this.state.value : ''}
                    onChange={this.onChange}
                >{options}</select>;
            }
            default: {
                return <input
                    type="text"
                    name={this.id + '-input'}
                    id={this.id + '-input'}
                    value={this.state.value ? this.state.value : ''}
                    onChange={this.onChange}
                />;
            }
        }
    }

    render() {
        return <div className="rule-form-field" id={this.id}>
            <label htmlFor={this.id + '-input'}>{this.field.name}</label>
            {this.renderField()}
        </div>;
    }

}
