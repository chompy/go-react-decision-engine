import React from 'react';
import AnswerNode from '../../nodes/answer';
import QuestionNode, { FIELD_CHOICE, FIELD_DROPDOWN, FIELD_TEXT, FIELD_UPLOAD } from '../../nodes/question';
import BaseNodeComponent from './base';
import QuestionFileComponent from '../question_file';
import RuleEngine from '../../rule_engine';
import RuleNode, { RULE_TYPE_VISIBILITY } from '../../nodes/rule';

export default class QuestionNodeComponent extends BaseNodeComponent {

    constructor(props) {
        super(props);
        this.state.disabled = false;
        this.state.answers = this.userData.getQuestionAnswers(this.node, this.matrix);
        this.state.messages = [];
        this.onChange = this.onChange.bind(this);
        this.onFileDelete = this.onFileDelete.bind(this);
    }

    /**
     * {@inheritDoc}
     */
    componentDidMount() {
        let hasCompiledRules = this.rules.length > 0;
        super.componentDidMount();
        // compile rules for answers
        if (!hasCompiledRules) {
            for (let i in this.node.children) {
                let child = this.node.children[i];
                if (child instanceof AnswerNode) {
                    for (let j in child.children) {
                        let rule = child.children[j];
                        if (rule instanceof RuleNode) {
                            let ruleEngine = new RuleEngine;
                            ruleEngine.matrixId = this.matrix;
                            ruleEngine.setRootNode(this.root);
                            ruleEngine.setUserData(this.userData);
                            ruleEngine.setRuleNode(rule);
                            this.rules.push(ruleEngine);
                        }
                    }
                }
            }
            if (this.rules.length > 0) {
                this.evaluateRules();
            }
        }
    }

    /**
     * Get node type name.
     * @return {String}
     */
    static getTypeName() {
        return 'question';
    }

    /**
     * {@inheritdoc}
     */
    availableChildTypes() {
        return [];
    }

    /**
     * {@inheritdoc}
     */
    evaluateRules() {
        for (let i in this.node.children) {
            let child = this.node.children[i];
            if (
                child instanceof AnswerNode &&
                child.hasRuleOfType(RULE_TYPE_VISIBILITY)
            ) {
                this.userData.setHidden(child, true, this.matrix);
            }
        }
        super.evaluateRules();
    }

    /**
     * @param {Event} e 
     */
    onChange(e) {
        switch (this.node.type) {
            case FIELD_TEXT: {
                this.userData.resetAnswers(this.node, this.matrix);
                this.userData.addAnswer(this.node, e.target.value, this.matrix);
                break;
            }
            case FIELD_CHOICE: {
                if (e.target.checked) {
                    this.userData.addAnswer(
                        this.node, e.target.value, this.matrix
                    );
                } else {
                    this.userData.removeAnswer(
                        this.node, e.target.value, this.matrix
                    );
                }
                this.setState({
                    answers: this.userData.getQuestionAnswers(this.node, this.matrix)
                });
                break;
            }
            case FIELD_DROPDOWN: {
                this.userData.resetAnswers(this.node, this.matrix);
                for (let i = 0; i < e.target.options.length; i++) {
                    if (e.target.options[i].selected) {
                        this.userData.addAnswer(this.node, e.target.options[i].value, this.matrix);
                    }
                }
                this.setState({
                    answers: this.userData.getQuestionAnswers(this.node, this.matrix)
                });
                break;                
            }
            case FIELD_UPLOAD: {
                if (e.target.files.length > 0) {
                    let reader = new FileReader();
                    reader.readAsDataURL(e.target.files[0]);
                    let fileName = e.target.files[0].name;
                    let fileType = e.target.files[0].type;
                    reader.onload = function() {
                        let data = reader.result.split(',')[1];
                        let answer = fileName + '|' + fileType + '|' + data;
                        this.userData.addAnswer(this.node, answer, this.matrix);
                        this.setState({
                            answers: this.userData.getQuestionAnswers(this.node, this.matrix)
                        });
                    };
                    reader.onload = reader.onload.bind(this);
                    reader.onerror = function() {
                        console.error('ERROR: Upload failed.', e);
                    }
                }
                e.target.value = '';
                break;
            }
        }
        if (this.callback) { this.callback(this.node, this.matrix); }
    }

    /**
     * Delete uploaded file.
     * @param {String} data 
     */
    onFileDelete(data) {
        this.userData.removeAnswer(this.node, data, this.matrix);
        this.setState({
            answers: this.userData.getQuestionAnswers(this.node, this.matrix)
        });
    }

