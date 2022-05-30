import React from 'react';

import { faForward } from '@fortawesome/free-solid-svg-icons'
import BasePageComponent, { FIELD_TYPE_PASSWORD } from './base';
import BackendAPI from '../../api';

export default class LoginPageComponent extends BasePageComponent {

    constructor(props) {
        super(props);
        this.state = {
            email: '',
            password: ''
        }
        this.onEmail = this.onEmail.bind(this);
        this.onPassword = this.onPassword.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
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
        if (typeof e.preventDefault != 'undefined') {
            e.preventDefault();
        }
        BackendAPI.post('user/login', null, {email: this.state.email, password: this.state.password}, function(res) {
            console.log(res);
        })
    }

    /**
     * {@inheritdoc}
     */
     render() {
        return <div className='page login'>
            <section>
                <h2 className='section-name'>Login</h2>
                <form className='pure-form pure-form-stacked' onSubmit={this.onSubmit}>
                    {
                        this.renderFormField({
                            'id': 'email',
                            'label': 'E-Mail',
                            'value': this.state.email,
                            'callback': this.onEmail
                        })
                    }
                    {
                        this.renderFormField({
                            'id': 'password',
                            'label': 'Password',
                            'type': FIELD_TYPE_PASSWORD,
                            'value': this.state.password,
                            'callback': this.onPassword
                        })
                    }
                </form>
                <div className='options pure-button-group' role='group'>
                    {this.renderCallbackButton('Go', this.onSubmit, faForward)}
                </div>
            </section>
        </div>;
    }

}
