import { faPowerOff, faHouse } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import BackendAPI from '../api';
import Events from '../events';

export default class AppHeaderComponent extends React.Component {

    constructor(props) {
        super(props);
        this.onClickLogout = this.onClickLogout.bind(this);
        this.onAPILogout = this.onAPILogout.bind(this);
    }

    /**
     * {@inheritdoc}
     */
    componentDidMount() {

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

    renderUser() {
        if (!this.props.user) {
            return null;
        }
        return <div className='user'>
            <div className='name'>{this.props.user.email}</div>
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
            <div className='app-name'>{this.props.team ? this.props.team.name : ''}</div>
            {this.renderUser()}
        </div>;
    }

}