    /**
     * Get form field choices.
     * @return {object}
     */
    getChoices() {
        let out = {};
        for (let i in this.node.children) {
            if (this.node.children[i] instanceof AnswerNode) {
                if (!this.userData.isHidden(this.node.children[i])) {
                    out[this.node.children[i].uid] = this.node.children[i].label;
                }
            }
        }
        return out;
    }

    /**
     * Render choices for a choice form field.
     * @return {object}
     */
    renderChoices() {
        let choices = this.getChoices();
        let out = [];
        switch (this.node.type) {
            case FIELD_DROPDOWN: {
                if (!this.node.multiple) {
                    out.push(this.renderDropdownOption('(select)', ''));
                }
                for (let uid in choices) {
                    out.push(this.renderDropdownOption(choices[uid], uid))
                }
                break;
            }
            case FIELD_CHOICE: {
                for (let uid in choices) {
                    out.push(this.renderCheckboxRadio(choices[uid], uid));
                }
                break;
            }
        }
        return out;
    }

    /**
     * Render a checkbox or radio button.
     * @param {string} label 
     * @param {string} value 
     * @return {*}
     */
    renderCheckboxRadio(label, value) {
        let type = 'radio';
        if (this.node.multiple) {
            type = 'checkbox';
        }
        let id = type + '-' + this.node.uid + (this.matrix ? ('-' + this.matrix) : '') + '-' + value;
        let checked = this.state.answers.indexOf(value) != -1;
        return <div key={id} className={type}>
            <label htmlFor={id} className={'pure-' + type}>
                <input
                    type={type}
                    id={id}
                    name={this.node.uid + (this.matrix ? ('-' + this.matrix) : '')}
                    disabled={this.state.disabled}
                    value={value}
                    checked={checked}
                    onChange={this.onChange}
                />
                &nbsp;{label}
            </label>
        </div>;
    }

    /**
     * Render option in dropdown.
     * @param {string} label 
     * @param {string} value
     * @return {*}
     */
    renderDropdownOption(label, value) {
        let id = 'dropdown-' + this.node.uid + '-' + value;
        return <option key={id} value={value}>{label}</option>;
    }

    /**
     * Render form field input.
     * @return {*}
     */
    renderField() {
        let fieldId = 'field-' + this.node.uid;
        switch (this.node.type) {
            case FIELD_TEXT: {
                if (this.node?.textLines > 1) {
                    return <textarea 
                        id={fieldId}
                        name={this.node.uid}
                        disabled={this.state.disabled}
                        rows={this.node.textLines}
                        onChange={this.onChange}
                        value={this.state.textInput}
                    />;
                }
                return <input
                    key={'field-' + this.node.uid}
                    type='text'
                    id={fieldId}
                    name={this.node.uid}
                    disabled={this.state.disabled}
                    value={this.state.textInput}
                    onChange={this.onChange}
                />;
            }
            case FIELD_CHOICE: {
                return <fieldset>{this.renderChoices()}</fieldset>;
            }
            case FIELD_DROPDOWN: {
                let value = this.state.answers;
                if (!this.node.multiple) {
                    value = this.state.answers[0];
                }
                return <select
                    id={this.node.uid}
                    name={fieldId}
                    disabled={this.state.disabled}
                    value={value}
                    multiple={this.node.multiple}
                    onChange={this.onChange}
                >{this.renderChoices()}</select>;
            }
            case FIELD_UPLOAD: {
                let out = [];
                for (let i in this.state.answers) {
                    if (!this.state.answers[i]) { continue; }
                    let key = 'upload-' + this.node.uid + '_' + this.state.answers[i].split('|')[0];
                    out.push(
                        <QuestionFileComponent
                            key={key}
                            id={key}
                            data={this.state.answers[i]}
                            onDelete={this.onFileDelete}
                        />
                    );
                }
                out.push(
                    <input
                        type='file'
                        key={fieldId}
                        disabled={this.state.disabled}
                        id={fieldId}
                        name={this.node.uid}
                        onChange={this.onChange}
                    />
                );
                return out;
            }
        }
        return null;
    }

    /**
     * {@inheritdoc}
     */
    render() {
        if (!(this.node instanceof QuestionNode) || !this.state.visible) { return null; }
        if (!this.contentHtml) {
            this.contentHtml = this.parseShortcode(this.node.contentEdit);
        }
        let messages = [];
        for (let i in this.state.messages) {
            let message = this.state.messages[i];
            messages.push(
                <li key={this.node.uid + '_' + message}>{message}</li>
            );
        }
        return <div className={this.getClass()}>
            <div className='tree-content pure-control-group'>
                <label>{this.node?.label}</label>
                {this.renderField()}
                <div className={'messages' + (messages.length > 0 ? '' : ' hidden')}>{messages}</div>
            </div>
        </div>;
    }

}