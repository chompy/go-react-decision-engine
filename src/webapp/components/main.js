import React from 'react';
import BackendAPI from '../api';
import Events from '../events';
import AppHeaderComponent from './header';
import BasePageComponent from './pages/base';
import LoginPageComponent from './pages/login';
import PathResolver from '../path_resolver';
import FormListPageComponent from './pages/form_list';
import ErrorPageComponent from './pages/error';
import { ERR_NOT_FOUND } from '../config';

export default class DecisionEngineMainComponent extends React.Component {

    constructor(props) {
        super(props);
        let pathResolve = PathResolver.resolveCurrentPath();
        console.log('> Path resolved to "' + pathResolve.component.getName() + '."');
        this.state = {
            path: pathResolve,
            user: null,
            team: null,
            message: ''
        };
        this.onPopState = this.onPopState.bind(this);
        this.onUserMe = this.onUserMe.bind(this);
        this.onTeam = this.onTeam.bind(this);
        this.onLogin = this.onLogin.bind(this);
        this.onLogout = this.onLogout.bind(this);
        this.onGotoPage = this.onGotoPage.bind(this);
    }

    /**
     * {@inheritdoc}
     */
    componentDidMount() {
        window.addEventListener('popstate', this.onPopState);
        if (typeof this.state.path.team != 'undefined' && this.state.path.team) {
            BackendAPI.get('team', {id: this.state.path.team}, this.onTeam);
        }
        Events.listen('login', this.onLogin);
        Events.listen('logout', this.onLogout);
        Events.listen('goto_page', this.onGotoPage);
    }

    /**
     * {@inheritdoc}
     */
    componentWillUnmount() {
        Events.remove('login', this.onLogin);
        Events.remove('logout', this.onLogout);
        Events.remove('goto_page', this.onGotoPage);
    }

    /**
     * @param {Object} res 
     */
    onUserMe(res) {
        if (!res.success) { 
            if (this.state.path.component == LoginPageComponent) {
                return;
            } else if (this.state.path.component != LoginPageComponent && this.state.path.team) {
                this.gotoPage(LoginPageComponent, {team: this.state.path.team});
                return;
            }
            this.displayError(ERR_NOT_FOUND);
            return;            
        }
        console.log('> Fetched user "' + res.data.email + ' (' + res.data.id + ')."');
        this.setState({user: res.data});
        if (this.state.path.component == LoginPageComponent || res.data.team != this.state.path.team) {
            this.gotoPage(FormListPageComponent, {team: res.data.team});
        }
        Events.dispatch('user_me', res.data);
    }

    /**
     * @param {Object} res 
     */
    onTeam(res) {
        if (!res.success) { 
            this.displayError(ERR_NOT_FOUND);
            return;
        }
        console.log('> Fetched team "' + res.data.name + '" (' + res.data.id + ').');
        this.setState({
            team: res.data
        });
        Events.dispatch('team', res.data);
        BackendAPI.get('user/me', null, this.onUserMe);
    }

    /**
     * @param {Event} e 
     */
    onLogin(e) {
        console.log('> Log in successful.');
        BackendAPI.get('user/me', null, this.onUserMe);
        this.setState({message: 'Login successful.'});
        this.gotoPage(FormListPageComponent);
    }

    /**
     * @param {Event} e 
     */
    onLogout(e) {
        console.log('> Log out successful.');
        this.setState({user: null, message: 'You have logged out.'});
        this.gotoPage(LoginPageComponent, {team: this.state.team.id});
    }

    /**
     * @param {Event} e 
     */
    onPopState(e) {
        e.preventDefault();
        let resolvedPage = PathResolver.resolveCurrentPath();
        if (resolvedPage.component == LoginPageComponent && this.state.user) {
            this.gotoPage(FormListPageComponent, {team: this.state.user.team});
            return;
        }
        this.setState({path: resolvedPage});
    }

    /**
     * @param {Event} e 
     */
    onGotoPage(e) {
        this.gotoPage(e.detail.component, e.detail.params);
    }

    /**
     * @param {BasePageComponent} component 
     * @param {Object} params 
     */
    gotoPage(component, params) {
        console.log('> Go to "' + component.getName() + '" page.');
        params = Object.assign({}, {
            team: this.state.team ? this.state.team.id : '',
            user: this.state.user ? this.state.user.id : ''
        }, params ? params : {});
        PathResolver.setPathFromComponent(component, params);
        let resolvedPage = PathResolver.resolveCurrentPath();
        this.setState({path: resolvedPage});
    }

    /**
     * @param {string} message 
     */
    displayError(message) {
        console.error('> Display error. (' + message + ').');
        this.setState({
            path: {component: ErrorPageComponent, message: message, team: this.state.team ? this.state.team.id : ''}
        });
    }

    /**
     * {@inheritdoc}
     */
    render() {
        let PageComponent = this.state.path.component;
        return <div className='decision-engine'>
            <AppHeaderComponent user={this.state.user} team={this.state.team} />
            <div className={'alert message' + (this.state.message ? '' : ' hidden')}>{this.state.message}</div>
            <PageComponent user={this.state.user} team={this.state.team} path={this.state.path} />
        </div>;
    }

}
