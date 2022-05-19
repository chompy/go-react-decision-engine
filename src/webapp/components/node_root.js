import React from 'react';
import md5 from 'blueimp-md5';
import Renderer from '../renderer.js';
import Events from '../events';
import {DECISION_TYPE_FORM, DECISION_TYPE_DOCUMENT} from '../objects/root.js';
//import {DECISION_STATE_NO_CHANGE, DECISION_STATE_NEXT, DECISION_STATE_PREVIOUS} from '../decision_manager.js';
import BaseNodeComponent from './node_base';
import GroupNode from '../objects/group.js';
import SectionNavigationComponent from './section_navigation.js';

export default class RootNodeComponent extends BaseNodeComponent {

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
            node: this.node
        })
    }

    /**
     * {@inheritdoc}
     */
    getTypeName() {
        return 'root';
    }

    /**
     * @inheritdoc
     */
    getClass() {
        let out = super.getClass() + ' ' + this.node.type;
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
                node: this.node,
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
        //this.submit(DECISION_STATE_NO_CHANGE);
        this.checkValidation = true;
    }

    /**
     * Fires when form was successfully submitted.
     * @param {Event} e 
     */
    onPostSubmit(e) {
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
                node: this.node,
                section: nextSection.uid
            });
            return;
        }
        // if no more sections then submit form
        //this.submit(DECISION_STATE_NEXT);
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
                node: this.node,
                section: previousSection.uid
            });
            return;
        }
        // if no previous section then return to previous form/document (if available)
        //this.submit(DECISION_STATE_PREVIOUS);
    }

    /**
     * Fires when download PDF is button is pressed.
     * @param {Event} e 
     */
    onPdf(e) {
        e.preventDefault()
        //let c = new PdfConverter;
        //c.userData = this.userData;
        //c.export(this.node);
        alert('TODO: PDF');
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
        if (this.node.type != DECISION_TYPE_FORM) {
            return null;
        }
        if (!this.state.section) {
            for (let i in this.node.children) {
                let node = this.node.children[i];
                if (node instanceof DecisionGroup) {
                    return node;
                }
            }
        }
        return this.node.getChild(this.state.section);
    }

    /**
     * Get decision group for next section.
     * @return {DecisionGroup|null}
     */
    getNextSection() {
        if (this.node.type != DECISION_TYPE_FORM) {
            return null;
        }
        let currentSection = this.getCurrentSection();
        let hasCurrent = false;
        for (let i in this.node) {
            let node = this.node.children[i];
            if (node.uid == currentSection.uid) {
                hasCurrent = true;
                continue;
            } else if (hasCurrent && node instanceof DecisionGroup && !this.userData.isHidden(node, this.node)) {
                return node;
            }
        }
        return null;
    }

    /**
     * Get decision group for previous section.
     * @return {GroupNode|null}
     */
    getPreviousSection() {
        if (this.node.type != DECISION_TYPE_FORM) {
            return null;
        }
        let currentSection = this.getCurrentSection();
        if (!currentSection) {
            return null;
        }
        let lastSection = null;
        for (let i in this. ode.children) {
            let node = this.node.children[i];
            if (node.uid == currentSection.uid) {
                return lastSection;
            } else if (node instanceof DecisionGroup && !this.userData.isHidden(node, this.node)) {
                lastSection = node;
            }
        }
        return lastSection;
    }

    renderOptions() {
        let out = [];
        let backBtnClass = `btn-back${(this.node.previous || this.getPreviousSection()) ? '' : ' hidden'}`
        out.push(
            <input key={this.node.uid + '-opt-back'} type='button' value='Back' disabled={this.state.disabled} className={backBtnClass} onClick={this.onBack} />
        );
        let nextBtnClass = `btn-next${(this.node.next || this.getNextSection()) ? '' : ' hidden'}${(this.node.next && !this.getNextSection()) ? ' btn-submit' : ''}`;
        out.push(
            <input key={this.node.uid + '-opt-next'} type='button' disabled={this.state.disabled} value='Next' className={nextBtnClass} onClick={this.onNext} />
        );
        switch (this.node.type.toLowerCase()) {
            case DECISION_TYPE_DOCUMENT: {
                out.push(
                    <input key={this.node.uid + '-opt-pdf'} type='button' value='Download PDF' disabled={this.state.disabled} className='btn-pdf' onClick={this.onPdf} />
                );
                break;
            }
            case DECISION_TYPE_FORM: {
                out.push(
                    <input key={this.node.uid + '-opt-submit'} type='submit' disabled={this.state.disabled} value='Save' />
                );
                break;
            }
        }
        let addOpt = function(label, callback) {
            out.push(
                <input key={this.node.uid + '-opt-custom-' + md5(label)} type='button' value={label} disabled={this.state.disabled} className='btn-custom' onClick={callback} />
            );
        };
        addOpt = addOpt.bind(this);
        Events.dispatch('render_options', {
            node: this.node,
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
            embeds: typeof this.node.embeds != 'undefined' ? this.node.embeds : null
        }
        for (let i in this.node.children) {
            let obj = this.node.children[i];
            if (!this.state.section || this.state.section == obj.uid) {
                renderSection = Renderer.render(obj, renderParams);
                break;
            }
        }
        switch (this.node.type.toLowerCase()) {
            case DECISION_TYPE_DOCUMENT: {
                return <div className={this.getClass()} id={this.getId()}>
                    <div className='head'>
                        <SectionNavigationComponent root={this.node} userData={this.userData} callback={this.onSection} />
                    </div>
                    {renderSection}
                    <div className='options'>{this.renderOptions()}</div>
                </div>;
            }
            default: {
                let msgClass = 'message' + (this.state.message ? '' : ' hidden');
                return <div className={this.getClass()} id={this.getId()}>
                    <div className='head'>
                        <SectionNavigationComponent root={this.node} userData={this.userData} callback={this.onSection} />
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