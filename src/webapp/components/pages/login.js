import React from 'react';

import { faForward, faUser } from '@fortawesome/free-solid-svg-icons'
import BasePageComponent, { FIELD_TYPE_PASSWORD } from './base';
import BackendAPI from '../../api';
import Events from '../../events';
import { BTN_GO, BTN_NEW_USER, ERR_UNKNOWN } from '../../config';
import UserNewPageComponent from './user_new';

export default class LoginPageComponent extends BasePageComponent {

    constructor(props) {
        super(props);
        this.state.email = '';
        this.state.password = '';
        this.state.message = '';
        this.state.disabled = false;
        this.state.loading = !this.state.team;
    }

    /**
     * {@inheritdoc}
     */
    componentDidMount() {
        super.componentDidMount();
    }

    /**
     * {@inheritdoc}
     */
    componentWillUnmount() {
        super.componentWillUnmount();
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
    onReady() {
        super.onReady();
        this.setTitle('Login');
    }

    /**
     * @param {Event} e 
     */
    onTeam(e) {
        this.setState({team: e.detail, loading: false});
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
        BackendAPI.post(
            'user/login', null, 
            {email: this.state.email, password: this.state.password, team: this.props.team.id},
            this.onSubmitResponse
        );
    }

    /**
     * @param {Object} res 
     */
    onSubmitResponse(res) {
        this.setState({ disabled: false });
        if (!res) {
            this.setState({ message: ERR_UNKNOWN });
            return;
        } else if (!res.success) {
            this.setState({ message: res.message });
            return
        }
        Events.dispatch('login', {
            email: this.state.email,
            team : this.state.team
        });
    }

    /**
     * @param {Event} e 
     */
    onClickNewUser(e) {
        e.preventDefault();
        this.gotoPage(UserNewPageComponent);
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
                        {this.renderCallbackButton(BTN_GO, this.onSubmit, faForward)}
                        {this.renderCallbackButton(BTN_NEW_USER, this.onClickNewUser, faUser)}
                    </div>
                </form>
            </section>
        </div>;
    }

}
