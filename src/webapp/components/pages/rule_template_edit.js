import React from 'react';
import { faBackward, faTrash } from '@fortawesome/free-solid-svg-icons'
import BasePageComponent from './base';
import { BTN_BACK, BTN_DELETE, MSG_DISPLAY_TIME, MSG_RULE_TEMPLATE_DELETED, MSG_SAVED, MSG_SAVING } from '../../config';
import BackendAPI from '../../api';
import EditTitleComponent from '../helper/edit_title';
import { message as msgPopup } from 'react-message-popup';
import RuleTemplateEditorComponent from '../rule/template_editor';

export default class RuleTemplateEditPageComponent extends BasePageComponent {

    constructor(props) {
        super(props);
        this.state.title = '';
        this.state.loading = true;
        this.state.ruleTemplate = null;
        this.state.script = '';
        this.saveTimeout = null;
    }

    /**
     * {@inheritdoc}
     */
    static getName() {
        return 'rule-template-edit';
    }

    /**
     * {@inheritdoc}
     */
    onReady() {
        this.setState({loading: true});
        let ruleTemplateId = this.props.path?.id;
        if (!ruleTemplateId) {
            console.error('> ERROR: Missing ID parameter.')
            this.setState({error: ERR_NOT_FOUND});
            return;
        }
        BackendAPI.get(
            'rule_template/fetch',
            {id: ruleTemplateId},
            this.onApiResponse
        );
    }

    /**
     * @param {Object} res 
     */
    onApiResponse(res) {
        this.handleErrorResponse(res);
        this.setState({
            title: res.data.label,
            ruleTemplate: res.data,
            script: res.data.script
        });
        this.setTitle(res.data.label);
        this.setLoaded();
    }

    /**
     * @param {Event} e 
     */
    onClickBack(e) {
        e.preventDefault();
        this.onSave();
        this.gotoReferer();
    }

    /**
     * @param {String} value 
     */
    onLabel(value) {
        this.setState({title: value});
        this.setTitle(value);
        BackendAPI.post(
            'rule_template/store', null, {
                id: this.state.ruleTemplate.id,
                label: value
            },
            this.onLabelResponse
        );
    }

    /**
     * @param {Object} res 
     */
    onLabelResponse(res) {
        if (this.handleErrorResponse(res)) { return; }
    }

    /**
     * @param {String} value 
     */
    onChange(value) {
        clearTimeout(this.saveTimeout);
        this.setState({script: value});
        this.saveTimeout = setTimeout(this.onSave, 5000);
    }

    /**
     * @param {String} value 
     */
    onSave() {
        clearTimeout(this.saveTimeout);
        this.msgLoadPromise = msgPopup.loading(MSG_SAVING, 10000);
        BackendAPI.post(
            'rule_template/store', null, {
                id: this.state.ruleTemplate.id,
                label: this.state.title,
                script: this.state.script
            },
            this.onSaveResponse
        );
    }

    /**
     * @param {Object} res 
     */
    onSaveResponse(res) {
        if (this.msgLoadPromise) { this.msgLoadPromise.then(({destory}) => { destory(); } ); }
        if (this.handleErrorResponse(res)) { return; }
        msgPopup.success(MSG_SAVED, MSG_DISPLAY_TIME);
    }

    /**
     * @param {Event} e 
     */
    onClickDelete(e) {
        e.preventDefault();
        BackendAPI.post(
            'rule_template/delete', null, {
                id: this.state.ruleTemplate.id
            },
            this.onDeleteResponse
        );
    }
    
    /**
     * @param {Object} res 
     */
    onDeleteResponse(res) {
        if (this.msgLoadPromise) { this.msgLoadPromise.then(({destory}) => { destory(); } ); }
        if (this.handleErrorResponse(res)) { return; }
        msgPopup.success(MSG_RULE_TEMPLATE_DELETED, MSG_DISPLAY_TIME);
        this.gotoReferer();        
    }

    /**
     * {@inheritdoc}
     */
    render() {
        if (this.state.error) {
            return this.renderError();
        } else if (this.state.loading) {
            return this.renderLoader();
        }
        return <div className='page rule-template-edit'>
            <EditTitleComponent title={this.state.title} callback={this.onLabel} />
            <h1 className='title'>{this.title}</h1>
            <div className='options top'>
                {this.renderCallbackButton(BTN_BACK, this.onClickBack, faBackward)}
                {this.renderCallbackButton(BTN_DELETE, this.onClickDelete, faTrash)}
            </div>
            <section>
                <RuleTemplateEditorComponent onChange={this.onChange} value={this.state.ruleTemplate.script} />
            </section>
        </div>;
    }

}
