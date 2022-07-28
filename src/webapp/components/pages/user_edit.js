import React from 'react';
import { faBackward, faFloppyDisk, faTrash } from '@fortawesome/free-solid-svg-icons'
import BasePageComponent from './base';
import { BTN_BACK, BTN_DELETE, BTN_SAVE, FIELD_BASIC_INFO, FIELD_EMAIL, FIELD_PASSWORD, FIELD_PASSWORD_REPEAT, FIELD_PERMISSION, MSG_DELETE_SUCCESS, MSG_DISPLAY_TIME, MSG_INVALID_BLANK, MSG_INVALID_EMAIL, MSG_INVALID_PASSWORD_MATCH, MSG_RULE_TEMPLATE_DELETED, MSG_SAVED, MSG_SAVING, MSG_TEAM_CREATOR_CANNOT_CHANGE_PERMS, MSG_UNSAVED_CHANGES, TITLE_USER_EDIT, TITLE_USER_NEW } from '../../config';
import BackendAPI from '../../api';
import { message as msgPopup } from 'react-message-popup';
import UserPermission from '../../user_permission';
import Helpers from '../../helpers';
import Events from '../../events';

export default class UserEditPageComponent extends BasePageComponent {

    constructor(props) {
        super(props);
        this.title = '';
        this.isTeamCreator = false;
        this.isCurrentUser = false;
        this.state.loading = true;
        this.state.userId = null;
        this.state.email = '';
        this.state.emailMessages = [];
        this.state.password = '';
        this.state.passwordRepeat = '';
        this.state.passwordMessages = [];
        this.state.permission = [];
        this.state.hasChange = false;
        this.saveTimeout = null;
        this.checkValidation = this.checkValidation.bind(this);
    }

    /**
     * {@inheritdoc}
     */
    static getName() {
        return 'user-edit';
    }

    /**
     * {@inheritdoc}
     */
    onReady() {
        this.setState({loading: true});
        let userId = this.props.path?.id;
        if (!userId) {
            this.title = TITLE_USER_NEW;
            this.setTitle(this.title);
            this.setLoaded();
            return;
        }
        BackendAPI.get(
            'user/fetch',
            {id: userId},
            this.onApiResponse
        );
    }

    /**
     * @param {Object} res 
     */
    onApiResponse(res) {
        this.handleErrorResponse(res);
        this.isTeamCreator = this.props.team.creator == res.data.id || res.data.creator == 0;
        this.isCurrentUser = this.props.user.id == res.data.id;
        this.setState({
            userId: res.data?.id,
            email: res.data?.email,
            permission: res.data?.permission
        });
        this.title = TITLE_USER_EDIT.replace('{email}', res.data.email);
        this.setTitle(this.title);
        this.setLoaded();
    }

    /**
     * @param {Event} e 
     */
    onClickBack(e) {
        e.preventDefault();
        if (this.state.hasChange && !confirm(MSG_UNSAVED_CHANGES)) {
            return;
        }
        this.gotoReferer();
    }

