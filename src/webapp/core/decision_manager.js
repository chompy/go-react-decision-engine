import DecisionBuilder from './decision_builder';
import DecisionRenderer from './decision_renderer';
import DecisionUserData from './decision_user_data';
import Logger from './logger';
import ReactDOM from 'react-dom';
import DecisionBase from './decision_objects/base';
import DecisionRule, { RULE_TYPE_VALIDATION, RULE_TYPE_VISIBILITY } from './decision_objects/rule';
import PdfBuilder from './pdf_builder';
import md5 from 'blueimp-md5';
import Events from './events';
import InvalidArgumentException from './errors';

import ShortcodeManager from './shortcode/manager';
import AnswersShortcode from './shortcode/answers';
import RuleEngine from './rule_engine';
import DecisionMatrix from './decision_objects/matrix';
import MatrixShortcode from './shortcode/matrix';

export const DECISION_STATE_NO_CHANGE = 0;
export const DECISION_STATE_NEXT = 1;
export const DECISION_STATE_PREVIOUS = 2;

export default class DecisionManager {

    /**
     * Possible options...
     *  element: Element to render decision engine in.
     *  urls: Dictionary of URLs used to fetch decision engine data. (fetch, userData, submit, answerDownload)
     *  readOnly: Puts decision engine in read only state, user data cannot be updated.
     *  userKey: User data key, used to fetch user data.
     *  submitOnInvalid: Allow form submit when a validation rule is false.
     *  
     * @param {object} options 
     */
    constructor(options) {
        let getOpt = function(key, defaultValue) {
            if (key in options) {
                return options[key];
            }
            return defaultValue;
        }
        this.element = getOpt('element', document.createElement('div'));
        this.urls = Object.assign({
            fetch: '/_ccde/object/fetch',
            userData: '/_ccde/user_data/fetch',
            submit: '/_ccde/user_data/submit',
            answerDownload: '/_ccde/download'
        }, getOpt('urls', {}));
        this.readOnly = getOpt('readOnly', false) ? true : false;
        this.submitOnInvalid = getOpt('submitOnInvalid', false) ? true : false;
        this.userData = new DecisionUserData(getOpt('userKey', DecisionBase.generateUid()));
        this.lastSubmitMd5 = '';
        this.objects = [];
        this.currentIndex = 0;
        this.shortcodeManager = new ShortcodeManager();
        this.fetchRequest = null;
        this.fetchUserDataRequest = null;
        this.onFetchLoad = this.onFetchLoad.bind(this);
        this.onFetchError = this.onFetchError.bind(this);
        this.onUserDataFetchLoad = this.onUserDataFetchLoad.bind(this);
        this.onUserDataFetchError = this.onUserDataFetchError.bind(this);
        this.onFormChange = this.onFormChange.bind(this);
        this.onSetAnswers = this.onSetAnswers.bind(this);
        this.onDoLoad = this.onDoLoad.bind(this);
        this.onDoSubmit = this.onDoSubmit.bind(this);
        this.onDoPdf = this.onDoPdf.bind(this);
        this.onDoEvaluate = this.onDoEvaluate.bind(this);
        this.onDoUserData = this.onDoUserData.bind(this);
        this.builder = new DecisionBuilder();
        this.rules = {};
        this.initShortcode();
        this.hook();
    }

    /**
     * Load decision object of given uid.
     * @param {string} uid 
     */
    load(uid, version) {
        let callback = function(obj) {
            // set object as current object
            for (let i in this.objects) {
                if (this.objects[i].uid == obj.uid) {
                    this.currentIndex = i;
                    break;
                }
            }
            // render to dom
            this.render(obj);
            // populate form
            this.populate(obj);
        }
        callback = callback.bind(this);
        // check if already fetched
        let obj = this.getObject(uid);
        if (obj) {
            return callback(obj);
        }
        // fetch
        this.fetch(uid, version, callback);
    }

