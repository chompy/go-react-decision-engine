import React from 'react';
import BuilderFormField from './form_field';

export default class BuilderFormComponent extends React.Component {

    constructor(props) {
        super(props);
        this.node = props.object;
        this.root = props.root;
        this.state = {
            active: window.location.hash.substring(1) == 'node-' + this.node.uid
        }
        this.onHashChange = this.onHashChange.bind(this);
    }

    /**
     * {@inheritdoc}
     */
    componentDidMount() {
        window.addEventListener('hashchange', this.onHashChange);
    }

    /**
     * {@inheritdoc}
     */
    componentWillUnmount() {
        window.removeEventListener('hashchange', this.onHashChange);
    }

    /**
     * @param {Event} e 
     */
    onHashChange(e) {
        let active = window.location.hash.substring(1) == 'node-' + this.node.uid;
        if (active != this.state.active) {
            this.setState({
                active: active
            });
        }
    }

    /**
     * {@inheritdoc}
     */
     render() {
        if (!this.state.active) {
            return <form></form>;
        }
        let fields = [];
        let fieldDefs = this.node.builderFields();
        for (let i in fieldDefs) {
            fields.push(
                <BuilderFormField key={this.node.uid + '_field_' + i} node={this.node} root={this.root} field={fieldDefs[i]} />
            );
        }
        return <form>{fields}</form>;
    }

}