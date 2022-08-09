import React from 'react';
import BackendAPI from '../../api';
import { BTN_NEW, DEFAULT_FORM_TITLE, MSG_LOADING, TREE_FORM } from '../../config';
import Events from '../../events';
import ApiTableComponent from '../helper/api_table';
import EditTitleComponent from '../helper/edit_title';
import BasePageComponent from './base';
import FormDashboardPageComponent from './form_dashboard';
import { message as msgPopup } from 'react-message-popup';
import { faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import TreeListPageComponent from './tree_list';
import UserListPageComponent from './user_list';
import UserEditPageComponent from './user_edit';

export default class TeamDashboardPageComponent extends BasePageComponent {

    constructor(props) {
        super(props);
        this.state.loading = true;
    }

    /**
     * {@inheritDoc}
     */
    static getName() {
        return 'team-dashboard';
    }

    /**
     * {@inheritDoc}
     */
    onReady() {
        this.setTitle(this.state.team.name);
        this.setLoaded();
    }

    /**
     * @param {String} name 
     */
    onNameChange(name) {
        this.setTitle(name);
        BackendAPI.post(
            'team/store', null, {id: this.state.team.id, name: name},
            this.onNameResponse
        );
    }

    /**
     * @param {Object} res 
     */
    onNameResponse(res) {
        if (this.handleErrorResponse(res)) { return; }
        Events.dispatch('team', res.data);
    }

    /**
     * @param {Event} e 
     */
    onClickNewForm(e) {
        e.preventDefault();
        this.msgLoadPromise = msgPopup.loading(MSG_LOADING, 10000);
        BackendAPI.post(
            'tree/store',
            null,
            {
                type: TREE_FORM,
                team: this.state.team.id,
                label: DEFAULT_FORM_TITLE
            },
            this.onNewFormResponse
        );
    }

    /**
     * @param {Object} res 
     */
    onNewFormResponse(res) {
        if (this.msgLoadPromise) { this.msgLoadPromise.then(({destory}) => { destory(); } ); }
        if (this.handleErrorResponse(res)) { return; }
        this.gotoPage(
            FormDashboardPageComponent, {id: res.data.id}
        );
    }

    /**
     * @param {Event} e 
     */
    onClickNewUser(e) {
        e.preventDefault();
        this.gotoPage(UserEditPageComponent);
    }

    /**
     * @param {Object} form 
     */
    onSelectForm(form) {
        this.gotoPage(FormDashboardPageComponent, {id: form.id});
    }

    /**
     * @param {Object} user 
     */
    onSelectUser(user) {
        this.gotoPage(UserEditPageComponent, {id: user.id});
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
        return <div className='page team-dashboard'>
            <EditTitleComponent title={this.state.team?.name} callback={this.onNameChange} />
            <div className='options top'>
            </div>
            <section>
                <div className='list forms'>
                    <h2>Forms</h2>
                    <div className='options'>
                        {this.renderCallbackButton(BTN_NEW, this.onClickNewForm, faCirclePlus)}
                    </div>
                    <ApiTableComponent
                        columns={{
                            'id': 'ID',
                            'label': 'Name',
                            'created': 'Created',
                            'modified': 'Modified'
                        }}
                        endpoint='tree/list'
                        params={{type: TREE_FORM, team: this.state.user.team}}
                        callback={this.onSelectForm}
                        seeMore={[TreeListPageComponent]}
                    />
                </div>
                <div className='list users'>
                    <h2>Users</h2>
                    <div className='options'>
                        {this.renderCallbackButton(BTN_NEW, this.onClickNewUser, faCirclePlus)}
                    </div>
                    <ApiTableComponent
                        columns={{
                            'id': 'ID',
                            'email': 'Email',
                            'created': 'Created',
                            'modified': 'Modified'
                        }}
                        endpoint='team/users'
                        params={{team: this.state.user.team}}
                        callback={this.onSelectUser}
                        seeMore={[UserListPageComponent]}
                    />
                </div>
            </section>
        </div>;
    }

}
