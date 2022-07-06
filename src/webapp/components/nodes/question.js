import React from 'react';
import UserData from '../../user_data';
import Events from '../../events'
import AnswerNode from '../../nodes/answer';
import BaseNode from '../../nodes/base';
import RuleNode, { RULE_TYPE_VALIDATION } from '../../nodes/rule';
import QuestionNode, {DECISION_FORM_TYPE_TEXT, DECISION_FORM_TYPE_CHOICE, DECISION_FORM_TYPE_DROPDOWN, DECISION_FORM_TYPE_UPLOAD} from '../../nodes/question';
import QuestionFileComponent from '../question_file';
import BaseNodeComponent from './base';

export default class QuestionNodeComponent extends BaseNodeComponent {

    constructor(props) {
        super(props);
        this.state.answers = [];
        this.state.textInput = ''
        if (this.node.type == DECISION_FORM_TYPE_TEXT) {
            this.state.answers = [''];
        }
        this.checkValidation = false;
        if (typeof(props.checkValidation) != 'undefined') {
            this.checkValidation = props.checkValidation;
        }
        this.state.disabled = this.readOnly;
        if (this.userData) {
            let answers = this.getAnswerValues(this.userData);
            if (answers.toString() != this.state.answers.toString()) {
                this.checkValidation = true;
                this.state.answers = answers;
                this.state.textInput = answers.length > 0 ? answers[0] : '';
            }
        }
        this.state.messages = this.userData ? this.userData.getValidationMessages(this.node, this.matrix) : [];
        this.state.valid = this.checkValidation && this.state.messages.length == 0;
        this.timeout = null;
        this.onChange = this.onChange.bind(this);
        this.onPreSubmit = this.onPreSubmit.bind(this);
        this.onPostSubmit = this.onPostSubmit.bind(this);
        this.onChangeTimeout = this.onChangeTimeout.bind(this);
    }

    /**
     * {@inheritdoc}
     */
    componentDidMount() {
        super.componentDidMount();
        Events.listen('pre_submit', this.onPreSubmit);
        Events.listen('post_submit', this.onPostSubmit);
    }

    /**
     * {@inheritdoc}
     */
    componentWillUnmount() {
        super.componentWillUnmount();
        Events.remove('pre_submit', this.onPreSubmit);
        Events.remove('post_submit', this.onPostSubmit);
    }

    /**
     * Get answer values from user data.
     * @param {UserData} userData 
     */
    getAnswerValues(userData) {
        let values = userData.getQuestionAnswers(this.node, this.matrix);
        if (values.length == 0 && this.node.type == DECISION_FORM_TYPE_TEXT) {
            values = [''];
        }
        return values;
    }

    /**
     * {@inheritdoc}
     */
    onUpdate(e) {
        super.onUpdate(e);
        let answers = this.getAnswerValues(e.detail.userData, this.matrix);
        this.setState({answers: answers, textInput: answers.length > 0 ? answers[0] : ''});
    }

    /**
     * Event handler for when user updates form field.
     * @param {Event} e 
     */
    onChange(e) {
        switch (this.node.type) {
            case DECISION_FORM_TYPE_UPLOAD: {
                this.checkValidation = true;
                if (e.target.files.length > 0) {
                    let reader = new FileReader();
                    reader.readAsBinaryString(e.target.files[0]);
                    let t = this;
                    let fileName = e.target.files[0].name;
                    let fileType = e.target.files[0].type;
                    reader.onload = function() {
                        Events.dispatch(
                            'change',
                            {
                                question: t.node,
                                answer: fileName + '|' + fileType + '|' + Buffer.from(reader.result, 'utf8').toString('base64'),
                                multiple: true,
                                delete: false,
                                matrix: this.matrix                      
                            }
                        );
                    };
                    reader.onerror = function() {
                        console.log('ERROR: Upload failed.', e);
                    }
                }
                e.target.value = '';
                break;
            }
            case DECISION_FORM_TYPE_TEXT: {
                clearTimeout(this.timeout);
                let value = e.target.value;
                this.setState({textInput: value});
                this.timeout = setTimeout(
                    this.onChangeTimeout,
                    500,
                    {
                        question: this.node,
                        answer: value,
                        multiple: this.node.multiple,
                        delete: this.node.type == DECISION_FORM_TYPE_CHOICE && !e.target.checked,
                        matrix: this.matrix
                    }
                );
                break;
            }
            default: {
                this.checkValidation = true;
                Events.dispatch(
                    'change',
                    {
                        question: this.node,
                        answer: e.target.value,
                        multiple: this.node.multiple,
                        delete: this.node.type == DECISION_FORM_TYPE_CHOICE && !e.target.checked,
                        matrix: this.matrix
                    }
                );
                break;
            }
        }
    }

    /**
     * @param {object} data
     */
    onChangeTimeout(data) {
        clearTimeout(this.timeout);
        this.checkValidation = true;
        Events.dispatch('change', data);
    }

