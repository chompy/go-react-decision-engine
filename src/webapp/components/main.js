import React from 'react';
import BackendAPI from '../api';
import Events from '../events';
import AppHeaderComponent from './header';
import BasePageComponent from './pages/base';
import LoginPageComponent from './pages/login';
import PathResolver from '../path_resolver';
import ErrorPageComponent from './pages/error';
import { ERR_NOT_FOUND, MSG_DISPLAY_TIME, MSG_LOGIN_SUCCESS, MSG_LOGOUT_SUCCESS, MSG_SESSION_EXPIRED } from '../config';
import { message as msgPopup } from 'react-message-popup';
import TreeListPageComponent from './pages/tree_list';

export default class DecisionEngineMainComponent extends React.Component {

    constructor(props) {
        super(props);
        let pathResolve = PathResolver.resolveCurrentPath();
        console.log('> Path resolved to "' + pathResolve.component.getName() + '."');
        this.state = {
            path: pathResolve,
            user: null,
            team: null,
            referer: null
        };
        this.onPopState = this.onPopState.bind(this);
        this.onUserMe = this.onUserMe.bind(this);
        this.onTeam = this.onTeam.bind(this);
        this.onLogin = this.onLogin.bind(this);
        this.onLogout = this.onLogout.bind(this);
        this.onGotoPage = this.onGotoPage.bind(this);
        this.onSessionExpire = this.onSessionExpire.bind(this);
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
        Events.listen('session_expire', this.onSessionExpire);
    }

    /**
     * {@inheritdoc}
     */
    componentWillUnmount() {
        Events.remove('login', this.onLogin);
        Events.remove('logout', this.onLogout);
        Events.remove('goto_page', this.onGotoPage);
        Events.remove('session_expire', this.onSessionExpire);
    }

    /**
     * @param {Object} res 
     */
    onUserMe(res) {
        if (!res.success) { 
            if (this.state.path.component == LoginPageComponent) {
                return;
            } else if (this.state.path.component != LoginPageComponent && this.state.path.team) {
                this.gotoPage(LoginPageComponent, {team: this.state.path.team, referer: this.state.path});
                return;
            }
            this.displayError(ERR_NOT_FOUND);
            return;            
        }
        console.log('> Fetched user "' + res.data.email + '" (' + res.data.id + ').');
        this.setState({user: res.data});
        if (this.state.path.component == LoginPageComponent || res.data.team != this.state.path.team) {
            this.gotoPage(TreeListPageComponent, {team: res.data.team});
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
        msgPopup.success(MSG_LOGIN_SUCCESS, MSG_DISPLAY_TIME);
        if (typeof this.state.path.referer != 'undefined') {
            this.gotoPage(this.state.path.referer.component, this.state.path.referer);
            return; 
        }
        this.gotoPage(TreeListPageComponent);
    }

    /**
     * @param {Event} e 
     */
    onLogout(e) {
        console.log('> Log out successful.');
        this.setState({user: null});
        msgPopup.success(MSG_LOGOUT_SUCCESS, MSG_DISPLAY_TIME);
        this.gotoPage(LoginPageComponent, {team: this.state.team.id});
    }

    /**
     * @param {Event} e 
     */
    onPopState(e) {
        e.preventDefault();
        let resolvedPage = PathResolver.resolveCurrentPath();
        if (resolvedPage.component == LoginPageComponent && this.state.user) {
            this.gotoPage(TreeListPageComponent, {team: this.state.user.team});
            return;
        }
        this.setState({path: resolvedPage});
    }

    /**
     * @param {Event} e 
     */
    onSessionExpire(e) {
        msgPopup.success(MSG_SESSION_EXPIRED, MSG_DISPLAY_TIME);
        this.gotoPage(
            LoginPageComponent, {referer: this.state.path}
        );
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
        if (component == LoginPageComponent && typeof params.referer != 'undefined') {
            resolvedPage.referer = params.referer;
        }
        this.setState({path: resolvedPage, referer: this.state.path});
    }

    /**
     * @param {String} message 
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
            <PageComponent user={this.state.user} team={this.state.team} path={this.state.path} referer={this.state.referer} />
        </div>;
    }

}
