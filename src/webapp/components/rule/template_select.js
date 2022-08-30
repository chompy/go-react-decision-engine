import React from 'react';
import BackendAPI from '../../api';
import { MSG_NO_RULE_TEMPLATES } from '../../config';
import RuleNode from '../../nodes/rule';
import RuleEngine from '../../rule_engine';
import RuleTemplateCollector from '../../rule_template_collector';
import RuleEditorFormFieldComponent from './form_field';

export default class RuleEditorTemplateSelectComponent extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            templateId: props?.value ? props.value?.template : null,
            loading: true
        };
        this.formNode = props?.formNode;
        this.templateList = {};
        this.templateFields = [];
        this.fieldValues = props?.value ? props.value?.fieldValues : {};
        this.externalOnChange = props?.onChange;
        this.onListResponse = this.onListResponse.bind(this);
        this.onTemplateSelect = this.onTemplateSelect.bind(this);
        this.onFieldChange = this.onFieldChange.bind(this);
        this.onTemplateFetch = this.onTemplateFetch.bind(this);
    }

    /**
     * {@inheritdoc}
     */
    componentDidMount() {
        this.setState({loading: true});
        BackendAPI.get(
            'rule_template/list_all', null, this.onListResponse
        );
    }

    /**
     * @param {Object} res 
     */
    onListResponse(res) {
        if (!res.success) {
            console.error('> ERROR: Rule template list fetch failed.', res);
            this.setState({loading: false});
            return;
        }
        this.templateList = res.data;
        if (this.state.templateId) {
            this.onTemplateSelect({target: {value: this.state.templateId}});
            return;
        }
        this.setState({loading: false});
    }

    /**
     * Event that fires when template selection changes.
     * @param {Event} e 
     */
    onTemplateSelect(e) {
        if (!e.target.value) {
            this.templateFields = [];
            this.setState({templateId: e.target.value, loading: false}, function() {
                this.updateValue();
            }.bind(this));
            return;
        }
        let templateScript = RuleTemplateCollector.getScript(e.target.value);
        if (!templateScript) {
            this.setState({templateId: e.target.value, loading: true});
            RuleTemplateCollector.fetch([e.target.value], this.onTemplateFetch);
            return;
        }
        this.fetchFields(e.target.value);
        this.setState({templateId: e.target.value, loading: false}, function() {
            this.updateValue();
        }.bind(this));
    }

    /**
     * @param {String} field 
     * @param {*} value 
     */
    onFieldChange(field, value) {
        this.fieldValues[field.name] = value;
        this.updateValue();
    }

    /**
     * @param {Object} res 
     */
    onTemplateFetch(res) {
        if (!res.success) {
            console.error('> ERROR: Rule template fetch failed.', res);
            this.setState({loading: false});
            return;
        }
        let templateId = res?.data[0]?.data?.id;
        if (templateId) {
            this.fetchFields(templateId);
        }
        this.setState({loading: false});
        this.updateValue();
    }

    updateValue() {
        if (!this.externalOnChange) { return; }
        let value = {
            template: this.state.templateId,
            fieldValues: this.fieldValues
        };
        this.externalOnChange(value);
    }

    fetchFields(templateId) {
        if (!templateId) { return; }
        let re = new RuleEngine;
        let rule = new RuleNode;
        rule.uid = 'TEMPLATE_SELECT';
        rule.templateData = {
            template: templateId,
            fieldValues: this.fieldValues
        };
        try {
            re.setRuleNode(rule);
            re.evaluate();
        } catch (e) {
            console.error('> ERROR: Lua script threw exception.', e);
        }
        this.templateFields = re.fields;
    }

    renderFields() {
        let out = [];
        for (let i in this.templateFields) {
            let field = this.templateFields[i];
            out.push(
                <RuleEditorFormFieldComponent
                    key={'rule_field_' + this.state.templateId + '_' + i}
                    field={field}
                    value={field.name in this.fieldValues ? this.fieldValues[field.name] : null}
                    formNode={this.formNode}
                    onChange={this.onFieldChange}
                />
            );
        }
        return out;
    }

    /**
     * {@inheritdoc}
     */
    render() {
        if (this.state.loading) {
            return <div className='rule-template-select loading'></div>;
        }
        let templateElements = [];
        for (let id in this.templateList) {
            let label = this.templateList[id];
            templateElements.push(
                <option key={'template_option_' + id} value={id}>{label}</option>
            );
        }
        if (templateElements.length == 0) {
            return <em className='rule-template-select none'>{MSG_NO_RULE_TEMPLATES}</em>;
        }
        return <div className='rule-template-select'>
            <select id={this.id + "-template-select"} onChange={this.onTemplateSelect} value={this.state.templateId}>
                <option value=''>Select Template...</option>
                {templateElements}
            </select>
            <div className='fields'>{this.renderFields()}</div>
        </div>;
    }

}
