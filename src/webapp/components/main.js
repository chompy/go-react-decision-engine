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
import UserTimeComponent from './helper/user_time';
import TeamDashboardPageComponent from './pages/team_dashboard';

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
        this.onUserTeam = this.onUserTeam.bind(this);
        this.onLogin = this.onLogin.bind(this);
        this.onLogout = this.onLogout.bind(this);
        this.onGotoPage = this.onGotoPage.bind(this);
        this.onGotoReferer = this.onGotoReferer.bind(this);
        this.onSessionExpire = this.onSessionExpire.bind(this);
    }

    /**
     * {@inheritdoc}
     */
    componentDidMount() {
        window.addEventListener('popstate', this.onPopState);
        if (typeof this.state.path.team != 'undefined' && this.state.path.team) {
            BackendAPI.batch(
                [
                    {path: 'team/fetch', payload: {id: this.state.path.team}},
                    {path: 'user/me'}
                ],
                this.onUserTeam
            )
        }
        Events.listen('login', this.onLogin);
        Events.listen('logout', this.onLogout);
        Events.listen('goto_page', this.onGotoPage);
        Events.listen('goto_referer', this.onGotoReferer);
        Events.listen('session_expire', this.onSessionExpire);
    }

    /**
     * {@inheritdoc}
     */
    componentWillUnmount() {
        Events.remove('login', this.onLogin);
        Events.remove('logout', this.onLogout);
        Events.remove('goto_page', this.onGotoPage);
        Events.remove('goto_refer', this.onGotoReferer);
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
                this.gotoPage(
                    LoginPageComponent, {team: this.state.path.team, referer: this.state.path}, true
                );
                return;
            }
            this.displayError(ERR_NOT_FOUND);
            return;            
        }
        console.log('> Fetched user "' + res.data.email + '" (' + res.data.id + ').');
        this.setState({user: res.data});
        if (this.state.path.component == LoginPageComponent || res.data.team != this.state.path.team) {
            this.gotoPage(TeamDashboardPageComponent, {team: res.data.team}, true);
        }
        UserTimeComponent.users[res.data.id] = res.data;
        Events.dispatch('user_me', res.data);
    }

    /**
     * @param {Object} res 
     */
    onUserTeam(res) {
        if (!res.success) { 
            this.displayError(ERR_NOT_FOUND);
            return;
        }
        let teamResp = res.data[0];
        let userResp = res.data[1];
        if (!teamResp.success) {
            this.displayError(ERR_NOT_FOUND);
            return;
        }
        console.log('> Fetched team "' + teamResp.data.name + '" (' + teamResp.data.id + ').');
        this.setState({
            team: teamResp.data
        });
        Events.dispatch('team', teamResp.data);
        this.onUserMe(userResp);
    }

    /**
     * @param {Event} e 
     */
    onLogin(e) {
        console.log('> Log in successful.');
        BackendAPI.get('user/me', null, this.onUserMe);
        msgPopup.success(MSG_LOGIN_SUCCESS, MSG_DISPLAY_TIME);
        if (typeof this.state.path.referer != 'undefined') {
            this.gotoPage(this.state.path.referer.component, this.state.path.referer, true);
            return; 
        }
        this.gotoPage(TeamDashboardPageComponent, {}, true);
    }

    /**
     * @param {Event} e 
     */
    onLogout(e) {
        console.log('> Log out successful.');
        this.setState({user: null});
        msgPopup.success(MSG_LOGOUT_SUCCESS, MSG_DISPLAY_TIME);
        this.gotoPage(LoginPageComponent, {team: this.state.team.id}, true);
    }

    /**
     * @param {Event} e 
     */
    onPopState(e) {
        e.preventDefault();
        let resolvedPage = PathResolver.resolveCurrentPath();
        if (resolvedPage.component == LoginPageComponent && this.state.user) {
            this.gotoPage(TeamDashboardPageComponent, {team: this.state.user.team}, true);
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
            LoginPageComponent, {referer: this.state.path}, true
        );
    }

    /**
     * Fires when 'goto-page' event is received.
     * @param {Event} e 
     */
    onGotoPage(e) {
        this.gotoPage(e.detail.component, e.detail.params);
    }

    /**
     * Fires when 'goto-referer' event is received.
     */
    onGotoReferer() {
        this.gotoReferer();
    }

    /**
     * Navigate to page.
     * @param {BasePageComponent} component 
     * @param {Object} params 
     * @param {boolean} noReferer
     */
    gotoPage(component, params, noReferer) {
        console.log('> Go to "' + component.getName() + '" page.');
        params = Object.assign({}, {
            team: this.state.team ? this.state.team.id : '',
            user: this.state.user ? this.state.user.id : ''
        }, params ? params : {});
        let path = PathResolver.getPathFromComponent(component, params);        
        PathResolver.setPath(path);
        let resolvedPage = PathResolver.resolveCurrentPath();
        if (component == LoginPageComponent && typeof params.referer != 'undefined') {
            resolvedPage.referer = params.referer;
        }
        if (this.state.path && !noReferer) {
            window.localStorage.setItem(
                'page-referer-' + resolvedPage.component.getName(),
                PathResolver.getPathFromComponent(this.state.path.component, this.state.path)
            );
        }
        let stateParams = {path: resolvedPage};
        if (!noReferer) { stateParams.referer = this.state.path; }
        this.setState(stateParams);
    }

    /**
     * Navigate to referer page.
     */
    gotoReferer() {
        if (!this.state.path) {
            this.gotoPage(TeamDashboardPageComponent);
        }
        let pathStr = window.localStorage.getItem('page-referer-' + this.state.path.component.getName());
        if (!pathStr) {
            this.gotoPage(TeamDashboardPageComponent)
        }
        let path = PathResolver.resolvePath(pathStr);
        this.gotoPage(path.component, path, true);
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
