import React from 'react';
import BackendAPI from '../../api';
import { BTN_BACK,FIELD_CUSTOMIZE_ADV, FIELD_CUSTOMIZE_BASIC } from '../../config';
import BasePageComponent from './base';
import { message as msgPopup } from 'react-message-popup';
import { faBackward, faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import TeamDashboardPageComponent from './team_dashboard';

export default class PreviewPageComponent extends BasePageComponent {

    constructor(props) {
        super(props);
        this.state.loading = false;
    }

    /**
     * {@inheritDoc}
     */
    static getName() {
        return 'preview';
    }

    /**
     * {@inheritDoc}
     */
    render() {
        if (this.state.error) {
            return this.renderError();
        } else if (this.state.loading) {
            return this.renderLoader();
        }
        return <div className='page preview'>
            <h1 className='title'>Sample Title</h1>
            <div className='options top'>
                {this.renderCallbackButton('Sample Button', null, faCirclePlus)}
            </div>
            <section>
                <div className='pure-form pure-form-stacked' noValidate={true}>
                    <fieldset>
                        <legend>Sample Section</legend>
                        <label htmlFor='sample-text'>Sample Text Input</label>
                        <input type='text' id='sample-text' />
                        <label key='sample-checkbox' htmlFor='sample-checkbox-1' className='pure-checkbox'>
                            <input type='checkbox' id='sample-checkbox-1' /> Sample Checkbox
                        </label>
                    </fieldset>
                </div>
            </section>
        </div>;
    }

}
