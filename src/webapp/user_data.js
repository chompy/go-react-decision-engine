import BaseNode from './nodes/base.js';
import QuestionNode from './nodes/question.js';
import AnswerNode from './nodes/answer.js';

/**
 * User specific decision engine data. Contains answers
 * to questions.
 */
export default class DecisionUserData {

    constructor(uid) {
        this.uid = uid;
        this.answers = {};
        this.hidden = [];
        this.saveCount = 0;
        this.valid = true;
        this.questionValidationMessages = {};
        this.loaded = false;
        this.extra = {};
    }

    /**
     * Convert answer to string.
     * @param {QuestionNode} question
     * @param {*} answer 
     */
    sanitizeAnswer(question, answer) {
        // empty answer
        if (!answer) {
            return '';
        }
        // if answer is decision answer convert to uid string
        if (
            question &&
            question instanceof QuestionNode && 
            answer instanceof AnswerNode
        ) {
            if (question.getChild(answer.uid)) {
                answer = answer.uid;
            }
        }
        // convert answer to string
        return String(answer);
    }

    /**
     * Add answer to question.
     * @param {QuestionNode} question 
     * @param {*} answer
     * @param {string} matrixId
     */
    addAnswer(question, answer, matrixId) {
        if (!question || !(question instanceof QuestionNode)) {
            return;
        }
        let uid = question.uid;
        if (matrixId) {
            uid = uid + '_' + matrixId;
        }
        // add entry for question in answer list
        if (typeof(this.answers[uid]) == 'undefined') {
            this.answers[uid] = [];
        }
        // sanitize answer
        answer = this.sanitizeAnswer(question, answer);
        // empty answer, ignore
        if (!answer) {
            return;
        }
        // add answer
        if (this.answers[uid].indexOf(answer) == -1) {
            this.answers[uid].push(answer);
        }
        if (matrixId) {
            this.addAnswer(question, matrixId);
        }
    }

    /**
     * Remove answer to given question.
     * @param {*} question 
     * @param {*} answer 
     * @param {string} matrixId
     */
    removeAnswer(question, answer, matrixId) {
        if (matrixId) {
            this.removeAnswer(question, matrixId);
        }
        // sanitize answer
        answer = this.sanitizeAnswer(question, answer);
        // empty answer, ignore
        if (!answer) {
            return;
        }
        let uid = (question instanceof QuestionNode) ? question.uid : question;
        if (matrixId) {
            uid = uid + '_' + matrixId;
        }
        // add entry for question in answer list
        if (!(uid in this.answers)) {
            this.answers[uid] = [];
        }
        // remove answer
        let index = this.answers[uid].indexOf(answer);
        if (index >= 0) {
            this.answers[uid].splice(index, 1);
        }
    }

    /**
     * Delete all answers for given question.
     * @param {QuestionNode} question 
     * @param {string} matrixId
     */
    resetAnswers(question, matrixId) {
        if (!(question instanceof QuestionNode)) {
            return;
        }
        let uid = question.uid;
        if (matrixId) {
            uid = uid + '_' + matrixId;
        }
        this.answers[uid] = [];
    }

    /**
     * Delete all answer for given matrix id.
     * @param {string} matrixId 
     */
    resetMatrix(matrixId) {
        for (let uid in this.answers) {
            this.removeAnswer(uid, matrixId);
        }
        for (let uid in this.answers) {
            if (uid.substring(uid.length-matrixId.length) == matrixId) {
                this.answers[uid] = [];
                delete this.answers[uid];
                this.resetMatrix(matrixId);
                return;
            }
        }
    }

    /**
     * Get answer to question.
     * @param {*} question
     * @param {string} matrixId
     * @return {object}
     */
    getQuestionAnswers(question, matrixId) {
        if (question instanceof QuestionNode) {
            question = question.uid;
        }
        if (matrixId) {
            question = question + '_' + matrixId;
        }
        if (question in this.answers) {
            return this.answers[question];
        }
        return [];        
    }

