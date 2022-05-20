import React from 'react';
import DecisionBaseComponent from './decision_base.js';
import DecisionRenderer from '../decision_renderer.js';
import DecisionGroup from '../decision_objects/group.js';
import PdfBuilder from '../pdf_builder.js';
import {DECISION_TYPE_FORM, DECISION_TYPE_DOCUMENT} from '../decision_objects/root.js';
import {DECISION_STATE_NO_CHANGE, DECISION_STATE_NEXT, DECISION_STATE_PREVIOUS} from '../decision_manager.js';
import Events from '../events';
import SectionNavigationComponent from './section_navigation.js';
import md5 from 'blueimp-md5';

export default class DecisionRootComponent extends DecisionBaseComponent {

    constructor(props) {
        super(props);
        this.state.message = '';
        this.state.disabled = this.readOnly;
        this.state.section = null;
        this.checkValidation = false;
        this.onSubmit = this.onSubmit.bind(this);
        this.onPostSubmit = this.onPostSubmit.bind(this);
        this.onNext = this.onNext.bind(this);
        this.onBack = this.onBack.bind(this);
        this.onPdf = this.onPdf.bind(this);
        this.onSection = this.onSection.bind(this);
        this.onDoRefresh = this.onDoRefresh.bind(this);
        this.onError = this.onError.bind(this);
    }

    /**
     * {@inheritdoc}
     */
    componentDidMount() {
        super.componentDidMount();
        Events.listen('post_submit', this.onPostSubmit);
        Events.listen('do_refresh', this.onDoRefresh);
        Events.listen('error', this.onError);
    }

    /**
     * {@inheritdoc}
     */
    componentWillUnmount() {
        super.componentWillUnmount();
        Events.remove('post_submit', this.onPostSubmit);
        Events.remove('do_refresh', this.onDoRefresh);
        Events.remove('error', this.onError);
    }

    /**
     * {@inheritdoc}
     */
    componentDidUpdate() {
        Events.dispatch('root_component_update', {
            object: this.object
        })
    }

    /**
     * {@inheritdoc}
     */
    getTypeName() {
        return 'decision_root';
    }

    /**
     * @inheritdoc
     */
    getClass() {
        let out = super.getClass() + ' ' + this.object.type;
        if (this.userData && this.userData.saveCount > 0) {
            out += ' saved';
        }
        if (this.state.disabled) {
            out += ' disabled';
        }
        return out;
    }

    /**
     * Submit form.
     * @param {Number} state 
     */
    submit(state) {
        this.setState({
            message: '',
            disabled: true
        });
        Events.dispatch(
            'do_submit',
            {
                object: this.object,
                state: state,
                isDisabled: this.state.disabled
            }
        )
    }

    /**
     * Do a full refresh(render).
     */
    onDoRefresh() {
        this.setState({});
    }

    /**
     * Fires on form submit.
     * @param {Event} e 
     */
    onSubmit(e) {
        e.preventDefault();
        this.submit(DECISION_STATE_NO_CHANGE);
        this.checkValidation = true;
    }

    /**
     * Fires when form was successfully submitted.
     * @param {Event} e 
     */
    onPostSubmit(e) {
        if (
            typeof(e.detail.object.instanceId) == 'undefined' || 
            e.detail.object.instanceId != this.object.instanceId
        ) { 
            return;
        }
        this.checkValidation = true;
        if (!e.detail.valid) {
            window.scrollTo(0,99999);
            this.setState({
                message: 'One or more fields are invalid.',
                disabled: false
            });
            return;
        }
        this.setState({message: '', disabled: false});
    }

    /**
     * Fires when 'next' button is pressed.
     * @param {Event} e 
     */
    onNext(e) {
        e.preventDefault();
        window.scrollTo(0,0);
        let nextSection = this.getNextSection();
        if (nextSection) {
            this.setState({section: nextSection.uid});
            Events.dispatch('section', {
                object: this.object,
                section: nextSection.uid
            });
            return;
        }
        // if no more sections then submit form
        this.submit(DECISION_STATE_NEXT);
    }

    /**
     * Fires when 'previous' / 'back' button is pressed.
     * @param {Event} e 
     */
    onBack(e) {
        e.preventDefault();
        window.scrollTo(0,0);
        let previousSection = this.getPreviousSection();
        if (previousSection) {
            this.setState({section: previousSection.uid});
            Events.dispatch('section', {
                object: this.object,
                section: previousSection.uid
            });
            return;
        }
        // if no previous section then return to previous form/document (if available)
        this.submit(DECISION_STATE_PREVIOUS);
    }

    /**
     * Fires when download PDF is button is pressed.
     * @param {Event} e 
     */
    onPdf(e) {
        e.preventDefault()
        PdfBuilder.build(this.object, null, this.userData);
    }

    /**
     * @param {Event} e 
     */
    onError(e) {
        this.setState({
            message: e.detail.message
        });
    }

