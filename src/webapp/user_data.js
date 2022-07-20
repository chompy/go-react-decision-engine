import BaseNode from './nodes/base.js';
import QuestionNode from './nodes/question.js';
import AnswerNode from './nodes/answer.js';

const FLAG_HIDDEN = 'hidden';
const FLAG_USER_INPUT = 'user_input';
const FLAG_USER_INPUT_ALL = '__ALL';

/**
 * User specific decision engine data. Contains answers
 * to questions.
 */
export default class UserData {

    constructor(id) {
        this.id = id;
        this.answers = {};
        this.saveCount = 0;
        this.valid = false;
        this.questionValidationMessages = {};
        this.flags = {};
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
    hasAnswer(answer, matrix) {
        if (answer instanceof AnswerNode) {
            answer = answer.uid;
        }
        for (let i in this.answers) {
            if (matrix && !i.endsWith('_' + matrix)) { continue; }
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
     * Set a flag.
     * @param {String} name 
     * @param {String} id 
     * @param {Boolean} state 
     */
    setFlag(name, id, state) {
        if (id instanceof BaseNode) { id = id.uid; }
        if (!(name in this.flags)) { this.flags[name] = []; }
        if (state) {
            if (this.flags[name].indexOf(id) == -1) {
                this.flags[name].push(id);
            }
            return;
        }
        let index = this.flags[name].indexOf(id);
        if (index > -1) {
            this.flags[name].splice(index, 1);
        }
    }

    /**
     * Check a flag.
     * @param {String} name 
     * @param {String} id 
     * @returns {Boolean}
     */
    hasFlag(name, id) {
        if (id instanceof BaseNode) { id = id.uid; }
        if (!(name in this.flags)) { this.flags[name] = []; }  
        if (this.flags[name].indexOf(id) != -1) {
            return true;
        }
    }

    /**
     * Flag node as hidden.
     * @param {BaseNode} node 
     * @param {boolean} state 
     */
    setHidden(node, state, matrixId) {
        if (!(node instanceof BaseNode)) { return; }
        let key = node.uid + '_' + (matrixId ? matrixId : '');
        this.setFlag(FLAG_HIDDEN, key, state);
    }

    /**
     * Check if node is flagged as hidden.
     * @param {BaseNode} node 
     * @param {BaseNode} root
     * @param {string} matrixId
     * @returns {boolean}
     */
    isHidden(node, root, matrixId) {
        if (!(node instanceof BaseNode)) { return false; }
        let key = node.uid + '_' + (matrixId ? matrixId : '');
        if (this.hasFlag(FLAG_HIDDEN, key)) { return true; }
        if (root && root instanceof BaseNode) {
            let parent = node;
            while (parent = parent.getParent(root)) {
                if (
                    this.hasFlag(FLAG_HIDDEN, parent.uid + '_' + (matrixId ? matrixId : '')) ||
                    this.hasFlag(FLAG_HIDDEN, parent.uid + '_')
                ) {
                    return true;
                }
            }
        }
        return false;
    }
    
    /**
     * Flag question as having user input.
     * @param {QuestionNode} node 
     * @param {boolean} state 
     * @returns 
     */
    setUserInput(node, state, matrixId) {
        if (!(node instanceof QuestionNode)) { return; }
        let key = node.uid + '_' + (matrixId ? matrixId : '');
        this.setFlag(FLAG_USER_INPUT, key, state);
    }

    /**
     * Flag all questions as having user input.
     */
    setUserInputAll() {
        this.setFlag(FLAG_USER_INPUT, FLAG_USER_INPUT_ALL, true);
    }

    /**
     * Check if node is flagged as having user input.
     * @param {BaseNode} node 
     * @param {string} matrixId
     * @returns {boolean}
     */
    hasInput(node, matrixId) {
        if (!(node instanceof QuestionNode)) { return false; }
        let key = node.uid + '_' + (matrixId ? matrixId : '');
        if (this.hasFlag(FLAG_USER_INPUT, key)) { return true; }
        if (this.hasFlag(FLAG_USER_INPUT, FLAG_USER_INPUT_ALL)) { return true; }
        return this.saveCount > 0 || this.getQuestionAnswers(node, matrixId).length > 0;
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
     * @return {UserData}
     */
    static importJSON(data) {
        let u = new UserData(data.id);
        for (let quid in data.answers) {
            u.answers[quid] = data.answers[quid];
        }
        u.saveCount = data?.save_count ? data.save_count : 0;
        u.extra = data?.extra ? data.extra : {};
        u.valid = data?.valid ? data.valid : false;
        u.loaded = true;
        return u
    }

}