    /**
     * Load previous decision object.
     */
    loadPrevious() {
        if (this.currentIndex <= 0) {
            Logger.warn('Cannot load previous decision object, first already loaded.');
            return;
        }
        this.load(this.objects[this.currentIndex-1].uid);
    }

    /**
     * Load next decision object.
     */
    loadNext() {
        if (typeof(this.objects[this.currentIndex]) == 'undefined') {
            Logger.warn('Cannot load next decision object, none currently loaded.');
            return;
        }
        if (
            typeof(this.objects[this.currentIndex].next) == 'undefined' ||
            !this.objects[this.currentIndex].next
        ) {
            Logger.warn('Cannot load next decision object, next object not defined.');
            return;
        }
        return this.load(this.objects[this.currentIndex].next);
    }

    /**
     * Fetch object of given uid.
     * @param {string} uid
     * @param {int} version
     * @param {Function} callback
     */
    fetch(uid, version, callback) {
        if (this.fetchRequest && this.fetchRequest.readyState != XMLHttpRequest.DONE) {
            Logger.warn('Attempted to fetch object data while fetch already in progress.');
            return;
        }
        Logger.resetTimer('ccde_fetch');
        // send pre fetch event
        Events.dispatch(
            'pre_fetch',
            {uid: uid}
        );
        // fetch
        if (!this.userData) {
            this.userData = new DecisionUserData('');
        }
        this.fetchRequest = new XMLHttpRequest();
        this.fetchRequest.callback = callback;
        this.fetchRequest.uid = uid;
        if (!version) {
            version = this.userData.getObjectVersion(uid);
        }
        let verHash = '';
        if (!version) {
            verHash = this.userData.getObjectVersionHash(uid);
        }
        this.fetchRequest.open(
            'get' , 
            this.urls.fetch + '?uid=' + uid + 
            (version && version > 0 ? '&ver=' : '&ver_hash=') + (version && version > 0 ? version : verHash)
        );
        this.fetchRequest.addEventListener('load', this.onFetchLoad);
        this.fetchRequest.addEventListener('error', this.onFetchError);
        this.fetchRequest.send();
    }

    /**
     * Fires when an object fetch finishes.
     * @param {Event} e 
     */
    onFetchLoad(e) {
        // non 200 response
        if (e.target.status != 200) {
            let errorMessage = 'Fetch failed. ' + e.target.statusText + ' [UID=' + e.target.uid + ']';
            Logger.errorTime(errorMessage);
            Events.dispatch('error', {
                type: 'fetch',
                message: errorMessage,
                uid: e.target.uid
            });
            return
        }
        if (e.target.responseURL.includes('/login')) {
            let errorMessage = 'Fetch failed. Session has expired. [UID=' + e.target.uid + ']';
            Logger.errorTime(errorMessage);
            Events.dispatch('error', {
                type: 'fetch',
                message: errorMessage,
                uid: e.target.uid
            });
            return;
        }
        // log success
        Logger.infoTime(
            'Fetched decision object. [UID=' + e.target.uid + ']', 'ccde_fetch'
        );
        // validate/parse
        let data = {};
        try {
            data = JSON.parse(this.fetchRequest.response);
        } catch (e) {
            Logger.error(e.message);
            Events.dispatch('error', {
                type: 'fetch',
                message: e.message,
                uid: e.target.uid
            });
            return;
        }
        // build decision object
        Logger.resetTimer('ccde_build');
        // check data
        if (!data || !data.success || !data.data) {
            message = 'An unknown error occurred.';
            if (data && data.message) {
                message = data.message
            }
            let errorMessage = 'Fetch failed. ' + message + ' [UID=' + e.target.uid + ']';
            Logger.errorTime(errorMessage);
            Events.dispatch('error', {
                type: 'fetch',
                message: errorMessage,
                uid: e.target.uid
            });
            return;
        }
        let obj = this.builder.build(data.data);
        Logger.infoTime('Built decision object. [UID=' + e.target.uid + ']', 'ccde_build');
        // update existing
        for (let i in this.objects) {
            if (this.objects[i].uid == obj.uid) {
                this.objects[u] = obj;
                return;
            }
        }
        // set previous
        if (this.objects.length > 0) {
            obj.previous = this.objects[this.objects.length - 1];
        }
        // add new
        this.objects.push(obj);
        // callback
        if (this.fetchRequest.callback) {
            this.fetchRequest.callback(obj);
        }
    }

