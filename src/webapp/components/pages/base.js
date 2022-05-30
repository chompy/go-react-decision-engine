import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export const FIELD_TYPE_TEXT = 'text';
export const FIELD_TYPE_PASSWORD = 'password';

export default class BasePageComponent extends React.Component {

    constructor(props) {
        super(props);
        this.onPageButton = this.onPageButton.bind(this);
    }

    /**
     * {@inheritdoc}
     */
    componentDidMount() {

    }

    /**
     * Name of page.
     * @returns {string}
     */
    static getName() {
        return 'base';
    }

    /**
     * Display title of page.
     * @returns {string}
     */
    getTitle() {
        return 'Unknown';
    }

    /**
     * Navigate to a new page.
     * @param {string} name 
     * @param {Object} params 
     */
    gotoPage(name, params) {
        let hash = '#' + name;
        if (params && typeof params == 'object') {
            for (let k in params) {
                hash += '-' + k + '-' + params[k];
            }
        }
        window.location.hash = hash;
    }

    /**
     * Handle button click event with page navigation.
     * @param {Event} e 
     */
    onPageButton(e) {
        e.preventDefault();
        let page = e.target.getAttribute('data-page');
        if (!page) { return; }
        let params = e.target.getAttribute('data-params');
        window.location.hash = '#' + page + params;
    }

    /**
     * Render page navigation button.
     * @param {string} label 
     * @param {string} page 
     * @param {Object} params 
     * @param {*} icon 
     */
    renderPageButton(label, page, params, icon) {
        let paramStr = '';
        if (typeof params == 'object') {
            for (let k in params) {
                paramStr += '-' + k + '-' + params[k];
            }
        }
        let renderIcon = null;
        if (icon) {
            renderIcon = <FontAwesomeIcon icon={icon} />;
            label = ' ' + label;
        }
        return <button
                key={'pbtn-' + label + '-' + page + paramStr}
                className='pure-button'
                onClick={this.onPageButton} data-page={page}
                title={label}
                data-params={paramStr}
            >
                {renderIcon}{label}
        </button>;
    }

    /**
     * Render callback button.
     * @param {string} label 
     * @param {CallableFunction} callback 
     * @param {*} icon 
     */
    renderCallbackButton(label, callback, icon) {
        let renderIcon = null;
        if (icon) {
            label = ' ' + label;
            renderIcon = <FontAwesomeIcon icon={icon} />;
        }
        return <button
                key={'cbtn-' + label}
                className='pure-button'
                onClick={callback}
            >
                {renderIcon}{label}
        </button>;
    }

    /**
     * Render form fields based on object containing field definitions.
     * @param {Object} field
     */
    renderFormField(field) {
        if (typeof field.id == 'undefined') { return null; }
        let type = typeof field.type == 'undefined' ? FIELD_TYPE_TEXT : field.type;
        let label = typeof field.label == 'undefined' ? field.id : field.label;
        let value = typeof field.value == 'undefined' ? '' : field.value;
        let callback = typeof field.label == 'undefined' ? null : field.callback;
        let fieldRender = null;
        switch (type) {
            default: {
                fieldRender = <input type={type} id={field.id} onChange={callback} value={value} />;
                break;
            }
        }
        return <div key={'ff-' + field.id} className='form-field'>
                <label htmlFor={field.id}>{label}</label>
                {fieldRender}
            </div>
        ;
    }

    /**
     * {@inheritdoc}
     */
     render() {
        return <div className='page base'>
            <em>ERROR!</em>
        </div>;
    }

}
