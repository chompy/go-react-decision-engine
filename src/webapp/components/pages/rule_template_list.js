import React from 'react';
import { faBackward, faCirclePlus } from '@fortawesome/free-solid-svg-icons'
import BasePageComponent from './base';
import { BTN_BACK, BTN_NEW, DEFAULT_RULE_TEMPLATE_TITLE, MSG_DISPLAY_TIME, MSG_DONE, MSG_LOADING } from '../../config';
import ApiTableComponent from '../helper/api_table';
import { message as msgPopup } from 'react-message-popup';
import RuleTemplateEditPageComponent from './rule_template_edit';
import BackendAPI from '../../api';


export default class RuleTemplateListPageComponent extends BasePageComponent {

    constructor(props) {
        super(props);
        this.title = 'Rule Templates';
        this.state.loading = true;
    }

    /**
     * {@inheritdoc}
     */
    static getName() {
        return 'rule-template-list';
    }

    /**
     * {@inheritdoc}
     */
    onReady() {
        this.setTitle(this.title);
        super.onReady();
    }

    /**
     * @param {Event} e 
     */
    onClickBack(e) {
        e.preventDefault();
        this.gotoReferer();
    }

    /**
     * @param {Event} e 
     */
    onClickNew(e) {
        e.preventDefault();
        this.msgLoadPromise = msgPopup.loading(MSG_LOADING, 10000);
        BackendAPI.post(
            'rule_template/store', null, {
                label: DEFAULT_RULE_TEMPLATE_TITLE,
                script: ''
            },
            this.onNewResponse
        );
    }

    /**
     * @param {Object} res 
     */
    onNewResponse(res) {
        if (this.msgLoadPromise) { this.msgLoadPromise.then(({destory}) => { destory(); } ); }
        if (this.handleErrorResponse(res)) { return; }
        msgPopup.success(MSG_DONE, MSG_DISPLAY_TIME);
        this.gotoPage(RuleTemplateEditPageComponent, {id: res.data.id});
    }

    /**
     * @param {Object} data 
     */
    onSelectRuleTemplate(data)  {
        this.gotoPage(RuleTemplateEditPageComponent, {id: data.id});
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
        return <div className='page rule-template-list'>
            <h1 className='title'>{this.title}</h1>
            <div className='options top'>
                {this.renderCallbackButton(BTN_BACK, this.onClickBack, faBackward)}
                {this.renderCallbackButton(BTN_NEW, this.onClickNew, faCirclePlus)}
            </div>
            <section>
                <ApiTableComponent
                    columns={{
                        'id': 'ID',
                        'label': 'Name',
                        'created': 'Created',
                        'modified': 'Modified'
                    }}
                    endpoint='rule_template/list'
                    callback={this.onSelectRuleTemplate}
                />
            </section>
        </div>;
    }

}
