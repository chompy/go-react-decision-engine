import React from 'react';
import { BTN_BACK, BTN_NEXT, BTN_SAVE, MSG_ISSUES_FOUND, MSG_ISSUE_FOUND, TREE_DOCUMENT, TREE_DOCUMENT_PDF_FORM, TREE_FORM } from '../../config';
import { faBackward, faFloppyDisk, faForward, faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import GroupNode from '../../nodes/group';
import RootNode from '../../nodes/root';
import BaseNodeComponent from './base';
import GroupNodeComponent from './group';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { RULE_TYPE_VALIDATION } from '../../nodes/rule';
import PdfViewerComponent from '../pdf_viewer';

export default class RootNodeComponent extends BaseNodeComponent {

    constructor(props) {
        super(props);
        this.saveCallback = props?.onSave;
        this.state.section = null;
        this.state.validationErrorCount = 0;
        this.state.hasRuleEval = false;
        this.state.hasChange = false;
        this.onSection = this.onSection.bind(this);
        this.onSave = this.onSave.bind(this);
    }

    /**
     * {@inheritDoc}
     */
    componentDidMount() {
        super.componentDidMount();
        this.rules = this.compileRules();
        this.evaluateRules();
    }

    /**
     * Get node type name.
     * @return {String}
     */
    static getTypeName() {
        return 'root';
    }
    
    /**
     * {@inheritdoc}
     */
    availableChildTypes() {
        return [
            GroupNodeComponent
        ];
    }

    /**
     * {@inheritdoc}
     */
    onUpdateCallback(node, matrix) {
        this.setState({hasChange: true});
        this.evaluateRules();
        super.onUpdateCallback(node, matrix);
    }

    /**
     * {@inheritdoc}
     */
    onPreRuleEvaluation(e) {
        super.onPreRuleEvaluation(e);
        // reset the validation error counter before rule evaluation
        this.setState({validationErrorCount: 0});
    }

    /**
     * {@inheritdoc}
     */
    onRuleEvaluation(e) {
        super.onRuleEvaluation(e);
        this.setState({hasRuleEval: true});
        // check for all invalid fields that have input and increment the
        // validation error counter
        let results = e.detail;
        if (
            results.rule.type == RULE_TYPE_VALIDATION &&
            !results.results &&
            this.userData.hasInput(results.parent, results.matrixId)
        ) {
            this.setState(function(state, props) {
                let newValue = state.validationErrorCount + 1;
                return { validationErrorCount: newValue };
            });
        }
    }

    /**
     * @param {Event} e 
     */
    onSection(e) {
        e.preventDefault();
        let value = e.target.getAttribute('data-section'); 
        let child = this.node.getChild(value);
        if (!child || this.userData.isHidden(child, this.node, this.matrix)) {
            this.setState({section: null});    
            return;
        }
        let stateUpdateCallback = function() {
            this.evaluateRules();
        };
        stateUpdateCallback = stateUpdateCallback.bind(this);
        this.setState({section: value}, stateUpdateCallback);
    }

    /**
     * Fires when save button is clicked. (Re)enable form validation and
     * fire save callback.
     * @param {Event} e 
     */
    onSave(e) {
        e.preventDefault();
        this.setState({hasChange: false});
        // flag all questions as have user input
        this.userData.setUserInputAll();
        this.evaluateRules();
        if (this.saveCallback) { this.saveCallback(this.node, this.userData); }
    }

    /**
     * @return {GroupNode|null}
     */
    getCurrentSection() {
        if (this.node.type != TREE_FORM) { return null; }
        if (!this.state.section) {
            for (let i in this.node.children) {
                let node = this.node.children[i];
                if (node instanceof GroupNode && !this.userData.isHidden(node, this.node)) {
                    return node;
                }
            }
        }
        return this.node.getChild(this.state.section);
    }

    getSections() {
        if (this.node.type != TREE_FORM) { return null; }
        let out = [];
        for (let i in this.node.children) {
            let child = this.node.children[i];
            if (!(child instanceof GroupNode) || this.userData.isHidden(child, this.node)) {
                continue;
            }
            out.push(child);
        }
        return out;
    }

    getCurrentSection() {
        let sections = this.getSections();
        if (sections && sections.length > 0 && !this.state.section) {
            return sections[0];
        }
        for (let i in sections) {
            if (sections[i].uid == this.state.section) { return sections[i]; }
        }
        return null;
    }

    renderSectionNavigation() {
        let sections = this.getSections();
        if (!sections || sections.length < 2) { return null; }
        let out = [];
        for (let i in sections) {
            let section = sections[i];
            out.push(
                <div
                    key={this.node.uid + '-section-' + section.uid}
                    className={'section-nav-item' + (section.uid == this.getCurrentSection()?.uid ? ' active' : '')}
                    data-section={section.uid} onClick={this.onSection}
                >
                    <a href='#' data-section={section.uid} onClick={this.onSection}>{section.label}</a>
                </div>
            )
        }
        return out;
    }

    renderSectionChildren() {
        let currentSection = this.getCurrentSection();
        if (!currentSection) { return this.renderChildren(); }
        let childTypes = this.availableChildTypes();
        for (let i in childTypes) {
            let Component = childTypes[i];
            if (Component.getTypeName() == currentSection.constructor.getTypeName()) {
                return <Component
                    key={this.userData.uid + '_' + currentSection.uid} 
                    node={currentSection}
                    root={this.node}
                    onUpdate={this.onUpdateCallback}
                    userData={this.userData}
                    readOnly={this.readOnly}
                    matrix={this.matrix}
                    level={this.level+1}
                />;
            }
        }
    }

    /**
     * {@inheritdoc}
     */
    render() {
        if (!(this.node instanceof RootNode) || !this.state.hasRuleEval) { return null; }
        switch (this.node.type) {
            case TREE_DOCUMENT: {
                return <div className={'tree-node tree-' + this.constructor.getTypeName() + ' tree-' + this.node.type}>
                    <div className='tree-children'>{this.renderChildren()}</div>
                </div>;
            }
            case TREE_DOCUMENT_PDF_FORM: {
                return <div className={'tree-node tree-' + this.constructor.getTypeName() + ' tree-' + this.node.type}>
                    <div className='tree-children'>
                        <PdfViewerComponent
                            document={this.node}
                            form={this.props?.parentForm}
                            userData={this.userData}
                            callback={this.props?.pdfViewerCallback}
                        />
                    </div>
                </div>;
            }
        }
        let options = [];
        if (this.saveCallback) {
            options.push(
                <button
                    key='tree-btn-save'
                    className='pure-button'
                    onClick={this.onSave}
                    disabled={!this.state.hasChange}
                >
                    {BTN_SAVE} <FontAwesomeIcon icon={faFloppyDisk} />
                </button>                
            );       
        }
        let sections = this.getSections();
        let currentSection = this.getCurrentSection();
        for (let i in sections) {
            let thisSection = sections[i];
            if (thisSection.uid == currentSection.uid) {
                if (i > 0) {
                    options.push(
                        <button
                            key='tree-btn-back'
                            className='pure-button'
                            onClick={this.onSection}
                            data-section={sections[parseInt(i)-1].uid}
                        >
                            <FontAwesomeIcon icon={faBackward} /> {BTN_BACK} 
                        </button>
                    );
                }
                if (i < sections.length-1) {
                    options.push(
                        <button
                            key='tree-btn-next'
                            className='pure-button'
                            onClick={this.onSection}
                            data-section={sections[parseInt(i)+1].uid}
                        >
                            {BTN_NEXT} <FontAwesomeIcon icon={faForward} />
                        </button>
                    );
                }
                break;
            }
        }
        let validationMsg = null;
        if (this.state.validationErrorCount) {
            validationMsg = <span className='validation-count'>
                <FontAwesomeIcon icon={faCircleXmark} />&nbsp;
                {this.state.validationErrorCount}
                &nbsp;{this.state.validationErrorCount == 1 ? MSG_ISSUE_FOUND : MSG_ISSUES_FOUND}
            </span>;
        }
        return <div className={'tree-node tree-' + this.constructor.getTypeName() + ' tree-' + this.node.type}>
            <div className='tree-content'>
                <div className='section-navigation'>{this.renderSectionNavigation()}</div>
            </div>
            <div className='tree-children pure-form pure-form-stacked'>{this.renderSectionChildren()}</div>
            <div className='options'>
                <div className='left'>{validationMsg}</div>
                <div className='right'>{options}</div>
            </div>
        </div>;
    }

}