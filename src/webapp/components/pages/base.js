import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleExclamation, faCog } from '@fortawesome/free-solid-svg-icons';
import Events from '../../events';
import md5 from 'blueimp-md5';
import { message as msgPopup } from 'react-message-popup';
import { APP_TITLE, MSG_DISPLAY_TIME, MSG_INVALID_PERMISSION } from '../../config';
import UserPermission from '../../user_permission';

export const FIELD_TYPE_TEXT = 'text';
export const FIELD_TYPE_PASSWORD = 'password';
export const FIELD_TYPE_CHECKBOX = 'checkbox';
export const FIELD_TYPE_CHECKBOXES = 'checkboxes';
export const FIELD_TYPE_COLOR = 'color';

export default class BasePageComponent extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            error: '',
            team: props?.team,
            user: props?.user
        };
        this.mode = props?.mode;
        this.state.loading = !(this.state.team && this.state.user);
        this.onPageButton = this.onPageButton.bind(this);
        this.onTeam = this.onTeam.bind(this);
        this.onUserMe = this.onUserMe.bind(this);
        this.pageButtons = {};
        this.msgLoadPromise = null;
        this.mountTime = null;
        this.bindEvents();
    }

    /**
     * {@inheritdoc}
     */
    componentDidMount() {
        this.mountTime = new Date().getTime();
        Events.listen('team', this.onTeam);
        Events.listen('user_me', this.onUserMe);
        if (this.state.team && this.state.user) {
            console.log('> Page "' + this.constructor.getName() + '" is ready.');
            this.onReady();
        }
    }

    /**
     * {@inheritdoc}
     */
    componentWillUnmount() {
        Events.remove('team', this.onTeam);
        Events.remove('user_me', this.onUserMe);
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
    static getTitle() {
        return 'Unknown';
    }

    /**
     * Bind 'on' functions to this.
     */
    bindEvents() {
        let funcs = Object.getOwnPropertyNames(this.__proto__);
        for (let k in funcs) {
            let name = funcs[k];
            if (name.substring(0, 2) == 'on') {
                this[name] = this[name].bind(this);
            }
        }
    }

    /**
     * Navigate to a new page.
     * @param {BasePageComponent} component 
     * @param {Object} params 
     */
    gotoPage(component, params) {
        Events.dispatch('goto_page', {component: component, params: params});
    }

    /**
     * Navigate to referer page.
     */
    gotoReferer() {
        Events.dispatch('goto_referer');
    }

    /**
     * Handle button click event with page navigation.
     * @param {Event} e 
     */
    onPageButton(e) {
        e.preventDefault();
        let key = e.target.getAttribute('data-key');
        if (!(key in this.pageButtons)) {
            return;
        }
        this.gotoPage(
            this.pageButtons[key].component,
            this.pageButtons[key].params,
        );
    }

    /**
     * @param {Event} e 
     */
    onTeam(e) {
        this.setState({team: e.detail});
        if (this.state.user) {
            console.log('> Page "' + this.constructor.getName() + '" is ready.');
            this.onReady();
        }
    }

    /**
     * @param {Event} e 
     */
    onUserMe(e) {
        this.setState({user: e.detail});
        if (this.state.team) {
            console.log('> Page "' + this.constructor.getName() + '" is ready.');
            this.onReady();
        }
    }

    /**
     * Fires when all pre-api (user, team) calls have been made.
     */
    onReady() {
        this.setLoaded();
    }

    /**
     * Flag that page is done loading, remove loading animation and render page.
     */
    setLoaded() {
        if (new Date().getTime() - this.mountTime < 250) {
            let delayLoading = function() {
                this.setState({loading: false});        
            }
            delayLoading = delayLoading.bind(this);
            setTimeout(delayLoading, 150);
            return;
        }
        this.setState({loading: false});
    }

    /**
     * Set title of page.
     * @param {String} title 
     */
    setTitle(title) {
        document.title = (title ? (title + ' - ') : '') + APP_TITLE;
    }

    /**
     * Handle an error API response.
     * @param {Object} res 
     * @returns {boolean}
     */
    handleErrorResponse(res) {
        if (res.success) { return false; }
        console.error('> ERROR: ' + res.message, res);
        if (this.state.loading) {
            this.setState({error: res.message});
            return true;
        }
        msgPopup.error(res.message, MSG_DISPLAY_TIME);
        return true;
    }

    /**
     * Handles an error from a batch API response.
     * @param {Object} res 
     * @returns {boolean}
     */
    handleBatchErrorResponse(res) {
        if (this.handleErrorResponse(res)) { return true; }
        for (let i in res.data) {
            if (this.handleErrorResponse(res.data[i])) { return true; }
        }
        return false;
    }

    /**
     * Return true if user has given permission.
     * @param {String} perm 
     * @returns {Boolean}
     */
    hasPermission(perm) {
        if (!this.state.user) { return false; }
        return UserPermission.userCan(this.state.user, perm);
    }

    /**
     * Check if user has any of given permission.
     * @param  {...String} perms 
     * @returns {Boolean}
     */
    checkAnyPermission(...perms) {
        if (!this.state.user) { return false; }
        for (let i in perms) {
            if (UserPermission.userCan(this.state.user, perms[i])) {
                return true;
            }
        }
        this.setState({error: MSG_INVALID_PERMISSION});
        return false;
    }

    /**
     * Check if user has all of given permissions.
     * @param  {...String} perms 
     * @returns {Boolean}
     */
    checkAllPermission(...perms) {
        if (!this.state.user) { return false; }
        for (let i in perms) {
            if (!UserPermission.userCan(this.state.user, perms[i])) {
                this.setState({error: MSG_INVALID_PERMISSION});
                return false;
            }
        }
        return true;
    }
    
    /**
     * Render page navigation button.
     * @param {string} label 
     * @param {BasePageComponent} component 
     * @param {Object} params 
     * @param {*} icon 
     */
    renderPageButton(label, component, params, icon) {
        let key = md5(component.getName() + JSON.stringify(params));
        this.pageButtons[key] = {
            component: component,
            params: params
        };
        let renderIcon = null;
        if (icon) {
            renderIcon = <FontAwesomeIcon icon={icon} />;
            label = ' ' + label;
        }
        return <button
                key={'pbtn-' + label + '-' + key}
                className='pure-button'
                onClick={this.onPageButton} data-key={key}
                title={label}
            >
                {renderIcon}{label}
        </button>;
    }

    /**
     * Render callback button.
     * @param {string} label 
     * @param {CallableFunction} callback 
     * @param {*} icon 
     * @param {boolean} disable
     */
    renderCallbackButton(label, callback, icon, disable) {
        let renderIcon = null;
        if (icon) {
            label = ' ' + label;
            renderIcon = <FontAwesomeIcon icon={icon} />;
        }
        return <button
                key={'cbtn-' + label}
                className='pure-button'
                onClick={callback}
                disabled={disable}
            >
                {renderIcon}{label}
        </button>;
    }

    /**
     * Render form fields based on object containing field definitions.
     * @param {Object} field
     */
    renderFormField(field) {
        if (!field?.id) { return null; }
        let type = field?.type ? field.type : FIELD_TYPE_TEXT;
        let label = field?.label ? field.label : '';
        let value = field?.value ? field.value : '';
        let callback = field?.callback; typeof field.label == 'undefined' ? null : field.callback;
        let disabled = field?.disabled;
        let placeholder = field?.placeholder ? field.placeholder : '';
        let errors = field?.errors ? field.errors : [];
        let fieldRender = null;
        switch (type) {
            case FIELD_TYPE_CHECKBOXES: {
                let options = field?.options ? field.options : [];
                fieldRender = [];
                for (let i in options) {
                    let choiceId = field.id + '_' + i; 
                    fieldRender.push(
                        <label key={field.id + '_cb_' + i} htmlFor={choiceId} className='pure-checkbox'>
                            <input
                                type='checkbox'
                                id={choiceId}
                                onChange={callback}
                                value={i}
                                checked={value.indexOf(i) != -1} 
                                disabled={disabled}
                            />
                            &nbsp;{options[i]}
                        </label>
                    )
                }
                break;
            }
            case FIELD_TYPE_CHECKBOX: {
                fieldRender = <label key={field.id}>
                    <input
                        type='checkbox'
                        id={field.id}
                        onChange={callback}
                        value='1'
                        checked={!!value} 
                        disabled={disabled}
                    />
                    &nbsp;{label}
                </label>
                break;
            }
            default: {
                fieldRender = <input
                    type={type}
                    id={field.id}
                    onChange={callback}
                    value={value}
                    disabled={disabled}
                    placeholder={placeholder}
                />;
                break;
            }
        }
        let errorMessageElements = [];
        for (let i in errors) {
            if (!errors[i]) { continue; }
            errorMessageElements.push(
                <li key={'ff-' + field.id + '-errmsg-' + errors[i]}>{errors[i]}</li>
            );
        }
        let labelElement = null;
        if (label && type != FIELD_TYPE_CHECKBOX) {
            labelElement = <label htmlFor={field.id}>{label}</label>;
        }
        return <div key={'ff-' + field.id} className={'form-field' + (errorMessageElements.length > 0 ? ' error' : '')}>
                {labelElement}{fieldRender}
                <ul className='error-messages'>{errorMessageElements}</ul>
            </div>
        ;
    }

    /**
     * Render loading animation. 
     */
    renderLoader() {
        return <div className='page loading'>
            <FontAwesomeIcon icon={faCog} />
        </div>;
    }

    /**
     * Render error message.
     */
    renderError() {
        let message = 'An error has occured.';
        if (this.state.error) {
            message = this.state.error;
        }
        return <div className='page error'>
            <section>
                <h2 className='section-name'>Error</h2>
                        <div className='alert error'>
                        <FontAwesomeIcon icon={faCircleExclamation} /><br/>
                        {message}
                    </div>
            </section>
        </div>;
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
