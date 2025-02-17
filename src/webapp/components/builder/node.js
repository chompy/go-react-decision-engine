import React from 'react';
import Events from '../../events';
import AnswerNode from '../../nodes/answer';
import BaseNode from '../../nodes/base';
import GroupNode from '../../nodes/group';
import MatrixNode from '../../nodes/matrix';
import QuestionNode, { FIELD_CHOICE, FIELD_DROPDOWN, FIELD_TEXT, FIELD_UPLOAD } from '../../nodes/question';
import RootNode from '../../nodes/root';
import RuleNode, { RULE_TYPE_VALIDATION, RULE_TYPE_VISIBILITY } from '../../nodes/rule';
import BuilderFormComponent from './form';
import BuilderNodeTitleComponent from './node_title';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlass, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons'
import { BTN_DELETE, MSG_CLIPBOARD, MSG_TREE_NODE_DELETE, MSG_TREE_ROOT_DELETE, TREE_DOCUMENT, TREE_DOCUMENT_PDF_FORM } from '../../config';
import PdfFieldNode from '../../nodes/pdf_field';
import PdfFieldValueNode from '../../nodes/pdf_field_value';
import PdfFieldMapNode from '../../nodes/pdf_field_map';

const DROP_STATE_NONE = 0;
const DROP_STATE_UP = 1;
const DROP_STATE_DOWN = 2;
const DROP_STATE_CHILD = 3;
const DEFAULT_SHOW_COUNT = 10;

const NAME_GROUP = 'Content/Group';
const NAME_VISIBILITY_RULE = 'Visibility Rule';
const NAME_VALIDATION_RULE = 'Validation Rule';
const NAME_ANSWER = 'Answer';
const NAME_MATRIX = 'Matrix';
const NAME_TEXT = 'Text Input';
const NAME_CHOICE = 'Multiple Choice';
const NAME_DROPDOWN = 'Dropdown';
const NAME_FILE_UPLOAD = 'File Upload';
const NAME_PDF_FIELD_VALUE = 'PDF Field Value';
const NAME_PDF_FIELD_MAP = 'PDF Field Map';

