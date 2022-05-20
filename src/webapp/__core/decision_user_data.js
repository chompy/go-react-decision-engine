import DecisionQuestion from './decision_objects/question.js'
import DecisionAnswer from './decision_objects/answer.js'
import DecisionBase from './decision_objects/base.js';

/**
 * User specific decision engine data. Contains answers
 * to questions.
 */
export default class DecisionUserData {

    constructor(key) {
        this.key = key;
        this.objects = {};
        this.answers = {};
        this.hidden = [];
        this.saveCount = 0;
        this.submitCount = 0;
        this.valid = true;
        this.questionValidationMessages = {};
        this.loaded = false;
        this.extra = {};
    }

    /**
     * Convert answer to string.
     * @param {DecisionQuestion} question
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
            question instanceof DecisionQuestion && 
            answer instanceof DecisionAnswer
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
     * @param {DecisionQuestion} question 
     * @param {*} answer
     * @param {string} matrixId
     */
    addAnswer(question, answer, matrixId) {
        if (!question || !(question instanceof DecisionQuestion)) {
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
        let uid = (question instanceof DecisionQuestion) ? question.uid : question;
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
     * @param {DecisionQuestion} question 
     * @param {string} matrixId
     */
    resetAnswers(question, matrixId) {
        if (!(question instanceof DecisionQuestion)) {
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
        if (question instanceof DecisionQuestion) {
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
        if (answer instanceof DecisionAnswer) {
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
        if (obj instanceof DecisionQuestion) {
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
     * Given an object uid get the version hash needed for this user data.
     * @param {string} uid 
     * @return {string}
     */
    getObjectVersionHash(uid) {
        if (!(uid in this.objects)) {
            return null;
        }
        if (typeof this.objects[uid] == 'string') {
            return this.objects[uid];
        }
        return this.objects[uid][1];
    }

    /**
     * Given an object uid get the version number needed for this user data.
     * @param {string} uid 
     * @return {int}
     */
    getObjectVersion(uid) {
        if (!(uid in this.objects)) {
            return null;
        }
        if (typeof this.objects[uid] == 'string') {
            return null;
        }
        return this.objects[uid][0];
    }

    /**
     * Add object with version to user data.
     * @param {DecisionBase} obj 
     */
    addObject(obj) {
        this.objects[obj.uid] = [obj.version, ''];
    }

    /**
     * Flag object as hidden.
     * @param {DecisionBase} obj 
     * @param {boolean} state 
     * @returns 
     */
    setHidden(obj, state, matrixId) {
        if (!(obj instanceof DecisionBase)) {
            return;
        }
        let key = obj.uid + '_' + (matrixId ? matrixId : '');
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
     * Check if object is flagged as hidden.
     * @param {DecisionBase} obj 
     * @param {DecisionBase} root
     * @param {string} matrixId
     * @returns {boolean}
     */
    isHidden(obj, root, matrixId) {
        if (!(obj instanceof DecisionBase)) {
            return false;
        }
        let key = obj.uid + '_' + (matrixId ? matrixId : '');
        if (this.hidden.indexOf(key) != -1) {
            return true;
        }
        if (root && root instanceof DecisionBase) {
            let parent = obj;
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
     * @param {DecisionQuestion} question 
     * @param {string} matrixId
     */
    resetValidationState(question, matrixId) {
        if (!(question instanceof DecisionQuestion)) {
            return;
        }
        this.questionValidationMessages[question.uid + '_' + (matrixId ? matrixId : '')] = [];
    }

    /**
     * @param {DecisionQuestion} question 
     * @param {string} message 
     * @param {string} matrixId
     */
    addValidationMessage(question, message, matrixId) {
        if (!(question instanceof DecisionQuestion) || !message.trim()) {
            return;
        }
        let key = question.uid + '_' + (matrixId ? matrixId : '');
        if (!(key in this.questionValidationMessages)) {
            this.questionValidationMessages[key] = [];
        }
        this.questionValidationMessages[key].push(message.trim());
    }

    /**
     * @param {DecisionQuestion} question 
     * @param {string} matrixId
     * @returns {Array}
     */
    getValidationMessages(question, matrixId) {
        if (!(question instanceof DecisionQuestion)) {
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
            'user_key' : this.key,
            'objects' : this.objects,
            'answers' : this.answers,
            'save_count' : this.saveCount,
            'submit_count' : this.submitCount,
            'valid' : this.valid,
            'extra' : this.extra
        };
    }

    /**
     * Build user data from object.
     * @param {object} data 
     * @return {DecisionUserData}
     */
    static importJSON(data) {
        let u = new DecisionUserData(data.user_key);
        for (let ouid in data.objects) {
            u.objects[ouid] = data.objects[ouid];
        }
        for (let quid in data.answers) {
            u.answers[quid] = data.answers[quid];
        }
        u.saveCount = typeof data.save_count != 'undefined' ? data.save_count : 1;
        u.submitCount = typeof data.submit_count != 'undefined' ? data.submit_count : 0;
        u.valid = typeof data.valid != 'undefined' ? data.valid : true;
        u.loaded = true;
        u.extra = typeof data.extra != 'undefined' ? data.extra : {};
        return u
    }

}