    /**
     * Fires when fetch has an error.
     * @param {Event} e 
     */
    onFetchError(e) {
        Logger.error(e);
        Events.dispatch('error', {
            type: 'fetch',
            message: e.message,
            uid: e.target.uid
        });
    }

    /**
     * Fetch user data.
     * @param {Function} callback 
     */
    fetchUserData(callback) {
        if (!this.userData.key) {
            return;
        }
        if (this.fetchUserDataRequest && this.fetchUserDataRequest.readyState != XMLHttpRequest.DONE) {
            Logger.warn('! Attempted to fetch user data while fetch already in progress.');
            return;
        }
        Logger.resetTimer('fetch_user_data');
        this.fetchUserDataRequest = new XMLHttpRequest();
        this.fetchUserDataRequest.callback = callback;
        this.fetchUserDataRequest.open('get', `${this.urls.userData}?user=${this.userData.key}`);
        this.fetchUserDataRequest.addEventListener('load', this.onUserDataFetchLoad);
        this.fetchUserDataRequest.addEventListener('error', this.onUserDataFetchError);
        this.fetchUserDataRequest.send();
    }

    /**
     * Fires when user data fetch is complete.
     * @param {Event} e 
     */
    onUserDataFetchLoad(e) {
        // non 200 response
        if (e.target.status != 200) {
            Logger.errorTime(
                'Fetch user data failed. ' + e.target.statusText + ' [KEY=' + this.userData.key + ']', 'fetch_user_data'
            );
            return;
        }
        if (e.target.responseURL.includes('/login')) {
            Logger.errorTime(
                'Fetch user data failed. Session has expired [KEY=' + this.userData.key + ']', 'fetch_user_data'
            );            
            return;
        }
        // parse
        let data = {};
        try {
            data = JSON.parse(this.fetchUserDataRequest.response);
        } catch (e) {
            Logger.errorTime(
                'Fetch user data failed. ' + e.message + ' [KEY=' + this.userData.key + ']',
                'fetch_user_data'
            );
            return;
        }
        if ('success' in data && !data.success) {
            Logger.errorTime(
                'Fetch user data failed. ' + data.message + ' [KEY=' + this.userData.key + ']', 'fetch_user_data'
            );            
            return;
        }
        // log success
        Logger.infoTime(
            'Fetched user data. [KEY=' + this.userData.key + ']', 'fetch_user_data'
        );
        this.userData = DecisionUserData.importJSON(data.data);
        if (this.fetchUserDataRequest.callback) {
            this.fetchUserDataRequest.callback(this.userData);
        }
    }

    /**
     * Fires when user data fetch has an error.
     * @param {Event} e 
     */
    onUserDataFetchError(e) {
        Logger.error(e);
    }

    /**
     * Render given object.
     * @param {DecisionBase} object 
     */
    render(object) {
        if (!object) { return; }
        // hook user data to object
        this.evaluate(object);
        // render to dom
        Logger.resetTimer('ccde_render');
        let rendered = DecisionRenderer.render(object, {
            userData: this.userData,
            readOnly: this.readOnly
        });    
        let renderCallback = function() {
            // populate form
            this.populate(object);
            // fire render event
            Events.dispatch(
                'render',
                {
                    userData: this.userData,
                    readOnly: this.readOnly,
                    object: object
                }
            );
            Logger.infoTime('Rendered object. [UID=' + object.uid + ']', 'ccde_render');
        };
        renderCallback = renderCallback.bind(this);
        ReactDOM.render(
            rendered,
            this.element,
            renderCallback
        );
    }

