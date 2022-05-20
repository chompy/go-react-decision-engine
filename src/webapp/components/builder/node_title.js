import React from 'react';
import Events from '../../events';

export default class BuilderNodeTitleComponent extends React.Component {

    constructor(props) {
        super(props);
        this.node = typeof props.node == 'undefined' ? null : props.node;
        this.state = {
            name: this.getName()
        }
        this.onUpdate = this.onUpdate.bind(this);
        this.onDragStart = this.onDragStart.bind(this);
        this.onClick = this.onClick.bind(this);
    }

    /**
     * {@inheritdoc}
     */
     componentDidMount() {
        Events.listen('update', this.onUpdate);
    }

    /**
     * {@inheritdoc}
     */
    componentWillUnmount() {
        Events.remove('update', this.onUpdate);
    }

    /**
     * Get display name for object.
     * @returns 
     */
    getName() {
        if (!this.node) {
            return '(Unnamed)';
        }
        return this.node.getName();
    }

    /**
     * @param {Event} e 
     */
    onUpdate(e) {
        if (!this.node || !e.detail) {
            return;
        }
        this.setState({
            name: this.getName()
        })
    }

    /**
     * @param {Event} e 
     */
    onDragStart(e) {
        Events.dispatch('drag', {node: this.node});
    }

    /**
     * @param {Event} e 
     */
    onClick(e) {
        e.preventDefault();
        Events.dispatch('builder-active-node', {node: this.node});
    }

    /**
     * {@inheritdoc}
     */
     render() {
        if (!this.node) {
            return null;
        }
        return <a href='#' className='name' onClick={this.onClick} onDragStart={this.onDragStart}>{this.state.name}</a>
    }

}
