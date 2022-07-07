import React from 'react';
import { TREE_FORM } from '../../config';
import GroupNode from '../../nodes/group';
import RootNode from '../../nodes/root';
import BaseNodeComponent from './base';
import GroupNodeComponent from './group';
import RuleEngine from '../../rule_engine';
import Events from '../../events';
import RuleNode, { RULE_TYPE_VISIBILITY } from '../../nodes/rule';

export default class RootNodeComponent extends BaseNodeComponent {

    constructor(props) {
        super(props);
        this.state.section = null;
        this.onSection = this.onSection.bind(this);
    }

    /**
     * {@inheritDoc}
     */
    componentDidMount() {
        let hasCompiledRules = this.rules.length > 0;
        super.componentDidMount();
        // compile rules for sections
        if (!hasCompiledRules) {
            for (let i in this.node.children) {
                let child = this.node.children[i];
                if (child instanceof GroupNode) {
                    for (let j in child.children) {
                        let rule = child.children[j];
                        if (rule instanceof RuleNode) {
                            let ruleEngine = new RuleEngine;
                            ruleEngine.matrixId = this.matrix;
                            ruleEngine.setRootNode(this.node);
                            ruleEngine.setUserData(this.userData);
                            ruleEngine.setRuleNode(rule);
                            this.rules.push(ruleEngine);
                        }
                    }
                }
            }
            if (this.rules.length > 0) {
                this.evaluateRules();
            }
        }
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
    evaluateRules() {
        for (let i in this.node.children) {
            let child = this.node.children[i];
            if (
                child instanceof GroupNode &&
                child.hasRuleOfType(RULE_TYPE_VISIBILITY)
            ) {
                this.userData.setHidden(child, true, this.matrix);
                console.log("TEST");
            }
        }
        super.evaluateRules();
    }

    /**
     * {@inheritdoc}
     */
    onUpdateCallback(node, matrix) {
        super.onUpdateCallback(node, matrix);
        Events.dispatch('tree-root-update', {
            node: node,
            matrix: matrix
        });
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
        this.setState({section: value});
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
                    callback={this.onUpdateCallback}
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
        if (!(this.node instanceof RootNode)) { return null; }
        return <div className={'tree-node tree-' + this.constructor.getTypeName()}>
            <div className='tree-content'>
                <div className='section-navigation'>{this.renderSectionNavigation()}</div>
            </div>
            <div className='tree-children pure-form pure-form-stacked'>{this.renderSectionChildren()}</div>
        </div>;
    }

}