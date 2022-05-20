import React from 'react';
import BaseShortcode from './base';
import QuestionFile from '../components/question_file';
import {DECISION_FORM_TYPE_UPLOAD} from '../decision_objects/question.js';
import md5 from 'blueimp-md5';

export default class AnswersShortcode extends BaseShortcode {

    constructor(decisionManager) {
        super();
        this.decisionManager = decisionManager;
        this.isPdf = false;
    }

    /**
     * @inheritdoc
     */
    name() {
        return 'answers';
    }

    /**
     * @param {*} c 
     * @return {DecisionBase}
     */
    getObject(c) {
        if (typeof(this.decisionManager.objects[this.decisionManager.currentIndex]) == 'undefined') {
            return null;
        }
        if (!c.opts.uid) {
            return null;
        }
        // find question object
        let object = null;
        for (let i in this.decisionManager.objects) {
            object = this.decisionManager.objects[i].getChild(c.opts.uid);
            if (object) {
                break;
            }
        }
        return object;
    }

    /**
     * @param {DecisionBase} object 
     * @param {number} answerIndex 
     * @return {string}
     */
    generateAnswerHash(object, answerIndex) {
        let data = object.uid + '|' + answerIndex;
        return md5(data).substring(0, 6);
    }

    /**
     * @param {*} c 
     * @param {boolean} isPdf 
     * @returns 
     */
    handleRender(c, isPdf) {
        // find question object
        let object = this.getObject(c);
        if (!object) {
            return null;
        }
        // get answers
        let answers = this.decisionManager.userData.getQuestionAnswers(c.opts.uid, c.opts.matrix);
        // determine render method
        switch (object.type) {
            case DECISION_FORM_TYPE_UPLOAD: {
                let out = [];
                for (let i in answers) {
                    let key = 'upload_' + object.uid + '_' + answers[i].split('|')[0];
                    let uri = this.decisionManager.urls.answerDownload + 
                        '/' + this.decisionManager.userData.key +
                        '/' + this.generateAnswerHash(object, i)
                    ;
                    out.push(<QuestionFile key={key} object={object} data={answers[i]} isPdf={isPdf} uri={uri} />);
                }
                return out;
            }
            default: {
                let answerText = [];
                for (let i in answers) {
                    let hasAnswer = false;
                    for (let j in this.decisionManager.objects) {
                        let answerObj = this.decisionManager.objects[j].getChild(answers[i]);
                        if (answerObj) {
                            hasAnswer = true;
                            answerText.push(answerObj.value ? answerObj.value : answerObj.label);
                            break;
                        }
                    }
                    if (!hasAnswer) {
                        answerText.push(answers[i]);
                    }
                }
                // exactly one answer
                if (answerText.length == 1) {
                    return <span key={c.id} className={'answers answers-' + c.opts.uid}>{answerText[0]}</span>;
                // multiple answers
                } else if (answerText.length > 1)  {
                    let out = [];
                    for (let i in answerText) {
                        out.push(<li key={c.id+'_'+i}>{answerText[i]}</li>);
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

    /**
     * @inheritdoc
     */
    render(c) {
        return this.handleRender(c, false);
    }

    /**
     * @inheritdoc
     */
    renderPdf(c) {
        return this.handleRender(c, true);
    }

}