    /**
     * Populate form with current user data.
     * @param {DecisionBase} object 
     */
    populate(object) {
        Events.dispatch(
            'update',
            {
                userData: this.userData,
                object: object,
                checkValidation: this.userData.answers.length > 0
            }
        );
    }

    /**
     * Evaluate rules in give decision object.
     * @param {DecisionBase} object 
     */
    evaluate(object) {
        if (!(object instanceof DecisionBase)) {
            throw new InvalidArgumentException('Expected decision object.');
        }
        Logger.resetTimer('ccde_rule_eval');
        Events.dispatch(
            'pre_rule_evaluation',
            {
                object: object
            }
        );
        let evalRecur = function(object, matrixId) {
            // itterate children, find rules
            // reset validation
            this.userData.resetValidationState(object);
            // define function to fetch rule engine for given rule
            let getRuleEngine = function(rule) {
                let uid = rule.uid;
                if (matrixId) {
                    uid = uid + '_' + matrixId;
                }
                if (!(uid in this.rules)) {
                    this.rules[uid] = new RuleEngine;
                    for (let i in this.objects) {
                        if (this.objects[i].getChild(rule.uid)) {
                            this.rules[uid].setRootObject(this.objects[i]);
                            break;
                        }
                    }
                    try {
                        this.rules[uid].setRuleObject(rule);
                    } catch (e) {
                        console.warn('RULE ERROR - UID=' + rule.uid + ' ERROR=' + e.message);
                    }
                    this.rules[uid].matrixId = matrixId;
                }
                this.rules[uid].setUserData(this.userData);
                return this.rules[uid];
            }
            getRuleEngine = getRuleEngine.bind(this);
            // run visibility rules
            if (object.hasRuleOfType(RULE_TYPE_VISIBILITY)) {
                this.userData.setHidden(object, true);
                for (let i in object.children) {
                    let child = object.children[i];
                    if (child instanceof DecisionRule && (!child.type || child.type == RULE_TYPE_VISIBILITY)) {
                        let engine = getRuleEngine(child);
                        let res = {};
                        try {
                            res = engine.evaluate();
                        } catch (e) {
                            console.warn('RULE ERROR - UID=' + child.uid + ' ERROR=' + e.message);
                        }
                        Events.dispatch('rule_evaluation', res);
                        if (res.results) {
                            this.userData.setHidden(object, false, matrixId);
                            break;
                        }
                    }
                }
            }
            if (this.userData.isHidden(object, matrixId)) {
                return;
            }
            // run validation rules
            if (object.hasRuleOfType(RULE_TYPE_VALIDATION)) {
                this.userData.resetValidationState(object, matrixId);
                for (let i in object.children) {
                    let child = object.children[i];
                    if (child instanceof DecisionRule && child.type == RULE_TYPE_VALIDATION) {
                        let engine = getRuleEngine(child);
                        let res = null;
                        try {
                            res = engine.evaluate();
                        } catch (e) {
                            console.warn('RULE ERROR - UID=' + child.uid + ' ERROR=' + e.message);
                        }
                        if (res) {
                            if (!res.results) {
                                this.userData.addValidationMessage(object, res.message, matrixId);
                            }
                            Events.dispatch('rule_evaluation', res);
                        }
                    }
                }
            }
            // itterate children
            for (let i in object.children) {
                let child = object.children[i];
                if (child instanceof DecisionMatrix) {
                    let matrixIds = this.userData.findMatrixIds(child);
                    for (let j in matrixIds) {
                        evalRecur(child, matrixIds[j]);
                    }
                    continue;
                }
                evalRecur(child, matrixId);
            }
        }
        evalRecur = evalRecur.bind(this);
        evalRecur(object);
        Logger.infoTime(
            'Evaluated rules. [UID=' + object.uid + ' USER_KEY=' + this.userData.key + ']', 'ccde_rule_eval'
        );
    }

