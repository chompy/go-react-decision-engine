import React from 'react';

import BasePageComponent from './base';
import { faCircleExclamation } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default class ErrorPageComponent extends BasePageComponent {

    constructor(props) {
        super(props);
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
        return 'error';
    }

    /**
     * {@inheritdoc}
     */
    static getTitle() {
        return 'Error';
    }

    /**
     * {@inheritdoc}
     */
    render() {
        let msg = ' An error has occured.';
        if (typeof this.props.path.message != 'undefined' && this.props.path.message) {
            msg = this.props.path.message;
        }
        return <div className='page error'>
            <section>
                <h2 className='section-name'>Error</h2>
                        <div className='alert error'>
                        <FontAwesomeIcon icon={faCircleExclamation} /><br/>
                        {msg}
                    </div>
            </section>
        </div>;
    }

}
