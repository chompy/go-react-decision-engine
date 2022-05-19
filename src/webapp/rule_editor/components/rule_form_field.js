
import React from 'react';
import DecisionTypeahead from '../../builder/components/decision_typeahead';
import DecisionBase from '../../core/decision_objects/base';
import Events from '../../core/events';
import RuleFormField, { RULE_FIELD_ANSWER, RULE_FIELD_CHOICE, RULE_FIELD_OBJECT } from '../../core/rule_field';
import { RULE_MODE_BUILDER, RULE_MODE_IBEXA } from './editor';

export default class RuleFormFieldComponent extends React.Component {

    constructor(props) {
        super(props);
        this.id = 'rf-' + DecisionBase.generateUid();
        this.field = new RuleFormField('unknown');
        this.mode = typeof props.mode != 'undefined' ? props.mode : '';
        this.root = typeof props.root != 'undefined' ? props.root : null;
        if (props.field instanceof RuleFormField) {
            this.field = props.field;
        }
        this.state = {
            value: props.value ? props.value : this.field.default
        };
        this.externalOnChange = typeof props.onChange != 'undefined' ? props.onChange : null;
        this.onChange = this.onChange.bind(this);
        this.onDoObjectSelect = this.onDoObjectSelect.bind(this);
        this.onObjectSelect = this.onObjectSelect.bind(this);
    }

    /**
     * {@inheritdoc}
     */
    componentDidMount() {
        Events.listen('rule_editor_object_select', this.onObjectSelect);
    }

    /**
     * {@inheritdoc}
     */
    componentWillUnmount() {
        Events.remove('rule_editor_object_select', this.onObjectSelect);
    }

    /**
     * @param {*} e 
     */
    onChange(e) {
        switch (this.field.type) {
            case RULE_FIELD_OBJECT:
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

    /**
     * @param {Event} e 
     */
    onDoObjectSelect(e) {
        e.preventDefault();
        let locations = [];
        if (this.state.value && this.state.value.length > 0) {
            for (let i in this.state.value) {
                if (this.state.value[i].location) {
                    locations.push(this.state.value[i].location);
                }
            }
        }
        let allowedTypes = ['decision_answer', 'decision_question'];
        if (this.field.type == RULE_FIELD_OBJECT) {
            allowedTypes.push('decision_group');
            allowedTypes.push('decision_root');
            allowedTypes.push('decision_rule');
        }
        Events.dispatch('rule_editor_do_object_select', {
            id: this.id,
            locations: locations,
            allowedTypes: allowedTypes
        });
    }

    /**
     * @param {Event} e 
     */
    onObjectSelect(e) {
        if (e.detail.id != this.id) {
            return;
        }
        let value = [];
        for (let i in e.detail.objects) {
            value.push({
                name: e.detail.objects[i].ContentInfo.Content.Name,
                uid: e.detail.objects[i].ContentInfo.Content._remoteId,
                location: e.detail.objects[i].id
            });
        }
        this.setState({value: value});
        if (this.externalOnChange) {
            this.externalOnChange(this.field, value);
        }   
    }

    renderField() {
        switch (this.field.type) {
            case RULE_FIELD_OBJECT:
            case RULE_FIELD_ANSWER: {
                switch (this.mode) {
                    case RULE_MODE_IBEXA: {
                        let values = [];
                        if (this.state.value && this.state.value.length > 0) {
                            for (let i in this.state.value) {
                                values.push(
                                    <span
                                        key={this.id + '-obj-' + i}
                                        title={this.state.value[i].uid}
                                    >
                                        {this.state.value[i].name}
                                    </span>
                                );
                            }
                        }
                        return <div>
                            <button onClick={this.onDoObjectSelect}>Select</button>
                            {values}
                        </div>;
                    }
                    case RULE_MODE_BUILDER: {
                        return <DecisionTypeahead
                            root={this.root}
                            value={this.state.value}
                            onChange={this.onChange}
                        />;
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