    /**
     * Submit user data to server.
     * @param {Function} callback
     */
    submitUserData(callback) {
        if (this.readOnly) {
            Logger.warn('Cannot submit user data in read only mode.');
            return;
        }
        Logger.info('Begin user data submission.');
        // fire pre event
        Events.dispatch(
            'pre_submit_user_data',
            {
                object: this.objects[this.currentIndex],
                userData: this.userData
            }
        );
        // add objects and thier version to user data
        for (let i in this.objects) {
            this.userData.addObject(this.objects[i]);
        }
        // increment save count
        this.userData.saveCount++;
        // check md5, avoid resubmitting if no change detected
        let md5Data = this.userData.exportJSON();
        md5Data.save_count = 0;
        md5Data.submit_count = 0;
        let submitDataMd5 = md5(JSON.stringify(md5Data));
        let submitData = JSON.stringify(this.userData.exportJSON());
        if (submitDataMd5 == this.submitDataMd5) {
            Logger.info(`Skipped, no changes detected. (MD5=${submitDataMd5})`);
            // send post submit event (still)
            Events.dispatch(
                'post_submit_user_data',
                {
                    object: this.objects[this.currentIndex],
                    userData: this.userData,
                    hash: submitDataMd5                
                }
            );
            // callback
            if (callback) {
                callback();
            }
            return;
        }
        Logger.resetTimer('ccde_submit');
        // make post request
        let request = new XMLHttpRequest();
        let c = callback;
        request.open('post', this.urls.submit);
        let loadCallback = function(e) {
            // non 200 response
            if (e.target.status != 200) {
                let errorMessage = 'Submit failed. ' + e.target.statusText;
                Logger.errorTime(errorMessage, 'ccde_submit');
                Events.dispatch('error', {
                    type: 'submit',
                    message: errorMessage,
                    uid: this.objects[this.currentIndex].uid,
                    userKey: this.userData.key,
                    userDataHash: submitDataMd5
                });
                return;
            }
            if (e.target.responseURL.includes('/login')) {
                let errorMessage = 'Submit failed. Session has expired.';
                Logger.errorTime(errorMessage, 'ccde_submit');
                Events.dispatch('error', {
                    type: 'submit',
                    message: errorMessage,
                    uid: this.objects[this.currentIndex].uid,
                    userKey: this.userData.key,
                    userDataHash: submitDataMd5
                });
                return;
            }
            // log success
            Logger.infoTime(
                `Submitted user data. [UID=${this.objects[this.currentIndex].uid} USER=${this.userData.key} MD5=${submitDataMd5}]`,
                'ccde_submit'
            );
            // validate/parse
            let data = {};
            try {
                data = JSON.parse(request.response);
            } catch (e) {
                Logger.error(e.message);
            }
            if (!data.success) {
                Logger.error(data.message, data);
                return;
            }
            // update md5
            this.submitDataMd5 = submitDataMd5;
            // send post submit event
            Events.dispatch(
                'post_submit_user_data',
                {
                    object: this.objects[this.currentIndex],
                    userData: this.userData,
                    hash: this.submitDataMd5       
                }
            );
            // callback
            if (c) {
                c();
            }
        };
        loadCallback = loadCallback.bind(this);
        request.addEventListener('load', loadCallback);
        let errorCallback = function(e) {
            Logger.error(e);
            Events.dispatch('error', {
                type: 'submit',
                message: e.message,
                uid: this.objects[this.currentIndex].uid,
                userKey: this.userData.key,
                userDataHash: submitDataMd5
            });
        };
        errorCallback = errorCallback.bind(this);
        request.addEventListener('error', errorCallback);
        request.send(submitData);        
    }

