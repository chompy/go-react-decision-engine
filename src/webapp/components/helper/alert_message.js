import React from 'react';
import { MSG_DISPLAY_TIME } from '../../config';

export default class AlertMessageComponent extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            visible: true
        };
        this.message = typeof props.message != 'undefined' ? props.message : '';
        this.time = typeof props.time != 'undefined' ? props.time : new Date().getTime();
        this.onHide = this.onHide.bind(this);
    }

    /**
     * {@inheritDoc}
     */
    componentDidMount() {
        setTimeout(this.onHide, MSG_DISPLAY_TIME);
    }

    /**
     * {@inheritDoc}
     */
    componentWillUnmount() {
        
    }

    onHide() {
        this.setState({visible: false});
    }

    /**
     * {@inheritDoc}
     */
    render() {
        if (!this.state.visible) {
            return null;
        }
        return <div className='alert message fade'>{this.message}</div>;
    }

}