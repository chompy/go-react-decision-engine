import React from 'react';
import { faBackward, faForward, faTrash } from '@fortawesome/free-solid-svg-icons'
import { BTN_BACK, BTN_SUBMIT, FIELD_EMAIL, FIELD_PASSWORD, FIELD_PASSWORD_REPEAT, MSG_DISPLAY_TIME, MSG_SAVED, TITLE_SIGN_UP } from '../../config';
import BackendAPI from '../../api';
import { message as msgPopup } from 'react-message-popup';
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
     * @param {Event} e 
     */
    onClickBack(e) {
        e.preventDefault();
        this.gotoReferer();
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
        return <div className='page user-new'>
            <section>
                <h2 className='section-name'>{TITLE_SIGN_UP}</h2>
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

                    <div className='options pure-button-group' role='group'>
                        {this.renderCallbackButton(BTN_BACK, this.onClickBack, faBackward)}
                        {this.renderCallbackButton(BTN_SUBMIT, this.onClickSave, faForward, !this.state.hasChange || !isValid)}
                    </div>

                </form>
            </section>
        </div>;
    }

}
