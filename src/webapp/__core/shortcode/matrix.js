import React from 'react';
import BaseShortcode from './base';
import DecisionMatrix from '../decision_objects/matrix';
import DecisionQuestion from '../decision_objects/question';
import AnswersShortcode from './answers';

export default class MatrixShortcode extends BaseShortcode {

    constructor(decisionManager) {
        super();
        this.decisionManager = decisionManager;
        this.isPdf = false;
    }

    /**
     * @inheritdoc
     */
    name() {
        return 'matrix';
    }

    /**
     * @inheritdoc
     */
    isInline() {
        return false;
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
        // find matrix object
        let object = null;
        for (let i in this.decisionManager.objects) {
            object = this.decisionManager.objects[i].getChild(c.opts.uid);
            if (object && object instanceof DecisionMatrix) {
                break;
            }
        }
        return object;
    }

    getMatrixQuestions(c) {
        let object = this.getObject(c);
        if (!object) {
            return {};
        }
        let findQuestions = function(obj) {
            let out = [];
            for (let i in obj.children) {
                let child = obj.children[i];
                if (child instanceof DecisionQuestion) {
                    out.push(child);
                }
                out = out.concat(findQuestions(child));
            }
            return out;
        }
        return findQuestions(object);
    }

    getMatrixIds(c) {
        let questions = this.getMatrixQuestions(c);
        let matrixIds = [];
        for (let i in questions) {
            let question = questions[i];
            let addIds = this.decisionManager.userData.findMatrixIds(question);
            for (let j in addIds) {
                if (matrixIds.indexOf(addIds[j]) == -1) {
                    matrixIds.push(addIds[j]);
                }
            }
        }
        return matrixIds;
    }

    /**
     * @param {*} c 
     * @param {boolean} isPdf 
     * @returns 
     */
    handleRender(c, isPdf) {
        let matrixIds = this.getMatrixIds(c);
        let questions = this.getMatrixQuestions(c);
        let rows = [];
        for (let i in matrixIds) {
            let matrixId = matrixIds[i];
            let cells = [];
            for (let j in questions) {
                let question = questions[j];
                let answerShortcode = new AnswersShortcode(this.decisionManager);
                let answerRender = answerShortcode.handleRender({opts: {uid: question.uid, matrix: matrixId}}, isPdf);
                cells.push(
                    <td key={'matrix-cell-' + matrixId + '-' + question.uid}>{answerRender}</td>
                );
            }
            rows.push(
                <tr key={'matrix-row-' + matrixId}>{cells}</tr>
            );
        }
        let head = [];
        for (let i in questions) {
            let question = questions[i];
            head.push(
                <th key={'matrix-head-' + question.uid}>{question.getName()}</th>
            );
        }
        return <table className='matrix-table'><thead><tr>{head}</tr></thead><tbody>{rows}</tbody></table>;
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