import React from 'react';
import { faBackward, faFloppyDisk, faTrash } from '@fortawesome/free-solid-svg-icons'
import { BTN_BACK, BTN_DELETE, BTN_SAVE, FIELD_BASIC_INFO, FIELD_EMAIL, FIELD_PASSWORD, FIELD_PASSWORD_REPEAT, FIELD_PERMISSION, MSG_DELETE_SUCCESS, MSG_DISPLAY_TIME, MSG_INVALID_BLANK, MSG_INVALID_EMAIL, MSG_INVALID_PASSWORD_MATCH, MSG_RULE_TEMPLATE_DELETED, MSG_SAVED, MSG_SAVING, MSG_TEAM_CREATOR_CANNOT_CHANGE_PERMS, MSG_UNSAVED_CHANGES, MSG_USER_DELETE, TITLE_USER_EDIT, TITLE_USER_NEW } from '../../config';
import BackendAPI from '../../api';
import { message as msgPopup } from 'react-message-popup';
import UserPermission from '../../user_permission';
import Helpers from '../../helpers';
import UserEditPageComponent from './user_edit';
import LoginPageComponent from './login';

export default class UserNewPageComponent extends UserEditPageComponent {

    constructor(props) {
        super(props);
        this.state.loading = false;
        this.onClickBack = this.onClickBack.bind(this);
        this.onClickSave = this.onClickSave.bind(this);
        this.onChangeEmail = this.onChangeEmail.bind(this);
        this.onChangePassword = this.onChangePassword.bind(this);
    }

    /**
     * {@inheritdoc}
     */
    static getName() {
        return 'user-new';
    }

    /**
     * {@inheritdoc}
     */
    onReady() {
        this.setLoaded();
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
                team: this.state.team.id,
                email: this.state.email,
                password: this.state.password
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
        this.gotoPage(LoginPageComponent);
    }

    /**
     * {@inheritDoc}
     */
    renderPermissionCheckboxes() {
        return null;
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
        return <div className='page user-edit'>
            <h1 className='title'>{TITLE_USER_NEW}</h1>
            <div className='options top'>
                {this.renderCallbackButton(BTN_BACK, this.onClickBack, faBackward)}
                {this.renderCallbackButton(BTN_SAVE, this.onClickSave, faFloppyDisk, !this.state.hasChange || !isValid)}
            </div>
            <section>
                <form className='pure-form pure-form-stacked' noValidate={true}>

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
                </form>
            </section>
        </div>;
    }

}