    /**
     * Fires when decision engine form has a change.
     * @param {Event} e 
     */
    onFormChange(e) {
        // retrieve current decision object
        if (typeof(this.objects[this.currentIndex]) == 'undefined') {
            Logger.warn('Update event recieved but no decision object is loaded.');
            return;
        }
        let o = this.objects[this.currentIndex];
        // ensure question belongs to current decision object
        if (!e.detail.question || e.detail.question.instanceId != o.instanceId) {
            return;
        }
        // add/remove multiples
        if (e.detail.multiple) {
            if (e.detail.delete) {
                this.userData.removeAnswer(e.detail.question, e.detail.answer, e.detail.matrix);
            } else {
                this.userData.addAnswer(e.detail.question, e.detail.answer, e.detail.matrix);
            }
        } else {
            // single answer
            this.userData.resetAnswers(e.detail.question, e.detail.matrix);
            this.userData.addAnswer(e.detail.question, e.detail.answer, e.detail.matrix);
        }
        // eval rules
        this.evaluate(o);
        // dispatch update event
        Events.dispatch(
            'update',
            {
                userData: this.userData,
                object: o
            }
        );
    }

    /**
     * Fires when 3rd party script request a decision object to load.
     * @param {Event} e 
     */
    onDoLoad(e) {
        if (typeof(e.detail.uid) == 'undefined' ) {
            Logger.warn('! Load event recieved but UID was not provided.');
            return;
        }
        this.load(e.detail.uid, typeof e.detail.version != 'undefined' ? e.detail.version : null);
    }

    /**
     * Fires when 3rd party script request user data fetch.
     * @param {Event} e 
     */
    onDoUserData(e) {
        if (typeof(e.detail.key) == 'undefined' ) {
            Logger.warn('! User data event recieved but USER KEY was not provided.');
            return;
        }
        this.userData = new DecisionUserData(e.detail.key);
        let callback = function() {
            if (this.objects[this.currentIndex]) {
                this.render(this.objects[this.currentIndex]);
                this.evaluate(this.objects[this.currentIndex]);
            }
        };
        callback = callback.bind(this);
        this.fetchUserData(callback);
    }

    /**
     * Fires when 3rd party script needs to set user data answers directly.
     * @param {Event} e 
     */
    onSetAnswers(e) {
        if (typeof(e.detail.uid) == 'undefined' ) {
            Logger.warn('! Set answer event recieved but UID was not provided.');
            return;
        }
        let question = this.objects[this.currentIndex].getChild(e.detail.uid);
        if (!question) {
            Logger.warn('! Set answer event recieved but question was not found.');
            return; 
        }
        let answers = [];
        if (typeof(e.detail.answers) != 'undefined' ) {
            answers = e.detail.answers;
        }
        this.userData.resetAnswers(question);
        for (let i in answers) {
            this.userData.addAnswer(question, answers[i]);
        }
        Events.dispatch(
            'update',
            {
                userData: this.userData,
                object: this.objects[this.currentIndex]                
            }
        );
    }

