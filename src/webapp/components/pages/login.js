import React from 'react';

import { faForward } from '@fortawesome/free-solid-svg-icons'
import BasePageComponent, { FIELD_TYPE_PASSWORD } from './base';
import BackendAPI from '../../api';
import { ERROR_UNKNOWN } from '../../errors';
import Events from '../../events';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default class LoginPageComponent extends BasePageComponent {

    constructor(props) {
        super(props);
        this.state = {
            email: '',
            password: '',
            message: '',
            disabled: false
        }
        this.onEmail = this.onEmail.bind(this);
        this.onPassword = this.onPassword.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.onSubmitResponse = this.onSubmitResponse.bind(this);
    }

    /**
     * {@inheritdoc}
     */
    componentDidMount() {

    }

    /**
     * {@inheritdoc}
     */
    static getName() {
        return 'login';
    }

    /**
     * {@inheritdoc}
     */
    getTitle() {
        return 'Login';
    }

    /**
     * @param {Event} e 
     */
    onEmail(e) {
        this.setState({
            email: e.target.value
        });
    }

    /**
     * @param {Event} e 
     */
    onPassword(e) {
        this.setState({
            password: e.target.value
        });
    }

    /**
     * @param {Event} e 
     */
    onSubmit(e) {
        e.preventDefault();
        this.setState({ disabled: true });
        BackendAPI.post('user/login', null, {email: this.state.email, password: this.state.password}, this.onSubmitResponse);
    }

    /**
     * @param {Object} res 
     */
    onSubmitResponse(res) {
        this.setState({ disabled: false });
        if (!res) {
            this.setState({ message: ERROR_UNKNOWN });
            return;
        } else if (!res.success) {
            this.setState({ message: res.message });
            return
        }
        Events.dispatch('login', {
            email: this.state.email,
        });
    }

    /**
     * {@inheritdoc}
     */
     render() {
        return <div className='page login'>
            <section>
                <h2 className='section-name'>Login</h2>
                <form method='POST' className='pure-form pure-form-stacked' onSubmit={this.onSubmit}>
                    {
                        this.renderFormField({
                            'id': 'email',
                            'label': 'E-Mail',
                            'value': this.state.email,
                            'callback': this.onEmail,
                            'disabled': this.state.disabled
                        })
                    }
                    {
                        this.renderFormField({
                            'id': 'password',
                            'label': 'Password',
                            'type': FIELD_TYPE_PASSWORD,
                            'value': this.state.password,
                            'callback': this.onPassword,
                            'disabled': this.state.disabled
                        })
                    }
                    <div className={'alert error' + (this.state.message ? '' : ' hidden') }>{this.state.message}</div>
                    <div className='options pure-button-group' role='group'>
                        <button className='pure-button' type='submit' title='Submit'>Go <FontAwesomeIcon icon={faForward} /></button>
                    </div>
                </form>
            </section>
        </div>;
    }

}
