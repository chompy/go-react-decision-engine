import React from 'react';
import BasePageComponent from './base';
import { faCirclePlus } from '@fortawesome/free-solid-svg-icons';

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
