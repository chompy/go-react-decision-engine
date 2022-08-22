import React from 'react';
import { faBackward } from '@fortawesome/free-solid-svg-icons'
import BasePageComponent from './base';
import { BTN_BACK, TITLE_FORM_LIST } from '../../config';
import ApiTableComponent from '../helper/api_table';
import UserSubmissionListPageComponent from './user_submission_list';
import FormSubmissionEditPageComponent from './form_submission_edit';
import BackendAPI from '../../api';

export default class UserFormListPageComponent extends BasePageComponent {

    constructor(props) {
        super(props);
        this.ref = null;
        this.state.root = null;
        this.state.loading = true;
    }

    /**
     * {@inheritdoc}
     */
    static getName() {
        return 'user-form-list';
    }

    /**
     * {@inheritdoc}
     */
    onReady() {
        this.setTitle(TITLE_FORM_LIST);
        this.setLoaded();
    }

    /**
     * @param {Object} data 
     */
    onSelectSubmission(data) {

        if (this.props.path?.ref) {
            switch (this.props.path?.ref) {
                case 'new': {
                    BackendAPI.batch(
                        [
                            {path: 'tree/version/fetch', payload: {id: data.id}},
                            {path: 'submission/store', payload: {form_id: data.id, form_version: '$1.version', valid: false}},
                        ],
                        this.onNewSubmissionResponse
                    );
                    return;
                }
            }
        }
        this.gotoPage(UserSubmissionListPageComponent, {user: this.state.user, form: data.id});
    }

    onNewSubmissionResponse(res) {
        if (this.handleBatchErrorResponse(res)) { return; }
        this.gotoPage(FormSubmissionEditPageComponent, {id: res.data[1].data.id});
    }

    onBackButton() {
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
        return <div className='page user-submission-list'>
            <h1 className='title'>{TITLE_FORM_LIST}</h1>
            <div className='options top'>
                {this.renderCallbackButton(BTN_BACK, this.onBackButton, faBackward)}
            </div>
            <section>
                <ApiTableComponent
                    columns={{
                        'id': 'ID',
                        'label': 'Name',
                        'created': 'Created',
                    }}
                    endpoint='tree/list'
                    params={{published: true}}
                    callback={this.onSelectSubmission}
                />
            </section>
        </div>;
    }

}
