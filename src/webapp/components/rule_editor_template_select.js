import React from 'react';
import Events from '../events';

export default class RuleEditorTemplateSelectComponent extends React.Component {

    constructor(props) {
        super(props);
        this.id = props.id ? props.id : 'rule-editor-template-select';
        this.state = {
            value: props.value ? props.value : '',
            templates: {}
        };
        this.externalOnChange = props.onChange;
        this.initialSet = false;
        this.onChange = this.onChange.bind(this);
        this.onScriptChange = this.onScriptChange.bind(this);
        this.setTemplates = this.setTemplates.bind(this);
    }

    /**
     * {@inheritdoc}
     */
    componentDidMount() {
        Events.listen('rule_editor_update', this.onScriptChange);
        Events.dispatch('request_rule_editor_templates', {
            set: this.setTemplates
        });
    }

    /**
     * {@inheritdoc}
     */
    componentWillUnmount() {
        Events.remove('rule_editor_update', this.onScriptChange);
    }

    /**
     * {@inheritdoc}
     */
    componentDidUpdate() {
        if (
            this.externalOnChange &&
            !this.initialSet &&
            this.state.value && 
            this.state.templates && 
            this.state.value in this.state.templates
        ) {
            this.initialSet = true;
            this.externalOnChange(
                this.state.value, 
                this.state.templates[this.state.value]
            );
        }
    }

    /**
     * Event that fires when template selection changes.
     * @param {Event} e 
     */
    onChange(e) {
        if (
            this.externalOnChange &&
            !this.externalOnChange(
                e.target.value,
                e.target.value in this.state.templates ? this.state.templates[e.target.value] : null
            )
        ) {
            return;
        }
        this.setState({
            value: e.target.value
        });
    }

    /**
     * Set templates.
     * @param {Object} v 
     */
    setTemplates(v) {
        this.setState({
            templates: v
        });
    }

    /**
     * Fires when user changes the rule script.
     * @param {Event} e 
     */
    onScriptChange(e) {
        if (e.detail.hash) {
            this.setState({
                value: e.detail.hash
            });
            return;
        }
        this.setState({
            value: ''
        });
    }

    /**
     * {@inheritdoc}
     */
     render() {
        let templateElements = [];
        for (let i in this.state.templates) {
            let template = this.state.templates[i];
            templateElements.push(
                <option key={this.id + '_template_option_' + template.hash} value={template.hash}>{template.name}</option>
            );
        }
        if (templateElements.length == 0) {
            return null;
        }
        return <div className='rule-template-select'>
            <select id={this.id + "-template-select"} onChange={this.onChange} value={this.state.value}>
                <option>Select Template...</option>
                {templateElements}
            </select>
        </div>;
    }

}
