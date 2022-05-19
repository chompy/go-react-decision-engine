import React from 'react';
import DecisionBuilder from '../../core/decision_builder';
import DecisionBase from '../../core/decision_objects/base';
import DecisionRoot, {DECISION_TYPE_DOCUMENT} from '../../core/decision_objects/root';
import Events from '../../core/events';
import BuilderNodeComponent from './node';


export default class BuilderBaseComponent extends React.Component {

    constructor(props) {
        super(props);
        this.object = typeof props.object == 'undefined' ? null : props.object
        if (!this.object) {
            this.object = new DecisionRoot;
            this.object.uid = DecisionBase.generateUid();
            this.object.name = 'TOP';
            this.object.type = DECISION_TYPE_DOCUMENT;
        }
        this.ruleEditorTemplates = typeof props.ruleEditorTemplates == 'undefined' ? {} : props.ruleEditorTemplates;
        this.setObjectCallback = this.setObjectCallback.bind(this);
        Events.dispatch('builder_set_object', {
            set: this.setObjectCallback
        });
    }

    /**
     * {@inheritdoc}
     */
    componentDidMount() {
        Events.dispatch('builder_set_object', {
            set: this.setObjectCallback
        });
    }

    /**
     * Set decision object via callback.
     * @param {DecisionBase} obj 
     */
    setObjectCallback(obj) {
        if (!obj) {
            return this.object;
        }
        if (typeof obj == 'string') {
            obj = JSON.parse(obj);
        }
        let b = new DecisionBuilder;
        this.object = b.build(obj);
        return this.object;
    }

    /**
     * {@inheritdoc}
     */
     render() {
        return <div>
            <ul className='top builder'><BuilderNodeComponent root={this.object} object={this.object} /></ul>
        </div>;
    }

}