    /**
     * Callback for section navigation component.
     * @param {string} uid
     */
    onSection(uid) {
        this.setState({ section: uid });
    }

    /**
     * @return 
     */
    getCurrentSection() {
        if (this.object.type != DECISION_TYPE_FORM) {
            return null;
        }
        if (!this.state.section) {
            for (let i in this.object.children) {
                let obj = this.object.children[i];
                if (obj instanceof DecisionGroup) {
                    return obj;
                }
            }
        }
        return this.object.getChild(this.state.section);
    }

    /**
     * Get decision group for next section.
     * @return {DecisionGroup|null}
     */
    getNextSection() {
        if (this.object.type != DECISION_TYPE_FORM) {
            return null;
        }
        let currentSection = this.getCurrentSection();
        let hasCurrent = false;
        for (let i in this.object.children) {
            let obj = this.object.children[i];
            if (obj.uid == currentSection.uid) {
                hasCurrent = true;
                continue;
            } else if (hasCurrent && obj instanceof DecisionGroup && !this.userData.isHidden(obj, this.object)) {
                return obj;
            }
        }
        return null;
    }

    /**
     * Get decision group for previous section.
     * @return {DecisionGroup|null}
     */
    getPreviousSection() {
        if (this.object.type != DECISION_TYPE_FORM) {
            return null;
        }
        let currentSection = this.getCurrentSection();
        if (!currentSection) {
            return null;
        }
        let lastSection = null;
        for (let i in this.object.children) {
            let obj = this.object.children[i];
            if (obj.uid == currentSection.uid) {
                return lastSection;
            } else if (obj instanceof DecisionGroup && !this.userData.isHidden(obj, this.object)) {
                lastSection = obj;
            }
        }
        return lastSection;
    }

    renderOptions() {
        let out = [];
        let backBtnClass = `btn-back${(this.object.previous || this.getPreviousSection()) ? '' : ' hidden'}`
        out.push(
            <input key={this.object.uid + '-opt-back'} type='button' value='Back' disabled={this.state.disabled} className={backBtnClass} onClick={this.onBack} />
        );
        let nextBtnClass = `btn-next${(this.object.next || this.getNextSection()) ? '' : ' hidden'}${(this.object.next && !this.getNextSection()) ? ' btn-submit' : ''}`;
        out.push(
            <input key={this.object.uid + '-opt-next'} type='button' disabled={this.state.disabled} value='Next' className={nextBtnClass} onClick={this.onNext} />
        );
        switch (this.object.type.toLowerCase()) {
            case DECISION_TYPE_DOCUMENT: {
                out.push(
                    <input key={this.object.uid + '-opt-pdf'} type='button' value='Download PDF' disabled={this.state.disabled} className='btn-pdf' onClick={this.onPdf} />
                );
                break;
            }
            case DECISION_TYPE_FORM: {
                out.push(
                    <input key={this.object.uid + '-opt-submit'} type='submit' disabled={this.state.disabled} value='Save' />
                );
                break;
            }
        }
        let addOpt = function(label, callback) {
            out.push(
                <input key={this.object.uid + '-opt-custom-' + md5(label)} type='button' value={label} disabled={this.state.disabled} className='btn-custom' onClick={callback} />
            );
        };
        addOpt = addOpt.bind(this);
        Events.dispatch('render_options', {
            object: this.object,
            add: addOpt
        });
        return out;
    }

    /**
     * {@inheritdoc}
     */
    render() {
        // render current section only
        let renderSection = null;
        let renderParams = {
            userData: this.userData,
            checkValidation: this.checkValidation,
            readOnly: this.readOnly,
            embeds: typeof this.object.embeds != 'undefined' ? this.object.embeds : null
        }
        for (let i in this.object.children) {
            let obj = this.object.children[i];
            if (!this.state.section || this.state.section == obj.uid) {
                renderSection = DecisionRenderer.render(obj, renderParams);
                break;
            }
        }
        switch (this.object.type.toLowerCase()) {
            case DECISION_TYPE_DOCUMENT: {
                return <div className={this.getClass()} id={this.getId()}>
                    <div className='head'>
                        <SectionNavigationComponent root={this.object} userData={this.userData} callback={this.onSection} />
                    </div>
                    {renderSection}
                    <div className='options'>{this.renderOptions()}</div>
                </div>;
            }
            default: {
                let msgClass = 'message' + (this.state.message ? '' : ' hidden');
                return <div className={this.getClass()} id={this.getId()}>
                    <div className='head'>
                        <SectionNavigationComponent root={this.object} userData={this.userData} callback={this.onSection} />
                    </div>
                    <form action='' method='POST' encType='multipart/form-data' onSubmit={this.onSubmit}>
                        {renderSection}
                        <div className={msgClass}>{this.state.message}</div>
                        <div className='options'>{this.renderOptions()}</div>
                    </form>
                </div>;                
            }
        }
    }

}