    /**
     * Determine if answer exists.
     * @param {*} answer
     * @return boolean
     */
    hasAnswer(answer) {
        if (answer instanceof AnswerNode) {
            answer = answer.uid;
        }
        for (let i in this.answers) {
            if (this.answers[i] == answer || this.answers[i].indexOf(answer) != -1) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get list of matrix ids for given object.
     * @param {DecisionBase} obj 
     * @returns {Array}
     */
    findMatrixIds(obj) {
        if (obj instanceof QuestionNode) {
            let values = this.getQuestionAnswers(obj);
            if (values.length > 0) {
                return values;
            }
        }
        let out = [];
        for (let i in obj.children) {
            let values = this.findMatrixIds(obj.children[i]);
            if (values.length > out.length) { 
                out = values;
            }
        }
        return out;
    }

    /**
     * Flag node as hidden.
     * @param {BaseNode} node 
     * @param {boolean} state 
     * @returns 
     */
    setHidden(node, state, matrixId) {
        if (!(node instanceof BaseNode)) {
            return;
        }
        let key = node.uid + '_' + (matrixId ? matrixId : '');
        if (state) {
            if (this.hidden.indexOf(key) == -1) {
                this.hidden.push(key);
            }
            return;
        }
        let index = this.hidden.indexOf(key);
        if (index > -1) {
            this.hidden.splice(index, 1);
        }
    }

    /**
     * Check if node is flagged as hidden.
     * @param {BaseNode} node 
     * @param {BaseNode} root
     * @param {string} matrixId
     * @returns {boolean}
     */
    isHidden(node, root, matrixId) {
        if (!(node instanceof BaseNode)) {
            return false;
        }
        let key = node.uid + '_' + (matrixId ? matrixId : '');
        if (this.hidden.indexOf(key) != -1) {
            return true;
        }
        if (root && root instanceof BaseNode) {
            let parent = node;
            while (parent = parent.getParent(root)) {
                if (
                    this.hidden.indexOf(parent.uid + '_' + (matrixId ? matrixId : '')) != -1 || 
                    this.hidden.indexOf(parent.uid + '_') != -1
                ) {
                    return true;
                }
            }
        }
        return false;
    }
    
    /**
     * @param {QuestionNode} question 
     * @param {string} matrixId
     */
    resetValidationState(question, matrixId) {
        if (!(question instanceof QuestionNode)) {
            return;
        }
        this.questionValidationMessages[question.uid + '_' + (matrixId ? matrixId : '')] = [];
    }

    /**
     * @param {QuestionNode} question 
     * @param {string} message 
     * @param {string} matrixId
     */
    addValidationMessage(question, message, matrixId) {
        if (!(question instanceof QuestionNode) || !message.trim()) {
            return;
        }
        let key = question.uid + '_' + (matrixId ? matrixId : '');
        if (!(key in this.questionValidationMessages)) {
            this.questionValidationMessages[key] = [];
        }
        this.questionValidationMessages[key].push(message.trim());
    }

    /**
     * @param {QuestionNode} question 
     * @param {string} matrixId
     * @returns {Array}
     */
    getValidationMessages(question, matrixId) {
        if (!(question instanceof QuestionNode)) {
            return;
        }
        let key = question.uid + '_' + (matrixId ? matrixId : '');
        if (key in this.questionValidationMessages) {
            return this.questionValidationMessages[key];
        }
        return [];
    }

    /**
     * Export to JSON compatible object.
     * @return {object}
     */
    exportJSON() {
        return {
            'uid' : this.key,
            'answers' : this.answers,
            'saveCount' : this.saveCount,
            'extra' : this.extra
        };
    }

    /**
     * Build user data from object.
     * @param {object} data 
     * @return {DecisionUserData}
     */
    static importJSON(data) {
        let u = new DecisionUserData(data.uid);
        for (let quid in data.answers) {
            u.answers[quid] = data.answers[quid];
        }
        u.saveCount = typeof data.saveCount != 'undefined' ? data.saveCount : 1;
        u.extra = typeof data.extra != 'undefined' ? data.extra : {};
        u.loaded = true;
        return u
    }

}
