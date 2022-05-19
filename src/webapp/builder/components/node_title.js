import React from 'react';
import Events from '../../core/events';

export default class BuilderNodeTitleComponent extends React.Component {

    constructor(props) {
        super(props);
        this.object = typeof props.object == 'undefined' ? null : props.object;
        this.state = {
            name: this.getName()
        }
        this.onUpdate = this.onUpdate.bind(this);
        this.onDragStart = this.onDragStart.bind(this);
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
        if (!this.object) {
            return '(Unnamed)';
        }
        return this.object.getName();
    }

    /**
     * @param {Event} e 
     */
    onUpdate(e) {
        if (!this.object || !e.detail) {
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
        Events.dispatch('drag', {object: this.object});
    }

    /**
     * {@inheritdoc}
     */
     render() {
        if (!this.object) {
            return null;
        }
        return <a href={'#node-' + this.object.uid} className='name' onDragStart={this.onDragStart}>{this.state.name}</a>
    }

}
