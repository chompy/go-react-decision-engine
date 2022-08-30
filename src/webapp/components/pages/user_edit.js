import React from 'react';
import { faBackward, faFloppyDisk, faTrash } from '@fortawesome/free-solid-svg-icons'
import BasePageComponent, { FIELD_TYPE_CHECKBOXES } from './base';
import { BTN_BACK, BTN_DELETE, BTN_SAVE, FIELD_BASIC_INFO, FIELD_EMAIL, FIELD_PASSWORD, FIELD_PASSWORD_REPEAT, FIELD_PERMISSION, MSG_DELETE_SUCCESS, MSG_DISPLAY_TIME, MSG_INVALID_BLANK, MSG_INVALID_EMAIL, MSG_INVALID_PASSWORD_MATCH, MSG_SAVED, MSG_TEAM_CREATOR_CANNOT_CHANGE_PERMS, MSG_UNSAVED_CHANGES, MSG_USER_DELETE, TITLE_USER_EDIT } from '../../config';
import BackendAPI from '../../api';
import { message as msgPopup } from 'react-message-popup';
import UserPermission, { USER_PERM_ADMIN } from '../../user_permission';
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
        if (!userId || userId != this.state.user.id) {
            this.checkAllPermission(USER_PERM_ADMIN);
        }
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
        if (!confirm(MSG_USER_DELETE)) { return; }
        BackendAPI.post(
            'user/delete',
            null,
            {id: this.state.userId},
            this.onDeleteResponse
        )
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
        let params = {
            id: 'permission',
            type: FIELD_TYPE_CHECKBOXES,
            value: this.state.permission,
            callback: this.onChangePermission,
            options: {},
            disabled: this.isTeamCreator
        };
        for (let id in UserPermission.userPermissionMap) {
            params.options[id] = UserPermission.userPermissionMap[id];
        }
        return this.renderFormField(params);
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
                {this.renderCallbackButton(BTN_DELETE, this.onClickDelete, faTrash, this.isTeamCreator || this.isCurrentUser || !this.state.userId)}
                {this.renderCallbackButton(BTN_SAVE, this.onClickSave, faFloppyDisk, !this.state.hasChange || !isValid)}
            </div>
            <section>
                <form className='pure-form pure-form-stacked' noValidate={true}>
                    <fieldset>
                        <legend>{FIELD_BASIC_INFO}</legend>
                        {this.renderFormField({
                            id: 'email',
                            type: 'email',
                            label: FIELD_EMAIL,
                            placeholder: FIELD_EMAIL,
                            value: this.state.email,
                            callback: this.onChangeEmail,
                            errors: this.state.emailMessages
                        })}
                        {this.renderFormField({
                            id: 'password',
                            type: 'password',
                            label: FIELD_PASSWORD,
                            placeholder: FIELD_PASSWORD,
                            value: this.state.password,
                            callback: this.onChangePassword
                        })}
                        {this.renderFormField({
                            id: 'password-repeat',
                            type: 'password',
                            placeholder: FIELD_PASSWORD_REPEAT,
                            value: this.state.passwordRepeat,
                            callback: this.onChangePassword,
                            errors: this.state.passwordMessages
                        })}
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
