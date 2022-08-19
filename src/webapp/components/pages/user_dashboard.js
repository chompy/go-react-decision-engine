import React from 'react';
import { TITLE_USER_DASH } from '../../config';
import ApiTableComponent from '../helper/api_table';
import BasePageComponent from './base';
import FormSubmissionEditPageComponent from './form_submission_edit';
import FormSubmissionListPageComponent from './form_submission_list';

export default class UserDashboardPageComponent extends BasePageComponent {

    constructor(props) {
        super(props);
        this.state.loading = true;
    }

    /**
     * {@inheritDoc}
     */
    static getName() {
        return 'user-dashboard';
    }

    /**
     * {@inheritDoc}
     */
    onReady() {
        this.setTitle(TITLE_USER_DASH);
        this.setLoaded();
    }

    /**
     * @param {Object} data 
     */
    onSelectSubmission(data) {
        this.gotoPage(FormSubmissionEditPageComponent, {id: data.id});
    }

    /**
     * {@inheritDoc}
     */
    render() {
        if (this.state.error) {
            return this.renderError();
        } else if (this.state.loading) {
            return this.renderLoader();
        }
        return <div className='page user-dashboard'>
            <h1 className='title'>{TITLE_USER_DASH}</h1>
            <div className='options top'></div>
            <section>
                <ApiTableComponent
                    columns={{
                        'id': 'ID',
                        'form_id': 'Form',
                        'created': 'Created'
                    }}
                    endpoint='submission/list'
                    params={{user: this.state.user.id}}
                    callback={this.onSelectSubmission}
                />

                <ApiTableComponent
                    columns={{
                        'id': 'ID',
                        'label': 'Label',
                        'created': 'Created'
                    }}
                    endpoint='tree/list'
                    params={{published: true}}
                    callback={this.onSelectSubmission}
                />

            </section>
        </div>;
    }

}
