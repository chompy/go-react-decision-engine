import { faCirclePlus, faUserGroup } from '@fortawesome/free-solid-svg-icons';
import React from 'react';
import { BTN_NEW, BTN_TEAM_DASHBOARD, LABEL_FORMS, LABEL_SUBMISSIONS, TITLE_USER_DASH, TITLE_USER_SUBMISSION_LIST } from '../../config';
import ApiTableComponent from '../helper/api_table';
import BasePageComponent from './base';
import FormSubmissionEditPageComponent from './form_submission_edit';
import TeamDashboardPageComponent from './team_dashboard';
import UserFormListPageComponent from './user_form_list';
import UserSubmissionListPageComponent from './user_submission_list';

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
     * @param {Object} data 
     */
    onSelectForm(data) {
        this.gotoPage(UserSubmissionListPageComponent, {user: this.state.user, form: data.id})   
    }

    /**
     * @param {Event} e 
     */
    onClickNew(e) {
        e.preventDefault();
        this.gotoPage(UserFormListPageComponent, {user: this.state.user, ref: 'new'}, true);
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

        let adminBtn = null;
        if (this.state.user.permission.length > 0) {
            adminBtn = this.renderPageButton(BTN_TEAM_DASHBOARD, TeamDashboardPageComponent, {}, faUserGroup);
        }

        return <div className='page user-dashboard'>
            <h1 className='title'>{TITLE_USER_DASH}</h1>
            <div className='options top'>{adminBtn}</div>
            <section>

                <div className='list submissions'>
                    <h2>{LABEL_SUBMISSIONS}</h2>
                    <div className='options'>
                        {this.renderCallbackButton(BTN_NEW, this.onClickNew, faCirclePlus)}
                    </div>
                    <ApiTableComponent
                        columns={{
                            'id': 'ID',
                            'form_id': 'Form',
                            'created': 'Created'
                        }}
                        endpoint='submission/list'
                        params={{user: this.state.user.id}}
                        callback={this.onSelectSubmission}
                        seeMore={[UserSubmissionListPageComponent]}
                    />
                </div>

                <div className='list forms'>
                    <h2>{LABEL_FORMS}</h2>
                    <div className='options'></div>
                    <ApiTableComponent
                        columns={{
                            'id': 'ID',
                            'label': 'Label',
                            'created': 'Created'
                        }}
                        endpoint='tree/list'
                        params={{published: true}}
                        callback={this.onSelectForm}
                        seeMore={[UserFormListPageComponent]}
                    />
                </div>

            </section>
        </div>;
    }

}
