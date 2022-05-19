import React from 'react';
import DecisionAnswer from '../../core/decision_objects/answer';
import DecisionBase from '../../core/decision_objects/base';
import DecisionGroup from '../../core/decision_objects/group';
import DecisionMatrix from '../../core/decision_objects/matrix';
import DecisionQuestion, { DECISION_FORM_TYPE_CHOICE, DECISION_FORM_TYPE_DROPDOWN, DECISION_FORM_TYPE_TEXT, DECISION_FORM_TYPE_UPLOAD } from '../../core/decision_objects/question';
import DecisionRoot from '../../core/decision_objects/root';
import DecisionRule, { RULE_TYPE_VALIDATION, RULE_TYPE_VISIBILITY } from '../../core/decision_objects/rule';
import Events from '../../core/events';
import BuilderFormComponent from './form';
import BuilderNodeTitleComponent from './node_title';

const DROP_STATE_NONE = 0;
const DROP_STATE_UP = 1;
const DROP_STATE_DOWN = 2;
const DROP_STATE_CHILD = 3;
const DEFAULT_SHOW_COUNT = 10;

export default class BuilderNodeComponent extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            dropState: DROP_STATE_NONE,
            showAll: false
        }
        this.root = typeof props.root == 'undefined' ? null : props.root;
        this.parent = typeof props.parent == 'undefined' ? null : props.parent;
        this.object = typeof props.object == 'undefined' ? null : props.object;
        this.currentDragObject = null;
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
    }

    /**
     * {@inheritdoc}
     */
     componentDidMount() {
        Events.listen('builder_delete', this.onDelete);
        Events.listen('update', this.onUpdate);
        Events.listen('rerender', this.onDoRerender);
        Events.listen('drag', this.onDragStart)
    }

    /**
     * {@inheritdoc}
     */
    componentWillUnmount() {
        Events.remove('builder_delete', this.onDelete);
        Events.remove('update', this.onUpdate);
        Events.remove('rerender', this.onDoRerender);
        Events.remove('drag', this.onDragStart)
    }

    /**
     * Get display name for object.
     * @returns 
     */
    getName() {
        if (!this.object) {
            return '(Unnamed)';
        }
        return this.object.getName();
    }
    
    /**
     * @return {string}
     */
    getClassName() {
        if (!this.object) {
            return 'node empty';
        }
        let typeName = this.object.constructor.getTypeName()
        typeName = typeName.replace('decision_', '');
        if (this.object instanceof DecisionQuestion || this.object instanceof DecisionRule) {
            typeName += ' ' + this.object.type;
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
        return 'node ' + typeName + dropState;
    }

    /**
     * Event that fires when add button is pressed.
     * @param {Event} e 
     */
    onAddButton(e) {
        e.preventDefault();
        if (!this.object) {
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
        child.uid = DecisionBase.generateUid();
        switch (child.constructor) {
            case DecisionGroup: {
                child.name = 'Group ' + child.uid;
                break;
            }
            case DecisionMatrix: {
                child.name = 'Matrix ' + child.uid;
                break;
            }
            case DecisionQuestion: {
                child.label = 'Question ' + child.uid;
                child.type = type[1];
                break;
            }
            case DecisionAnswer: {
                child.label = 'Answer ' + child.uid;
                break;
            }
            case DecisionRule: {
                child.label = 'Rule ' + child.uid;
                child.type = type[1];
                break;
            }
        }
        this.object.children.push(child);
        Events.dispatch('update', this.root);
        this.forceUpdate();
    }

    /**
     * @param {Event} e 
     */
    onBulkAddButton(e) {
        e.preventDefault();
        if (!this.object) {
            return;
        }
        let answers = prompt('Enter answers delimited by a comma.').split(',');
        for (let i in answers) {
            let answer = answers[i].trim();
            if (!answer) {
                continue;
            }
            let obj = new DecisionAnswer(DecisionAnswer.generateUid());
            obj.label = answer;
            obj.value = answer;
            this.object.children.push(obj);
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
        if (!this.object || this.object instanceof DecisionRoot) {
            return;
        }
        if (confirm('Are you sure you want to delete this node and all of its children?')) {
            Events.dispatch(
                'builder_delete',
                this.object.uid
            );
        }
    }

    /**
     * Event that fires when uid button is pressed.
     * @param {Event} e 
     */
    onUidButton(e) {
        e.preventDefault();
        if (!this.object) {
            return;
        }
        prompt('Copy the uid.', this.object.uid);
    }

    /**
     * @param {Event} e 
     */
    onDelete(e) {
        if (!this.object || !e.detail) {
            return;
        }
        for (let i in this.object.children) {
            if (this.object.children[i] == e.detail) {
                this.object.children.splice(i, 1);
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
        if (!this.object || !e.detail) {
            return;
        }
        if (this.root.uid == this.object.uid) {
            Events.dispatch('root_update', {
                object: this.object,
                data: this.object.exportJSON()
            });
        }
    }

    /**
     * @param {Event} e 
     */
    onDoRerender(e) {
        if (!this.object || !e.detail) {
            return;
        }
        if (e.detail.uid == this.object.uid) {
            this.forceUpdate();
        }
    }

    /**
     * Check if given decision object can be dropped under this object.
     * @param {DecisionBase} obj 
     * @param {bool} asChild
     * @returns {bool}
     */
    canDrop(obj, asChild) {
        if (!obj || !this.object || !this.parent || obj.getChild(this.object.uid)) {
            return false;
        }
        let pn = new BuilderNodeComponent({object: asChild ? this.object : this.parent});
        let availableTypes = pn.availableTypes();
        let isCorrectType = false;
        for (let i in availableTypes) {
            if (obj instanceof availableTypes[i][0]) {
                switch (availableTypes[i][0]) {
                    case DecisionQuestion:
                    case DecisionRule: {
                        if (obj.type == availableTypes[i][1]) {
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
        while (target.nodeName != 'LI' || target.id != 'node-' + this.object.uid) {
            target = target.parentNode;
            if (target.id != 'node-' + this.object.uid) {
                this.setState({
                    dropState: DROP_STATE_NONE
                });
                return;
            }
        }
        let asChild = this.object.children.length == 0 && e.clientX - target.offsetLeft > 80;
        if (!this.canDrop(this.currentDragObject, asChild)) {
            return;
        }
        if (asChild) {
            this.setState({
                dropState: DROP_STATE_CHILD
            });
            return;
        } else if (e.clientY - target.offsetTop < 50) {
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
        while (target.nodeName != 'LI' || target.id != 'node-' + this.object.uid) {
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
        this.currentDragObject = e.detail.object;
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
        while (target.nodeName != 'LI' || target.id != 'node-' + this.object.uid) {
            target = target.parentNode;
        }
        // if mouse over element is offset by more then 80 pixels assume user
        // wants to add element as child instead of above/below
        let asChild = this.object.children.length == 0 && e.clientX - target.offsetLeft > 80;
        // check to ensure this object can be placed here
        if (!this.canDrop(this.currentDragObject, asChild)) {
            return;
        }
        // remove object to be moved from it's current parent
        let currentParent = this.currentDragObject.getParent(this.root);
        for (let i in currentParent.children) {
            if (currentParent.children[i].uid == this.currentDragObject.uid) {
                currentParent.children.splice(i, 1);
                break;
            }
        }
        // insert as child
        if (asChild) {
            this.object.children = [this.currentDragObject];
            this.currentDragObject = null;
            this.onUpdate({detail: true});
            Events.dispatch('update', this.root);
            Events.dispatch('rerender', this.root);
            return;
        }
        // check dropping above or below
        let direction = 1;
        if (e.clientY - target.offsetTop < 50) {
            direction = 0;
        }
        // insert
        for (let i in this.parent.children) {
            if (this.parent.children[i].uid == this.object.uid) {
                let insertIndex = parseInt(i)+direction;
                if (insertIndex < 0) {
                    insertIndex = 0;
                }
                this.parent.children.splice(insertIndex, 0, this.currentDragObject);
                break;
            }
        }
        this.currentDragObject = null;
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
     * List available child decision object types.
     * @returns {Array}
     */
    availableTypes() {
        switch (this.object.constructor) {
            case DecisionRoot:
                // should we enforce there having to be a group under the root?
                return {
                    'Content/Group': [DecisionGroup]
                };
            case DecisionQuestion:
                switch (this.object.type) {
                    case DECISION_FORM_TYPE_TEXT:
                    case DECISION_FORM_TYPE_UPLOAD: {
                        return {
                            'Visibility Rule': [DecisionRule, RULE_TYPE_VISIBILITY],
                            'Validation Rule': [DecisionRule, RULE_TYPE_VALIDATION]
                        };
                    }
                    default: {
                        return {
                            'Answer': [DecisionAnswer],
                            'Visibility Rule': [DecisionRule, RULE_TYPE_VISIBILITY],
                            'Validation Rule': [DecisionRule, RULE_TYPE_VALIDATION]
                        };
                    }
                }
            case DecisionRule:
                return {};
            case DecisionAnswer:
                return {
                    'Visibility Rule': [DecisionRule, RULE_TYPE_VISIBILITY]
                };
        }
        return {
            'Content/Group': [DecisionGroup],
            'Matrix': [DecisionMatrix],
            'Text Input': [DecisionQuestion, DECISION_FORM_TYPE_TEXT],
            'Multiple Choice': [DecisionQuestion, DECISION_FORM_TYPE_CHOICE],
            'Dropdown': [DecisionQuestion, DECISION_FORM_TYPE_DROPDOWN],
            'File Upload': [DecisionQuestion, DECISION_FORM_TYPE_UPLOAD],
            'Visibility Rule': [DecisionRule, RULE_TYPE_VISIBILITY]
        };
    }

    renderShowMore() {
        let text = 'Show More (' + (this.object.children.length - DEFAULT_SHOW_COUNT) + ')';
        if (this.state.showAll) {
            text = 'Show Less';
        }
        return <li key={this.object.uid + '-show-more'} className='node show-more'>
            <a className='name' href='#' onClick={this.onShowMore}>{text}</a>
        </li>;
    }

    /**
     * {@inheritdoc}
     */
     render() {
        if (!this.object) {
            return <li className={this.getClassName()}>(EMPTY)</li>;
        }
        let children = [];
        for (let i in this.object.children) {
            if (!this.state.showAll && children.length >= DEFAULT_SHOW_COUNT) {
                children.push(this.renderShowMore());
                break;
            }
            let child = this.object.children[i];
            children.push(<BuilderNodeComponent key={child.uid} root={this.root} object={child} parent={this.object} />);
        }
        if (children.length > DEFAULT_SHOW_COUNT && this.state.showAll) {
            children.push(this.renderShowMore());
        }
        let availableTypes = this.availableTypes();
        let addOptions = [];
        if (this.object instanceof DecisionQuestion && [DECISION_FORM_TYPE_CHOICE, DECISION_FORM_TYPE_DROPDOWN].indexOf(this.object.type) > -1) {
            addOptions.push(
                <li key={this.object.uid + '_addbulk'}>
                    <a href='#'  onClick={this.onBulkAddButton}>Bulk Answers</a>
                </li>
            );
        }
        for (let i in availableTypes) {
            addOptions.push(
                <li key={this.object.uid + '_add_' + i}>
                    <a href='#' data-type={i} onClick={this.onAddButton}>{i}</a>
                </li>
            );
        }
        return <li
            className={this.getClassName()}
            id={'node-' + this.object.uid}
            onDragOver={this.onDragOver}
            onDragLeave={this.onDragLeave}
            onDrop={this.onDrop}
        >
            <div className='object'>
                <div className='options'>
                    <a className='opt-uid opt' href='#' onClick={this.onUidButton}>uid</a>
                    <div className='opt-add opt'>
                        add &#9662;
                        <ul>{addOptions}</ul>
                    </div>
                    <a className='opt-del opt' href='#' onClick={this.onDelButton}>del</a>
                </div>
                <BuilderNodeTitleComponent object={this.object} />
                <BuilderFormComponent object={this.object} root={this.root} />
            </div>
            <ul>{children}</ul>
        </li>;
    }

}