    /**
     * Fires when form is submitted or when 3rd party script requests submit.
     * @param {Event} e 
     */
    onDoSubmit(e) {
        // retrieve current decision object
        if (typeof(this.objects[this.currentIndex]) == 'undefined') {
            Logger.warn('Submit event received but no decision object is loaded.');
            return;
        }
        let o = this.objects[this.currentIndex];
        // ensure question belongs to current decision object
        if (!e.detail.object || e.detail.object.instanceId != o.instanceId) {
            return;
        }
        // state change
        let stateChange = DECISION_STATE_NO_CHANGE;
        if (typeof(e.detail.state) != 'undefined') {
            stateChange = e.detail.state;
        }
        // fire pre event
        Events.dispatch(
            'pre_submit',
            {
                object: o,
                userData: this.userData,
                state: stateChange
            }
        );

        // validate
        let isInvalid = false;
        let onRuleEvaluation = function(e) {            
            if (e.detail.rule.type == RULE_TYPE_VALIDATION && !e.detail.results) {
                isInvalid = true;
            }
        };
        Events.listen('rule_evaluation', onRuleEvaluation);
        this.evaluate(o);
        Events.remove('rule_evaluation', onRuleEvaluation);
        this.userData.valid = !isInvalid;

        // enforce validation for submission
        if (isInvalid && stateChange == DECISION_STATE_NEXT && !this.submitOnInvalid) {
            Logger.info('Unable to submit, form failed to validate.');
            Events.dispatch(
                'post_submit',
                {
                    object: this.objects[this.currentIndex],
                    userData: this.userData,
                    valid: false
                }
            );
            return;
        }
        // handle state change
        let doStateChange = function() {
            Events.dispatch(
                'post_submit',
                {
                    object: this.objects[this.currentIndex],
                    userData: this.userData,
                    valid: true
                }
            );
            // do change
            switch (stateChange) {
                case DECISION_STATE_NEXT: {
                    return this.loadNext();
                }
                case DECISION_STATE_PREVIOUS: {
                    return this.loadPrevious();
                }
            }
        }
        doStateChange = doStateChange.bind(this);
        // handle user data submit, skip if 'isDisabled' is true
        if (typeof(e.detail.isDisabled) == 'undefined' || !e.detail.isDisabled) {
            this.submitUserData(doStateChange);
            return;
        }
        doStateChange();
    }

    /**
     * Fires when 3rd party script requests a PDF download.
     * @param {Event} e 
     */
    onDoPdf(e) {
        // retrieve current decision object
        if (typeof(this.objects[this.currentIndex]) == 'undefined') {
            Logger.warn('PDF event recieved but no decision object is loaded.');
            return;
        }
        PdfBuilder.build(this.objects[this.currentIndex], null, this.userData);
    }

    /**
     * Fires when 3rd party script request rule evaluation.
     * @param {Event} e 
     */
    onDoEvaluate(e) {
        this.evaluate(this.objects[this.currentIndex]);
    }

    /**
     * Hook form events.
     */
    hook() {
        Events.listen('change', this.onFormChange);
        Events.listen('set_answers', this.onSetAnswers);
        Events.listen('do_load', this.onDoLoad);
        Events.listen('do_user_data', this.onDoUserData);
        Events.listen('do_submit', this.onDoSubmit);
        Events.listen('do_pdf', this.onDoPdf);
        Events.listen('do_evaluate', this.onDoEvaluate);
    }

    /**
     * Unhook event listeners.
     */
    unhook() {
        if (this.fetchRequest) {
            this.fetchRequest.removeEventListener('load', this.onFetchLoad);
            this.fetchRequest.removeEventListener('error', this.onFetchError);
        }
        if (this.fetchUserDataRequest) {
            this.fetchUserDataRequest.removeEventListener('load', this.onUserDataFetchLoad);
            this.fetchUserDataRequest.removeEventListener('error', this.onUserDataFetchError);
        }
        Events.remove('change', this.onFormChange);
        Events.remove('set_answers', this.onSetAnswers);
        Events.remove('do_load', this.onDoLoad);
        Events.remove('do_submit', this.onDoSubmit);
        Events.remove('do_pdf', this.onDoPdf);
    }

    /**
     * Get decision object that has been previously loaded.
     * @param {string} uid 
     * @return {DecisionBase|null}
     */
    getObject(uid) {
        for (let i in this.objects) {
            if (this.objects[i].uid == uid) {
                return this.objects[i];
            }
        }
        return null;
    }

    /**
     * Init shortcodes.
     */
    initShortcode() {
        this.shortcodeManager.reset();
        // add internal shortcodes
        this.shortcodeManager.add(new AnswersShortcode(this));
        this.shortcodeManager.add(new MatrixShortcode(this));
        // hook shortcodes
        this.shortcodeManager.hook();
    }

}