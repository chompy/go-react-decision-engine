import React from 'react';
import { faBackward, faCirclePlus } from '@fortawesome/free-solid-svg-icons'
import BasePageComponent from './base';
import BackendAPI from '../../api';
import { BTN_BACK, BTN_NEW, MSG_DISPLAY_TIME, MSG_DONE, MSG_LOADING, TITLE_DOC_LIST, TREE_DOCUMENT, TREE_FORM } from '../../config';
import ApiTableComponent from '../helper/api_table';
import { message as msgPopup } from 'react-message-popup';


export default class RuleTemplateListPageComponent extends BasePageComponent {

    constructor(props) {
        super(props);
        this.title = 'Rule Templates';
        this.state.loading = false;
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
        // TODO
    }

    /**
     * @param {Object} res 
     */
    onNewResponse(res) {
        if (this.msgLoadPromise) { this.msgLoadPromise.then(({destory}) => { destory(); } ); }
        if (this.handleErrorResponse(res)) { return; }
        msgPopup.success(MSG_DONE, MSG_DISPLAY_TIME);
        // TODO
    }

    /**
     * @param {Object} data 
     */
    onSelectRuleTemplate(data)  {
        // TODO
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
