import React from 'react';
import QuestionFileComponent from '../components/question_file';
import { FIELD_UPLOAD } from '../nodes/question';
import BaseShortcode from './base';

export default class AnswersShortcode extends BaseShortcode {

    /**
     * {@inheritDoc}
     */
    name() {
        return 'answer';
    }

    /**
     * @param {String} value
     * @return {String}
     */
    formatAnswer(value) {        
        // is url
        try {
            url = new URL(value);
            return <a href={value} target='_blank'>{value}</a>;
        } catch (_) {}
        // is email
        if (value.includes('@')) {
            let emailRegexExp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/gi;
            if (emailRegexExp.test(value)) {
                return <a href={'mailto:' + value} target='_blank'>{value}</a>;
            }
        }
        return value;
    }

    /**
     * {@inheritDoc}
     */
    render(c) {
        if (!BaseShortcode.root || !c?.opts?.uid) { return null; }
        let object = BaseShortcode.root.getChild(c.opts.uid);
        if (!object) {
            object = BaseShortcode.root.findProxyNode(c.opts.uid);
        }
        if (!object) { return null; }
        // get answers
        let answers = BaseShortcode.userData.getQuestionAnswers(c.opts.uid, c.opts?.matrix);
        // determine render method
        switch (object.type) {
            case FIELD_UPLOAD: {
                let out = [];
                for (let i in answers) {
                    let key = 'upload_' + object.uid + '_' + answers[i].split('|')[0];
                    let uri = '/api/download?key=' + BaseShortcode.userData.id + '&uid=' + object.uid + '&index=' + i;
                    out.push(<QuestionFileComponent key={key} object={object} data={answers[i]} isPdf={true} uri={uri} />);
                }
                return out;
            }M
            default: {
                let answerText = [];
                console.log(answers);
                for (let i in answers) {
                    let answerObj = BaseShortcode.root.getChild(answers[i]);
                    if (!answerObj) {
                        answerObj = BaseShortcode.root.findProxyNode(answers[i]);
                    }
                    if (!answerObj) {
                        answerText.push(answers[i]);
                    }
                    answerText.push(answerObj.getName());
                }
                // exactly one answer
                if (answerText.length == 1) {
                    return <span key={c.id} className={'answers answers-' + c.opts.uid}>{this.formatAnswer(answerText[0])}</span>;
                // multiple answers
                } else if (answerText.length > 1)  {
                    let out = [];
                    for (let i in answerText) {
                        out.push(<li key={c.id+'_'+i}>{this.formatAnswer(answerText[i])}</li>);
                    }
                    return <ul key={c.id}>{out}</ul>;
                }
                // no answers
                let noAnswerText = 'n/a';
                if (typeof c.opts['no-answer-text'] != 'undefined') {
                    noAnswerText = c.opts['no-answer-text'];
                }
                return <span key={c.id} className={'answers answers-' + c.opts.uid}>{noAnswerText}</span>;
            }
        }

    }

}