    /**
     * Fires when form submission is started.
     * @param {Event} e 
     */
    onPreSubmit(e) {
        this.checkValidation = true;
        this.setState({disabled: true});
    }
    
    /**
     * Fires when form submission is complete (success or fail).
     * @param {Event} e 
     */
    onPostSubmit(e) {
        this.setState({disabled: false});
    }
    
    /**
     * {@inheritdoc}
     */
    onPreRuleEvaluation(e) {
        super.onPreRuleEvaluation(e);
        this.setState({valid: true, messages: []});
    }

    /**
     * {@inheritdoc}
     */
    onRuleEvaluation(e) {
        if (
            !(e.detail.node instanceof BaseNode) ||
            !(e.detail.rule instanceof RuleNode) ||
            e.detail.node.uid != this.node.uid
        ) {
            return;
        }
        super.onRuleEvaluation(e);
        if (this.userData) {
            let messages = this.userData.getValidationMessages(this.node, this.matrix);
            if (messages.length > 0) {
                this.setState({
                    valid: false,
                    messages: messages
                });
            }
        }
    }

    /**
     * @inheritdoc
     */
    getTypeName() {
        return 'decision_question';
    }

    /**
     * @inheritdoc
     */
    getClass() {
        let out = super.getClass() + 
            ' ' + this.getTypeName() + '-' + this.node.type
        ;
        if (!this.state.valid && this.checkValidation) {
            out += ' error';
        }
        for (let i in this.node.children) {
            let child = this.node.children[i];
            if (child instanceof DecisionRule && child.type == RULE_TYPE_VALIDATION) {
                let key = child.getName().toLowerCase().replaceAll(' ', '-');
                out += ' validate-' + key;
            }
        }
        out = out.replaceAll('_', '-');
        return out;
    }

    /**
     * @return {string}
     */
    getMessageClass() {
        return 'message' + ((this.checkValidation && this.state.messages.length > 0) ? '' : ' hidden');
    }

    /**
     * Get form field choices.
     * @return {object}
     */
    getChoices() {
        let out = {};
        for (let i in this.node.children) {
            if (this.node.children[i] instanceof AnswerNode) {
                if (
                    this.userData &&
                    this.userData.isHidden(this.node.children[i])
                ) {
                    continue;
                }
                out[this.node.children[i].uid] = this.node.children[i].label;
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
            case DECISION_FORM_TYPE_DROPDOWN: {
                out.push(this.renderDropdownOption('(select)', ''));
                for (let uid in choices) {
                    out.push(this.renderDropdownOption(choices[uid], uid))
                }
                break;
            }
            case DECISION_FORM_TYPE_CHOICE: {
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
            <input
                type={type}
                id={id}
                name={this.node.uid + (this.matrix ? ('-' + this.matrix) : '')}
                disabled={this.state.disabled}
                value={value}
                checked={checked}
                onChange={this.onChange}
            />
            <label htmlFor={id}>{label}</label>
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
            case DECISION_FORM_TYPE_TEXT: {
                if (this.node.textLines > 1) {
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
            case DECISION_FORM_TYPE_CHOICE: {
                return <fieldset>{this.renderChoices()}</fieldset>;
            }
            case DECISION_FORM_TYPE_DROPDOWN: {
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
            case DECISION_FORM_TYPE_UPLOAD: {
                let out = [];
                for (let i in this.state.answers) {
                    if (!this.state.answers[i]) {
                        continue;
                    }
                    let key = 'upload-' + this.node.uid + '_' + this.state.answers[i].split('|')[0];
                    out.push(<QuestionFileComponent key={key} node={this.node} data={this.state.answers[i]} />);
                }
                out.push(<input type='file' key={fieldId} disabled={this.state.disabled} id={fieldId} name={this.node.uid} onChange={this.onChange} />);
                return out;
            }
        }
        return null;
    }

    /**
     * @inheritdoc
     */
    render() {
        if (!this.state.visible) {
            return null;
        }
        let messages = [];
        if (this.checkValidation) {
            for (let i in this.state.messages) {
                messages.push(
                    <li key={this.getId() + '-message-' + i}>
                        {this.state.messages[i]}
                    </li>
                );
            }
        }
        let fieldId = 'field-' + this.node.uid + (this.matrix ? ('-' + this.matrix) : '');
        if (this.node.type == DECISION_FORM_TYPE_CHOICE) {
            return <div key={this.node.uid} className={this.getClass()} id={this.getId()}>
                <label className='field-label'>{this.node.label}</label>
                <div className='options'>{this.renderOptions()}</div>
                {this.renderField()}
                <ul className={this.getMessageClass()}>{messages}</ul>
            </div>;
        }
        return <div key={this.node.uid} className={this.getClass()} id={this.getId()}>
            <label className='field-label' htmlFor={fieldId}>{this.node.label}</label>
            <div className='options'>{this.renderOptions()}</div>
            {this.renderField()}
            <ul className={this.getMessageClass()}>{messages}</ul>
        </div>;
    }

}