    /**
     * @param {Event} e 
     */
    onClickSave(e) {
        e.preventDefault();
        if (!this.checkValidation()) {
            return;
        }
        BackendAPI.post(
            'user/store', null, {
                id: this.state.userId,
                email: this.state.email,
                password: this.state.password,
                permission: this.state.permission
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
        this.title = TITLE_USER_EDIT.replace('{email}', res.data.email);
        this.setTitle(this.title);
        this.setState({hasChange: false, userId: res.data.id});
        if (res.data.id == this.props.user?.id) {
            Events.dispatch('user_me', res.data);
        }
    }

    /**
     * @param {Event} e 
     */
    onClickDelete(e) {
        e.preventDefault();
    }
    
    /**
     * @param {Object} res 
     */
    onDeleteResponse(res) {
        if (this.msgLoadPromise) { this.msgLoadPromise.then(({destory}) => { destory(); } ); }
        if (this.handleErrorResponse(res)) { return; }
        msgPopup.success(MSG_DELETE_SUCCESS.replace('{name}', this.state.email), MSG_DISPLAY_TIME);
        this.gotoReferer();        
    }

    /**
     * @returns {boolean}
     */
    checkValidation() {
        // email
        let emailMessages = [];
        if (!this.state.email) {
            emailMessages.push(MSG_INVALID_BLANK);
        } else if (!Helpers.validateEmail(this.state.email)) {
            emailMessages.push(MSG_INVALID_EMAIL);
        }
        // password
        let passwordMessages = [];
        if (this.state.password != this.state.passwordRepeat) {
            passwordMessages.push(MSG_INVALID_PASSWORD_MATCH);
        }
        this.setState({
            emailMessages: emailMessages,
            passwordMessages: passwordMessages
        });
        return emailMessages.length == 0 && passwordMessages.length == 0;
    }

    /**
     * @param {Event} e 
     */
    onChangeEmail(e) {
        this.setState(
            {email: e.target.value, hasChange: true}, 
            this.checkValidation
        );
    }

    /**
     * @param {Event} e 
     */
    onChangePassword(e) {
        switch (e.target.id) {
            case 'password-repeat': {
                this.setState(
                    {passwordRepeat: e.target.value, hasChange: true},
                    this.checkValidation
                );
                break;
            }
            default: {
                this.setState(
                    {password: e.target.value, hasChange: true},
                    this.checkValidation
                );
                break;
            }
        }
    }

    /**
     * @param {Event} e 
     */
    onChangePermission(e) {
        this.setState(function(state, props) {
            let targetIndex = state.permission.indexOf(e.target.value);
            if (e.target.checked && targetIndex == -1) {
                state.permission.push(e.target.value);
            } else if (!e.target.checked && targetIndex != -1) {
                state.permission.splice(targetIndex, 1);
            }
            return {
                permission: state.permission,
                hasChange: true
            };
        }, this.checkValidation);
    }

    /**
     * @returns {Array}
     */
    renderPermissionCheckboxes() {
        let out = [];
        let hasAdmin = this.state.permission.indexOf('admin') != -1;
        for (let id in UserPermission.userPermissionMap) {
            let label = UserPermission.userPermissionMap[id];
            let fieldId = 'perm-' + id;
            out.push(
                <label key={fieldId} htmlFor={fieldId} className='pure-checkbox'>
                    <input
                        type='checkbox'
                        id={fieldId}
                        checked={this.state.permission.indexOf(id) != -1}
                        disabled={this.isTeamCreator || (hasAdmin && id != 'admin')}
                        onChange={this.onChangePermission}
                        value={id}
                    /> {label}
                </label>
            );
        }
        return out;
    }

    /**
     * @param {Array} messages 
     * @returns {*}
     */
    renderMessages(messages) {
        let out = [];
        for (let i in messages) {
            out.push(
                <li key={'message-' + messages[i]}>{messages[i]}</li>
            );
        }
        return <ul className='messages'>{out}</ul>;
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
        let isValid = this.state.emailMessages.length == 0 && this.state.passwordMessages.length == 0;

        let teamCreatorAlert = null;
        if (this.isTeamCreator) {
            teamCreatorAlert = <div className='alert warn'>{MSG_TEAM_CREATOR_CANNOT_CHANGE_PERMS}</div>
        }
        return <div className='page user-edit'>
            <h1 className='title'>{this.title}</h1>
            <div className='options top'>
                {this.renderCallbackButton(BTN_BACK, this.onClickBack, faBackward)}
                {this.renderCallbackButton(BTN_DELETE, this.onClickDelete, faTrash, this.isCurrentUser)}
                {this.renderCallbackButton(BTN_SAVE, this.onClickSave, faFloppyDisk, !this.state.hasChange || !isValid)}
            </div>
            <section>
                <form className='pure-form pure-form-stacked' noValidate={true}>
                    <fieldset>
                        <legend>{FIELD_BASIC_INFO}</legend>
                        <label htmlFor='email'>{FIELD_EMAIL}</label>
                        <input
                            type='email'
                            id='email'
                            placeholder={FIELD_EMAIL}
                            value={this.state.email}
                            onChange={this.onChangeEmail}
                            className={this.state.emailMessages.legend > 0 ? 'error' : ''}
                        />
                        {this.renderMessages(this.state.emailMessages)}
                        <label htmlFor='password'>{FIELD_PASSWORD}</label>
                        <input
                            type='password'
                            id='password'
                            placeholder={FIELD_PASSWORD}
                            value={this.state.password}
                            onChange={this.onChangePassword}
                        />
                        <input
                            type='password'
                            id='password-repeat'
                            placeholder={FIELD_PASSWORD_REPEAT}
                            value={this.state.passwordRepeat}
                            onChange={this.onChangePassword}
                        />
                        {this.renderMessages(this.state.passwordMessages)}
                    </fieldset>
                    <fieldset>
                        <legend>{FIELD_PERMISSION}</legend>
                        {teamCreatorAlert}
                        {this.renderPermissionCheckboxes()}
                    </fieldset>
                </form>

            </section>
        </div>;
    }

}
