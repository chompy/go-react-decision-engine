import React from 'react';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-lua';
import 'ace-builds/src-noconflict/theme-github';
import RuleEngine from '../../rule_engine';
import RuleTesterComponent from './tester';
import RuleTemplateCollector from '../../rule_template_collector';

export default class RuleTemplateEditorComponent extends React.Component {

    static instanceCounter = 0;

    constructor(props) {
        super(props);
        this.state = {
            value: props?.value ? props.value : ''
        };
        RuleTemplateCollector.add({id: '_test', script: this.state.value});
        this.ruleEngine = new RuleEngine;
        this.changeTimeout = null;
        this.externalOnChange = props?.onChange;
        this.onChange = this.onChange.bind(this);
    }

    /**
     * @param {String} value 
     */
    onChange(value) {
        RuleTemplateCollector.add({id: '_test', script: value});
        this.setState({value: value})
        if (this.externalOnChange) {
            this.externalOnChange(value);
        }
    }

    /**
     * {@inheritdoc}
     */
     render() {
        return <div className='rule-editor'>
            <AceEditor 
                mode='lua'
                theme='github'
                name={this.id}
                onChange={this.onChange}
                value={this.state.value}
                width='100%'
                setOptions={{
                    useWorker: false
                }}
            />
            <RuleTesterComponent />
        </div>;
    }

}
