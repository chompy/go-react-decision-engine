import { faPowerOff, faHouse } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import BackendAPI from '../api';
import Events from '../events';

export default class AppHeaderComponent extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            teamName : props.team?.name,
            user: props?.user
        };
        this.onClickLogout = this.onClickLogout.bind(this);
        this.onAPILogout = this.onAPILogout.bind(this);
        this.onTeam = this.onTeam.bind(this);
        this.onUser = this.onUser.bind(this);
    }

    /**
     * {@inheritdoc}
     */
    componentDidMount() {
        Events.listen('team', this.onTeam);
        Events.listen('user_me', this.onUser);
    }

    /**
     * {@inheritdoc}
     */
    componentWillUnmount() {
        Events.remove('team', this.onTeam);
        Events.remove('user_me', this.onUser);
    }

    /**
     * {@inheritdoc}
     */
    componentDidUpdate() {
        if (this.props.user && !this.state.user) {
            this.setState({user: this.props.user});
        }
    }

    /**
     * @param {Event} e 
     */
    onClickLogout(e) {
        e.preventDefault();
        BackendAPI.get('user/logout', null, this.onAPILogout);
    }

    /**
     * @param {Object} res 
     */
    onAPILogout(res) {
        if (!res.success) {
            throw res;
        }
        Events.dispatch('logout');
    }

    /**
     * @param {Event} event
     */
    onTeam(e) {
        this.setState({teamName: e.detail.name});
    }

    /**
     * @param {Event} event
     */
    onUser(e) {
        this.setState({user: e.detail.user});
    }

    renderUser() {
        if (!this.props.user) {
            return null;
        }
        return <div className='user'>
            <div className='name'>{this.state.user?.email}</div>
            <div className='options'>
                <a href='#' title='Dashboard'><FontAwesomeIcon icon={faHouse} /></a>
                <a href='#' onClick={this.onClickLogout} title='Logout'><FontAwesomeIcon icon={faPowerOff} /></a>    
            </div>
        </div>;
    }

    /**
     * {@inheritdoc}
     */
    render() {
        return <div className='header'>
            <div className='app-name'>{this.state.teamName ? this.state.teamName : ''}</div>
            {this.renderUser()}
        </div>;
    }

}
