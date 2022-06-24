import React from 'react';
import BackendAPI from '../../api';
import Events from '../../events';
import Helpers from '../../helpers';

export default class UserTimeComponent extends React.Component {

    /** {@var Object} */
    static users = {};

    static userFetchQueue = {};

    constructor(props) {
        super(props);
        this.state = {
            user: null
        };
        this.user = typeof props.user != 'undefined' ? props.user : '';
        this.time = typeof props.time != 'undefined' ? props.time : new Date();
        this.onUserResponse = this.onUserResponse.bind(this);
        this.onUserFetch = this.onUserFetch.bind(this);
    }

    /**
     * {@inheritDoc}
     */
    componentDidMount() {
        if (this.user) {
            if (this.user in UserTimeComponent.users) {
                if (UserTimeComponent.users[this.user]) {
                    this.setState({user: UserTimeComponent.users[this.user]});
                    return;
                }
                Events.listen('user_fetch', this.onUserFetch);
                return;
            }
            UserTimeComponent.users[this.user] = false;
            BackendAPI.get('user', {id: this.user}, this.onUserResponse);
        }
    }

    /**
     * {@inheritDoc}
     */
    componentWillUnmount() {
        Events.remove('user_fetch', this.onUserFetch);
    }

    /**
     * @param {Object} res 
     */
    onUserResponse(res) {
        if (!res.success) { return; }
        UserTimeComponent.users[res.data.id] = res.data;
        this.setState({user: res.data});
        Events.dispatch('user_fetch', res.data);
    }

    /**
     * @param {Event} e 
     */
    onUserFetch(e) {
        if (e.detail.id == this.user && !this.state.user) {
            this.setState({user: e.detail});
        }
    }

    /**
     * {@inheritDoc}
     */
    render() {
        return <span className='user-time helper'>
            <span className='time'>{Helpers.formatDate(this.time)}</span>
            <span className='user'>{this.state.user ? ('(' + this.state.user.email + ')') : ''}</span>
        </span>
    }

}