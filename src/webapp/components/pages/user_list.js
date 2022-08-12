import React from 'react';
import { faBackward } from '@fortawesome/free-solid-svg-icons'
import BasePageComponent from './base';
import { BTN_BACK, TITLE_USER_LIST } from '../../config';
import ApiTableComponent from '../helper/api_table';
import UserEditPageComponent from './user_edit';

export default class UserListPageComponent extends BasePageComponent {

    constructor(props) {
        super(props);
        this.state.loading = true;
    }

    /**
     * {@inheritdoc}
     */
    static getName() {
        return 'user-list';
    }

    /**
     * {@inheritdoc}
     */
    onReady() {
        this.setTitle(TITLE_USER_LIST);
        this.setLoaded();
    }

    /**
     * @param {Object} user 
     */
    onSelectUser(user) {
        this.gotoPage(UserEditPageComponent, {id: user.id});
    }

    /**
     * @param {Event} e 
     */
    onClickBack(e) {
        e.preventDefault();
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
        return <div className='page user-list'>
            <h1 className='title'>{TITLE_USER_LIST}</h1>
            <div className='options top'>
                {this.renderCallbackButton(BTN_BACK, this.onClickBack, faBackward)}
            </div>
            <section>
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
                />
            </section>
        </div>;
    }

}
