import React from 'react';
import { FIELD_CHOICE, FIELD_DROPDOWN } from '../../nodes/question';
import BaseNodeComponent from './base';

export default class AnswerNodeComponent extends BaseNodeComponent {

    constructor(props) {
        super(props);
        this.question = props?.question;
        this.state.checked = this.userData.hasAnswer(this.node, this.matrix);
        this.onChange = this.onChange.bind(this);
    }

    /**
     * Get node type name.
     * @return {String}
     */
    static getTypeName() {
        return 'answer';
    }

    /**
     * {@inheritdoc}
     */
    availableChildTypes() {
        return [];
    }

    /**
     * @param {Event} e 
     */
    onChange(e) {
        //this.setState({checked: e.target.checked});
        //this.onUpdateCallback(this.node, this.matrix);

        switch (this.question.type) {
            case FIELD_CHOICE:
            {
                if (e.target.checked) {
                    this.userData.addAnswer(
                        this.question, this.node, this.matrix
                    );
                } else {
                    this.userData.removeAnswer(
                        this.question, this.node, this.matrix
                    );
                }
                this.setState({
                    checked: e.target.checked
                });
                break;
            }
            case FIELD_DROPDOWN:
            {
                console.log("TEST")
                break;
            }
        }

    }

    /**
     * {@inheritdoc}
     */
    render() {
        let label = this.node?.label ? this.node.label : this.node?.value;
        switch (this.question.type) {
            case FIELD_CHOICE:
            {
                let type = 'radio';
                if (this.question.multiple) {
                    type = 'checkbox';
                }
                let id = type + '-' + this.node.uid + (this.matrix ? ('-' + this.matrix) : '');
                return <div className={this.getClass()}>
                    <label htmlFor={id} className={'pure-' + type}>
                        <input
                            type={type}
                            id={id}
                            name={this.node.uid + (this.matrix ? ('-' + this.matrix) : '')}
                            disabled={this.state.disabled}
                            value={this.node.uid}
                            checked={this.state.checked}
                            onChange={this.onChange}
                        />
                        &nbsp;{label}
                    </label>
                </div>;
            }
            case FIELD_DROPDOWN:
            {
                return <option value={this.node.uid} selected={this.state.checked}>{label}</option>;
            }
        }
    }

}