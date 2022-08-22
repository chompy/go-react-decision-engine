import React from 'react';
import { faBackward, faCirclePlus } from '@fortawesome/free-solid-svg-icons'
import BasePageComponent from './base';
import { BTN_BACK, BTN_NEW, TITLE_USER_SUBMISSION_LIST, TITLE_USER_SUBMISSION_LIST_FORM } from '../../config';
import ApiTableComponent from '../helper/api_table';
import FormSubmissionEditPageComponent from './form_submission_edit';
import BackendAPI from '../../api';
import TreeVersionInfoComponent from '../helper/tree_version_info';

export default class UserSubmissionListPageComponent extends BasePageComponent {

    constructor(props) {
        super(props);
        this.title = TITLE_USER_SUBMISSION_LIST;
        this.state.root = null;
        this.state.loading = true;
        this.state.form = null;
        this.state.published = null;
    }

    /**
     * {@inheritdoc}
     */
    static getName() {
        return 'user-submission-list';
    }

    /**
     * {@inheritdoc}
     */
    onReady() {
        this.setTitle(this.title);
        if (this.props.path.form) {
            BackendAPI.batch(
                [
                    {path: 'tree/fetch', payload: {id: this.props.path.form}},
                    {path: 'tree/version/fetch', payload: {id: this.props.path.form}}
                ],
                this.onApiResponse
            )
            return;
        }
        this.setLoaded();
    }

    /**
     * @param {Object} res 
     */
    onApiResponse(res) {
        this.handleBatchErrorResponse(res);
        this.title = TITLE_USER_SUBMISSION_LIST_FORM.replace('{form}', res.data[0].data.label);
        this.setState({form: res.data[0].data, published: res.data[1].data});
        this.setTitle(this.title);
        this.setLoaded();
    }

    /**
     * @param {Object} data 
     */
    onSelectSubmission(data) {
        this.gotoPage(FormSubmissionEditPageComponent, {id: data.id});
    }

    /**
     * @param {Event} e 
     */
    onBackButton(e) {
        e.preventDefault();
        this.gotoReferer();
    }

    /**
     * @param {Event} e 
     */
    onClickNewSubmission(e) {
        e.preventDefault();
        if (!this.state.form) { return; }
        BackendAPI.post(
            'submission/store', {},
            {
                form_id: this.state.form.id,
                form_version: this.state.published.version,
                valid: false
            },
            this.onNewSubmissionResponse
        );
    }

    /**
     * @param {Object} res 
     */
    onNewSubmissionResponse(res) {
        if (this.msgLoadPromise) { this.msgLoadPromise.then(({destory}) => { destory(); } ); }
        if (this.handleErrorResponse(res)) { return; }
        this.gotoPage(FormSubmissionEditPageComponent, {id: res.data.id});
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
        return <div className='page user-submission-list'>
            <h1 className='title'>{this.title}</h1>
            <div className='options top'>
                {this.renderCallbackButton(BTN_BACK, this.onBackButton, faBackward)}
                {this.renderCallbackButton(BTN_NEW, this.onClickNewSubmission, faCirclePlus)}
            </div>
            <section>
                <ApiTableComponent
                    columns={{
                        'id': 'ID',
                        'valid': 'Valid',
                        'form_id': 'Form',
                        'form_version': 'Version',
                        'created': 'Created',
                        'modified': 'Modified'
                    }}
                    endpoint='submission/list'
                    params={{user: this.state.user.id, form: this.props.path.form ? this.props.path.form : ''}}
                    callback={this.onSelectSubmission}
                />
            </section>
        </div>;
    }

}
