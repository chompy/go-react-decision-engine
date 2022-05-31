import React from 'react';
import BackendAPI from '../api';
import Events from '../events';
import AppHeaderComponent from './header';
import BasePageComponent from './pages/base';
import BuilderPageComponent from './pages/builder';
import FormManagePageComponent from './pages/form_manage';
import LoginPageComponent from './pages/login';
import TeamPageComponent from './pages/team';

export default class DecisionEngineMainComponent extends React.Component {

    /**
     * List of available page components.
     */
    static pageComponents = [
        TeamPageComponent,
        FormManagePageComponent,
        BuilderPageComponent,
        LoginPageComponent
    ];

    constructor(props) {
        super(props);
        this.state = {
            team: '',
            page: LoginPageComponent.getName(),
            params: {},
            user: null,
            message: ''
        };
        this.onHashChange = this.onHashChange.bind(this);
        this.onUserMe = this.onUserMe.bind(this);
        this.onLogin = this.onLogin.bind(this);
        this.onLogout = this.onLogout.bind(this);
    }

    /**
     * {@inheritdoc}
     */
    componentDidMount() {
        window.addEventListener('hashchange', this.onHashChange);
        if (window.location.hash) {
            this.gotoHashPage(window.location.hash);
        }
        BackendAPI.get('user/me', null, this.onUserMe);
        Events.listen('login', this.onLogin);
        Events.listen('logout', this.onLogout);
    }

    /**
     * {@inheritdoc}
     */
    componentWillUnmount() {
        window.removeEventListener('hashchange', this.onHashChange);
        Events.remove('login', this.onLogin);
        Events.remove('logout', this.onLogout);
    }

    /**
     * @param {Object} res 
     */
    onUserMe(res) {
        if (!res.success) { return; }
        console.log('> Fetched user "' + res.data.email + '."');
        this.setState({
            user: res.data
        });
        if (this.state.page == LoginPageComponent.getName()) {
            this.gotoHashPage(window.location.hash);
        }
    }

    /**
     * @param {Event} e 
     */
    onLogin(e) {
        console.log('> Log in successful.');
        BackendAPI.get('user/me', null, this.onUserMe);
        window.location.hash = '#team';
    }

    /**
     * @param {Event} e 
     */
    onLogout(e) {
        console.log('> Log out successful.');
        this.setState({user: null, page: LoginPageComponent.getName(), message: 'You have logged out.'});
    }

    /**
     * @param {Event} e 
     */
    onTeam(e) {
        console.log('> Switch team to "' + e.detail.team + '."');
        this.setState({ team: e.detail.team });
    }

    /**
     * @param {Event} e 
     */
    onHashChange(e) {
        e.preventDefault();
        this.gotoHashPage(window.location.hash);
    }

    /**
     * Navigate to page based on hash string.
     * @param {string} hash 
     */
    gotoHashPage(hash) {
        if (!this.state.user) {
            this.setState({
                page: LoginPageComponent.getName(),
                params: {},
                message: ''
            });
            return;
        }
        if (hash[0] == '#') {
            hash = window.location.hash.substring(1);
        }
        if (!hash) {
            this.setState({
                page: DecisionEngineMainComponent.pageComponents[0].getName(),
                params: {},
                message: ''
            });
            return;
        }
        hash = hash.split('-');
        let page = hash[0];
        let params = {};
        for (let i = 1; i < hash.length; i += 2) {
            params[hash[i]] = hash[i+1];
        }
        this.setState({
            page: page,
            params: params,
            message: ''
        });
    }

    /**
     * {@inheritdoc}
     */
    render() {
        let Component = BasePageComponent;
        for (let i in DecisionEngineMainComponent.pageComponents) {
            if (DecisionEngineMainComponent.pageComponents[i].getName() == this.state.page) {
                Component = DecisionEngineMainComponent.pageComponents[i];
                break;
            }
        }
        return <div className='decision-engine'>
            <AppHeaderComponent user={this.state.user} />
            <div className={'alert message' + (this.state.message ? '' : ' hidden')}>{this.state.message}</div>
            <Component user={this.state.user} team={this.state.team} params={this.state.params} />
        </div>;
    }

}
