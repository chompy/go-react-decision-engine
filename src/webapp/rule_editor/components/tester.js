import React from 'react';
import DecisionQuestion, { DECISION_FORM_TYPE_TEXT } from '../../core/decision_objects/question';
import DecisionRoot from '../../core/decision_objects/root';
import DecisionRule, { RULE_TYPE_VISIBILITY } from '../../core/decision_objects/rule';
import DecisionUserData from '../../core/decision_user_data';
import RuleEngine from '../../core/rule_engine';

const TEST_QUESTION_UID = 'TEST_QUESTION';
const TEST_RULE_UID = 'TEST_RULE';
export default class RuleTesterComponent extends React.Component {

    constructor(props) {
        super(props);
        this.fetchScript = props.scriptCallback;
        this.ruleEngine = new RuleEngine;
        this.onTest = this.onTest.bind(this);
        this.onCustomTest = this.onCustomTest.bind(this);
    }

    /**
     * {@inheritdoc}
     */
    componentDidMount() {

    }

    /**
     * {@inheritdoc}
     */
    componentWillUnmount() {

    }

    /**
     * {@inheritdoc}
     */
    componentDidUpdate() {

    }

    /**
     * Get test decision object.
     * @returns {DecisionRoot}
     */
    getTestObject() {
        let root = new DecisionRoot;
        root.uid = DecisionRoot.generateUid();
        let question = new DecisionQuestion;
        question.uid = TEST_QUESTION_UID;
        question.type = DECISION_FORM_TYPE_TEXT;
        root.addChild(question);
        let rule = new DecisionRule;
        rule.uid = TEST_RULE_UID;
        rule.type = RULE_TYPE_VISIBILITY;
        if (this.fetchScript) {
            let data = this.fetchScript();
            rule.script = JSON.stringify({
                value: data.script,
                fields: data.fields
            });
        }
        question.addChild(rule);
        return root;
    }

    /**
     * Perform test.
     * @param {Array} answers 
     */
    runTest(answers) {
        if (!this.fetchScript) {
            this.displayResults('Rule script fetch callback not set.');
            return;
        }
        let object = this.getTestObject();
        this.ruleEngine.setRootObject(object);
        let userData = new DecisionUserData;
        for (let i in answers) {
            userData.addAnswer(this.ruleEngine.root.getChild(TEST_QUESTION_UID), answers[i]);
        }
        this.ruleEngine.setUserData(userData);
        console.log('RULE EVAL', this.ruleEngine.root, this.ruleEngine.root.getChild(TEST_RULE_UID));
        let res = null;
        try {
            this.ruleEngine.setRuleObject(this.ruleEngine.root.getChild(TEST_RULE_UID));
            res = this.ruleEngine.evaluate();
        } catch (e) {
            this.displayResults(e);
            return;
        }
        this.displayResults('Success!\n\nRESULT:\n' + res.results + '\n\nMESSAGE:\n'+ (res.message ? res.message : '(none)'));
    }

    /**
     * Event fired when test button clicked.
     * @param {Event} e 
     */
    onTest(e) {
        e.preventDefault();
        let answers = e.target.getAttribute('data-answers').split(',');
        return this.runTest(answers);
    }

    /**
     * Event fired when custom test button clicked.
     * @param {Event} e 
     */
    onCustomTest(e) {
        e.preventDefault();
        let answers = prompt('Enter answers, use commas to split multiple answers.').split(',');
        return this.runTest(answers);
    }

    displayResults(msg) {
        alert('== RULE TESTER ==\n\n' + msg);
    }

    /**
     * {@inheritdoc}
     */
     render() {
        return <div className='rule-tester'>
            <button onClick={this.onTest} data-answers=''>Test w/ No Answers</button>
            <button onClick={this.onTest} data-answers='red'>Test w/ One Answer</button>
            <button onClick={this.onTest} data-answers='red,blue'>Test w/ Two Answers</button>
            <button onClick={this.onCustomTest}>Test w/ Custom Answers</button>
        </div>;
    }

}
