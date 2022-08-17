import React from 'react';
import Events from '../../events';
import BuilderFormField from './form_field';

export default class BuilderFormComponent extends React.Component {

    constructor(props) {
        super(props);
        this.node = props?.node;
        this.root = props?.root;
        this.formNode = props?.formNode ? props.formNode : this.root;
        this.state = {
            active: false
        }
        this.onActive = this.onActive.bind(this);
    }

    /**
     * {@inheritdoc}
     */
    componentDidMount() {
        Events.listen('builder-active-node', this.onActive);
    }

    /**
     * {@inheritdoc}
     */
    componentWillUnmount() {
        Events.remove('builder-active-node', this.onActive);
    }

    /**
     * @param {Event} e 
     */
    onActive(e) {
        let active = e.detail.node.uid == this.node.uid;
        this.setState({ active: active });
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
                <BuilderFormField
                    key={this.node.uid + '_field_' + i}
                    node={this.node}
                    root={this.root}
                    field={fieldDefs[i]}
                    formNode={this.formNode}
                />
            );
        }
        return <form className='active pure-form pure-form-stacked'>{fields}</form>;
    }

}