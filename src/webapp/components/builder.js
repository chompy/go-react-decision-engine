import React from 'react';
import Events from '../events';
import JsonConverter from '../converters/json';
import BaseNode from '../objects/base';
import RootNode, {DECISION_TYPE_DOCUMENT} from '../objects/root';
import BuilderNodeComponent from './builder/node';

export default class BuilderComponent extends React.Component {

    constructor(props) {
        super(props);
        this.node = typeof props.node == 'undefined' ? null : props.node
        if (!this.node) {
            this.node = new RootNode(BaseNode.generateUid());
            this.node.name = 'TOP';
            this.node.type = DECISION_TYPE_DOCUMENT;
        }
        this.ruleEditorTemplates = typeof props.ruleEditorTemplates == 'undefined' ? {} : props.ruleEditorTemplates;
        this.setNodeCallback = this.setNodeCallback.bind(this);
        Events.dispatch('builder_set_node', {
            set: this.setNodeCallback
        });
    }

    /**
     * {@inheritdoc}
     */
    componentDidMount() {
        Events.dispatch('builder_set_node', {
            set: this.setNodeCallback
        });
    }

    /**
     * Set decision node via callback.
     * @param {BaseNode} node 
     */
    setNodeCallback(node) {
        if (node instanceof BaseNode) {
            this.node = node;
        } else if (typeof node == 'string') {
            let c = new JsonConverter;
            this.node = c.import(JSON.parse(node));
        }
        return this.node;
    }

    /**
     * {@inheritdoc}
     */
    render() {
        return <div className='decision-engine-builder'>
            <ul className='top builder'><BuilderNodeComponent root={this.node} node={this.node} /></ul>
        </div>;
    }

}