export default class BuilderNodeComponent extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            dropState: DROP_STATE_NONE,
            showAll: false,
            active: false
        }
        this.root = props?.root;
        this.parent = props?.parent;
        this.node = props?.node;
        this.formNode = props?.formNode ? props.formNode : this.root;
        this.currentDragNode = null;
        this.onAddButton = this.onAddButton.bind(this);
        this.onBulkAddButton = this.onBulkAddButton.bind(this);
        this.onDelButton = this.onDelButton.bind(this);
        this.onUidButton = this.onUidButton.bind(this);
        this.onDelete = this.onDelete.bind(this);
        this.onUpdate = this.onUpdate.bind(this);
        this.onDoRerender = this.onDoRerender.bind(this);
        this.onDragOver = this.onDragOver.bind(this);
        this.onDragLeave = this.onDragLeave.bind(this);
        this.onDrop = this.onDrop.bind(this);
        this.onDragStart = this.onDragStart.bind(this);
        this.onShowMore = this.onShowMore.bind(this);
        this.onActive = this.onActive.bind(this);
    }

    /**
     * {@inheritdoc}
     */
     componentDidMount() {
        Events.listen('builder_delete', this.onDelete);
        Events.listen('update', this.onUpdate);
        Events.listen('rerender', this.onDoRerender);
        Events.listen('drag', this.onDragStart);
        Events.listen('builder-active-node', this.onActive);
    }

    /**
     * {@inheritdoc}
     */
    componentWillUnmount() {
        Events.remove('builder_delete', this.onDelete);
        Events.remove('update', this.onUpdate);
        Events.remove('rerender', this.onDoRerender);
        Events.remove('drag', this.onDragStart);
        Events.remove('builder-active-node', this.onActive);
    }

    /**
     * Get display name for node.
     * @returns 
     */
    getName() {
        if (!this.node) {
            return '(Unnamed)';
        }
        return this.node.getName();
    }
    
    /**
     * @return {string}
     */
    getClassName() {
        if (!this.node) {
            return 'node empty';
        }
        let typeName = this.node.constructor.getTypeName()
        typeName = typeName.replace('decision_', '');
        if (this.node instanceof QuestionNode || this.node instanceof RuleNode) {
            typeName += ' ' + this.node.type;
        }
        let dropState = '';
        switch (this.state.dropState) {
            case DROP_STATE_DOWN: {
                dropState = ' ds-down';
                break;
            }
            case DROP_STATE_UP: {
                dropState = ' ds-up';
                break;
            }
            case DROP_STATE_CHILD: {
                dropState = ' ds-child';
            }
        }
        return 'node ' + typeName + dropState + (this.state.active ? ' active' : '');
    }

    /**
     * Event that fires when add button is pressed.
     * @param {Event} e 
     */
    onAddButton(e) {
        e.preventDefault();
        if (!this.node) {
            return;
        }
        let typeName = e.target.getAttribute('data-type');
        if (!typeName) {
            return;
        }
        let type = this.availableTypes()[typeName];
        if (!type) {
            return;
        }
        let child = new type[0];
        child.uid = BaseNode.generateUid();
        child.parent = this.node.uid;
        switch (child.constructor) {
            case GroupNode: {
                child.label = 'Group ' + child.uid;
                break;
            }
            case MatrixNode: {
                child.label = 'Matrix ' + child.uid;
                break;
            }
            case QuestionNode: {
                child.label = 'Question ' + child.uid;
                child.type = type[1];
                break;
            }
            case AnswerNode: {
                child.label = 'Answer ' + child.uid;
                break;
            }
            case RuleNode: {
                child.label = 'Rule ' + child.uid;
                child.type = type[1];
                break;
            }
            case PdfFieldValueNode: {
                child.setField(this.node.field);
                break;
            }
            case PdfFieldMapNode: {
                child.formNode = this.formNode;
                break;
            }
        }
        this.node.children.push(child);
        Events.dispatch('update', this.root);
        this.forceUpdate();
    }

    /**
     * @param {Event} e 
     */
    onBulkAddButton(e) {
        e.preventDefault();
        if (!this.node) {
            return;
        }
        let answers = prompt('Enter answers delimited by a comma.').split(',');
        for (let i in answers) {
            let answer = answers[i].trim();
            if (!answer) {
                continue;
            }
            let node = new AnswerNode(AnswerNode.generateUid());
            node.parent = this.node.uid;
            node.label = answer;
            node.value = answer;
            this.node.children.push(node);
        }
        Events.dispatch('update', this.root);
        this.forceUpdate();
    }

    /**
     * Event that fires when delete button pressed.
     * @param {Event} e 
     */
    onDelButton(e) {
        e.preventDefault();
        if (!this.node) {
            return;
        }
        if (this.node instanceof RootNode) {
            if (!this.props?.onRootDelete) { return; }
            if (confirm(MSG_TREE_ROOT_DELETE)) {
                this.props?.onRootDelete(this.node);
            }
            return;
        }
        if (confirm(MSG_TREE_NODE_DELETE)) {
            Events.dispatch(
                'builder_delete',
                this.node.uid
            );
        }
    }

    /**
     * Event that fires when uid button is pressed.
     * @param {Event} e 
     */
    onUidButton(e) {
        e.preventDefault();
        if (!this.node) {
            return;
        }
        prompt(MSG_CLIPBOARD, this.node.uid);
    }

    /**
     * @param {Event} e 
     */
    onDelete(e) {
        if (!this.node || !e.detail) {
            return;
        }
        for (let i in this.node.children) {
            if (this.node.children[i] == e.detail && this.node.children[i].builderCanDelete()) {
                this.node.children.splice(i, 1);
                Events.dispatch('update', this.root);
                this.forceUpdate();
                break;
            }
        }
    }

    /**
     * @param {Event} e 
     */
    onUpdate(e) {
        if (!this.node || !e.detail) {
            return;
        }
        if (this.root.uid == this.node.uid) {
            Events.dispatch('root_update', {
                node: this.node,
                data: this.node.exportJSON()
            });
        }
    }

    /**
     * @param {Event} e 
     */
    onDoRerender(e) {
        if (!this.node || !e.detail) {
            return;
        }
        if (e.detail.uid == this.node.uid) {
            this.forceUpdate();
        }
    }

    /**
     * @param {Event} e 
     */
    onActive(e) {
        let active = e.detail.node.uid == this.node.uid;
        this.setState({active: active});
    }

    /**
     * Check if given decision node can be dropped under this node.
     * @param {DecisionBase} node 
     * @param {bool} asChild
     * @returns {bool}
     */
    canDrop(node, asChild) {
        if (!node || !this.node || !this.parent || node.getChild(this.node.uid)) {
            return false;
        }
        let pn = new BuilderNodeComponent({node: asChild ? this.node : this.parent});
        let availableTypes = pn.availableTypes();
        let isCorrectType = false;
        for (let i in availableTypes) {
            if (node instanceof availableTypes[i][0]) {
                switch (availableTypes[i][0]) {
                    case QuestionNode:
                    case RuleNode: {
                        if (node.type == availableTypes[i][1]) {
                            isCorrectType = true;
                        }
                        break;
                    }
                    default: {
                        isCorrectType = true;
                        break;
                    }
                }
            }
        }
        if (!isCorrectType) {
            return false;
        }
        return true;
    }

    /**
     * @param {Event} e 
     */
    onDragOver(e) {
        e.stopPropagation();
        e.preventDefault();
        let target = e.target;
        let rect = target.getBoundingClientRect();
        while (target.nodeName != 'LI' || target.id != 'node-' + this.node.uid) {
            target = target.parentNode;
            if (target.id != 'node-' + this.node.uid) {
                this.setState({
                    dropState: DROP_STATE_NONE
                });
                return;
            }
        }
        let asChild = this.node.children.length == 0 && e.clientX - rect.left > 80;
        if (!this.canDrop(this.currentDragNode, asChild)) {
            return;
        }
        if (asChild) {
            this.setState({
                dropState: DROP_STATE_CHILD
            });
            return;
        } else if (e.clientY - rect.top < 50) {
            this.setState({
                dropState: DROP_STATE_UP
            });
            return;
        }
        this.setState({
            dropState: DROP_STATE_DOWN
        });
    }

    /**
     * @param {Event} e 
     */
    onDragLeave(e) {
        e.stopPropagation();
        e.preventDefault();
        let target = e.target;
        while (target.nodeName != 'LI' || target.id != 'node-' + this.node.uid) {
            target = target.parentNode;
        }
        this.setState({
            dropState: DROP_STATE_NONE
        });
    }

    /**
     * @param {Event} e 
     */
    onDragStart(e) {
        this.currentDragNode = e.detail.node;
    }

    /**
     * @param {Event} e 
     */
    onDrop(e) {
        e.stopPropagation();
        e.preventDefault();
        this.setState({
            dropState: DROP_STATE_NONE
        });
        // find target element
        let target = e.target;
        let rect = target.getBoundingClientRect();
        while (target.nodeName != 'LI' || target.id != 'node-' + this.node.uid) {
            target = target.parentNode;
        }
        // if mouse over element is offset by more then 80 pixels assume user
        // wants to add element as child instead of above/below
        let asChild = this.node.children.length == 0 && e.clientX - rect.left > 80;
        // check to ensure this node can be placed here
        if (!this.canDrop(this.currentDragNode, asChild)) {
            return;
        }
        // remove node to be moved from it's current parent
        let currentParent = this.currentDragNode.getParent(this.root);
        for (let i in currentParent.children) {
            if (currentParent.children[i].uid == this.currentDragNode.uid) {
                currentParent.children.splice(i, 1);
                break;
            }
        }
        // insert as child
        if (asChild) {
            this.node.children = [this.currentDragNode];
            this.currentDragNode.parent = this.node.uid;
            this.currentDragNode = null;
            this.onUpdate({detail: true});
            Events.dispatch('update', this.root);
            Events.dispatch('rerender', this.root);
            return;
        }
        // check dropping above or below
        let direction = 1;
        if (e.clientY - rect.top < 50) {
            direction = 0;
        }
        // insert
        for (let i in this.parent.children) {
            if (this.parent.children[i].uid == this.node.uid) {
                let insertIndex = parseInt(i)+direction;
                if (insertIndex < 0) {
                    insertIndex = 0;
                }
                this.parent.children.splice(insertIndex, 0, this.currentDragNode);
                this.currentDragNode.parent = this.parent.uid;
                break;
            }
        }
        this.currentDragNode = null;
        this.onUpdate({detail: true});
        Events.dispatch('update', this.root);
        Events.dispatch('rerender', this.root);
    }

    /**
     * @param {Event} e 
     */
    onShowMore(e) {
        e.preventDefault();
        this.setState(function(state, props) {
            return {
                showAll: !state.showAll
            };
        });
    }

    /**
     * List available child decision node types.
     * @returns {Array}
     */
    availableTypes() {
        switch (this.node.constructor) {
            case RootNode: {
                if (this.root && this.root.type == TREE_DOCUMENT_PDF_FORM) {
                    return {};
                }
                // should we enforce there having to be a group under the root?
                return {
                    [NAME_GROUP]: [GroupNode]
                };
            }
            case QuestionNode: {
                switch (this.node.type) {
                    case FIELD_TEXT:
                    case FIELD_UPLOAD: {
                        return {
                            [NAME_VISIBILITY_RULE]: [RuleNode, RULE_TYPE_VISIBILITY],
                            [NAME_VALIDATION_RULE]: [RuleNode, RULE_TYPE_VALIDATION]
                        };
                    }
                    default: {
                        return {
                            [NAME_ANSWER]: [AnswerNode],
                            [NAME_VISIBILITY_RULE]: [RuleNode, RULE_TYPE_VISIBILITY],
                            [NAME_VALIDATION_RULE]: [RuleNode, RULE_TYPE_VALIDATION]
                        };
                    }
                }
            }
            case RuleNode: {
                return {};
            }
            case AnswerNode: {
                return {
                    [NAME_VISIBILITY_RULE]: [RuleNode, RULE_TYPE_VISIBILITY]
                };
            }
            case PdfFieldNode: {
                return {
                    [NAME_PDF_FIELD_VALUE]: [PdfFieldValueNode],
                    [NAME_PDF_FIELD_MAP]: [PdfFieldMapNode]
                }
            }
            case PdfFieldValueNode:
            case PdfFieldMapNode: {
                return {
                    [NAME_VISIBILITY_RULE]: [RuleNode, RULE_TYPE_VISIBILITY]
                };
            }
        }
        if (this.root) {
            switch (this.root.type) {
                case TREE_DOCUMENT: {
                    return {
                        [NAME_GROUP]: [GroupNode],
                        [NAME_VISIBILITY_RULE]: [RuleNode, RULE_TYPE_VISIBILITY]
                    }; 
                }
                case TREE_DOCUMENT_PDF_FORM: {
                    return {};
                }
            }
        }
        return {
            [NAME_GROUP]: [GroupNode],
            [NAME_MATRIX]: [MatrixNode],
            [NAME_TEXT]: [QuestionNode, FIELD_TEXT],
            [NAME_CHOICE]: [QuestionNode, FIELD_CHOICE],
            [NAME_DROPDOWN]: [QuestionNode, FIELD_DROPDOWN],
            [NAME_FILE_UPLOAD]: [QuestionNode, FIELD_UPLOAD],
            [NAME_VISIBILITY_RULE]: [RuleNode, RULE_TYPE_VISIBILITY]
        };
    }

    renderShowMore() {
        let text = 'Show More (' + (this.node.children.length - DEFAULT_SHOW_COUNT) + ')';
        if (this.state.showAll) {
            text = 'Show Less';
        }
        return <li key={this.node.uid + '-show-more'} className='node show-more'>
            <a className='name' href='#' onClick={this.onShowMore}>{text}</a>
        </li>;
    }

    /**
     * {@inheritdoc}
     */
    render() {
        if (!this.node) {
            return <li className={this.getClassName()}>(EMPTY)</li>;
        }
        let children = [];
        for (let i in this.node.children) {
            if (!this.state.showAll && children.length >= DEFAULT_SHOW_COUNT) {
                children.push(this.renderShowMore());
                break;
            }
            let child = this.node.children[i];
            children.push(
                <BuilderNodeComponent
                    key={child.uid}
                    root={this.root}
                    node={child}
                    parent={this.node}
                    formNode={this.formNode}
                />
            );
        }
        if (children.length > DEFAULT_SHOW_COUNT && this.state.showAll) {
            children.push(this.renderShowMore());
        }
        let availableTypes = this.availableTypes();
        let addOptions = [];
        if (this.node instanceof QuestionNode && [FIELD_CHOICE, FIELD_DROPDOWN].indexOf(this.node.type) > -1) {
            addOptions.push(
                <li key={this.node.uid + '_addbulk'} className='pure-menu-item'>
                    <a href="#" className='pure-menu-link' onClick={this.onBulkAddButton}>Bulk Answers</a>
                </li>
            );
        }
        for (let i in availableTypes) {
            addOptions.push(
                <li key={this.node.uid + '_add_' + i} className='pure-menu-item'>
                    <a href="#" className='pure-menu-link' data-type={i} onClick={this.onAddButton}>{i}</a>
                </li>
            );
        }
        let canDelete = this.node.builderCanDelete() || (this.node.uid == this.root.uid && this.props?.onRootDelete);
        return <li
            className={this.getClassName()}
            id={'node-' + this.node.uid}
            onDragOver={this.onDragOver}
            onDragLeave={this.onDragLeave}
            onDrop={this.onDrop}
        >
            <div className='object'>
                <div className='options' role='group'>
                    <div className='pure-button-group'>
                        <button className='pure-button opt opt-uid' onClick={this.onUidButton} title='UID'><FontAwesomeIcon icon={faMagnifyingGlass} /></button>
                        <button
                            className={'pure-button opt opt-del' + (canDelete ? '' : ' hidden')}
                            onClick={this.onDelButton}
                            title={BTN_DELETE}>
                                <FontAwesomeIcon icon={faTrash} />
                            </button>
                    </div>
                    <div className='pure-menu custom-restricted-width'>
                        <ul className='pure-menu-list'>
                            <li className={'pure-menu-item pure-menu-has-children pure-menu-allow-hover' + (addOptions.length == 0 ? ' hidden' : '') }>
                                <a href="#" className="pure-menu-link pure-button">
                                    <FontAwesomeIcon icon={faPlus} />
                                </a>
                                <ul className='pure-menu-children'>{addOptions}</ul>
                            </li>
                        </ul>
                    </div>
                </div>
                <BuilderNodeTitleComponent node={this.node} />
                <BuilderFormComponent node={this.node} root={this.root} formNode={this.formNode} />
            </div>
            <ul>{children}</ul>
        </li>;
    }

}
