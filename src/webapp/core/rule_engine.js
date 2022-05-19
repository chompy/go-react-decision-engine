import {lua, lauxlib, lualib, to_luastring} from 'fengari-web';
import DecisionAnswer from './decision_objects/answer';
import DecisionBase from './decision_objects/base';
import DecisionQuestion from './decision_objects/question';
import DecisionRoot from './decision_objects/root';
import DecisionRule from './decision_objects/rule';
import DecisionUserData from './decision_user_data';
import RuleError from './rule_error';
import RuleFormField, { RULE_FIELD_ANSWER, RULE_FIELD_OBJECT, RULE_FIELD_CHOICE } from './rule_field';

const LUA_METATABLE = 'DecisionObjectMT';

/**
 * LUA API
 * GLOBALS
 *  this        - Function, returns DecisionObjectMT representing rule being evaluated.
 *  parent      - Function, returns DecisionObjectMT representing parent of the rule being evaluated.
 *  root        - Function, returns DecisionObjectMT representing root object.
 *  previous    - Function, returns DecisionObjectMT representing previous decision tree in chain.
 *  find        - Function, returns DecisionObjectMT of given uid by searching all available sources (root and previous).
 *  print       - Function, prints first argument to console, mostly for debugging.
 *  has         - Function, returns true if given string is uid for either a question that has one or more answers or a user provided answer.
 *  get         - Function, returns list of uid and user inputted text answers for question of given uid.
 *  value       - Function, returns answer value for given answer uid.
 *  field       - Function, define a form field for custom rule variable and return its value.
 *  saveCount   - Function, returns number of saves.
 *  getExtra    - Function, returns user data 'extra' value as a Lua table.
 * 
 * DecisionObjectMT
 *  uid         - Function, returns decision object uid.
 *  parent      - Function, returns DecisionObjectMT representing parent object.
 *  children    - Function, returns Lua table containing multiple DecisionObjectMT representing child objects.
 *  getChild    - Function, given uid of a child return DecisionObjectMT representing the child object.
 *  previous    - Function. returns DecisionObjectMT representing previous decision tree in chain.
 *  name        - Function, returns name of decision object.
 *  value       - Function, returns the value of an answer object.
 *  type        - Function, returns the type name of the decision object.
 *  param       - Function, returns given parameter of the decision object.
 *  answers     - Function, returns Lua table containing answers to question, both strings and DecisionObjectMT can be items in table.
 *  answerValues- Function, returns Lua table containing answer values to question, this is user inputted answers and the 'value' parameter of answer objects.
 *  hasAnswer   - Function, returns true if given answer is in user data or given question contains an answer in user data.
 */
export default class RuleEngine {

    constructor() {
        this.root = null;
        this.objects = [];
        this.rule = null;
        this.parent = null;
        this.matrixId = '';
        this.userData = null;
        this.fields = [];
        this.fieldValues = {};
        this.L = lauxlib.luaL_newstate();
        lualib.luaL_openlibs(this.L);
        this.luaRegisterDecisionObject();
        let funcs = {
            'this' : this.luaThis,
            'root' : this.luaRoot,
            'parent' : this.luaParent,
            'previous' : this.luaPrevious,
            'find' : this.luaFind,
            'get' : this.luaGetAnswers,
            'has' : this.luaHasAnswer,
            'value' : this.luaGetAnswerValue,
            'print' : this.luaPrint,
            'field' : this.luaField,
            'saveCount' : this.luaSaveCount,
            'getExtra' : this.luaGetExtra
        };
        for (let name in funcs) {
            funcs[name] = funcs[name].bind(this);
            lua.lua_pushjsfunction(this.L, funcs[name]);
            lua.lua_setglobal(this.L, name);
        };
    }

    /**
     * Set top level object for use with rule evaluation.
     * @param {DecisionBase} obj 
     */
    setRootObject(obj) {
        this.root = null;
        if (obj instanceof DecisionBase) {
            this.root = obj;
        }
    }

    /**
     * Set user data.
     * @param {DecisionUserData} userData 
     */
    setUserData(userData) {
        this.userData = null;
        if (userData instanceof DecisionUserData) {
            this.userData = userData;
        }
    }

    /**
     * Set rule object, load lua script.
     * @param {DecisionRule} obj 
     */
    setRuleObject(obj) {
        this.rule = null;
        if (obj instanceof DecisionRule) {
            this.rule = obj;
            this.fieldValues = this.rule.getRuleFieldValues();
        }
        this.parent = null;
        if (this.root) {
            this.parent = this.rule.getParent(this.root);
        }
        let err = lauxlib.luaL_loadstring(this.L, to_luastring(this.rule.getScript()));
        if (err != 0) {
            let errMsg = '(unknown)';
            if (err > 0) {
                errMsg = lua.lua_tojsstring(this.L, -1);
            }
            throw new RuleError(err, errMsg, this.rule);
        }
        lua.lua_setglobal(this.L, '_rule_func');
        this.evaluate(); 
    }

    /**
     * Evaluate a rule.
     * @param {DecisionRule} rule 
     * @returns {Object}
     */
    evaluate() {
        if (!this.rule) {
            return {
                results: false,
                message: 'No rule provided.',
                rule: null,
                matrixId: this.matrixId,
                object: this.parent
            };
        }
        lua.lua_settop(this.L, 0);
        lua.lua_getglobal(this.L, '_rule_func');
        let err = lua.lua_pcall(this.L, 0, 2, 0)
        if (err > 0) {
            let errMsg = '(unknown)';
            if (err > 0) {
                errMsg = lua.lua_tojsstring(this.L, -1);
            }
            throw new RuleError(err, errMsg, this.rule);
        } else if (err == -1) {
            //console.warn('RULE ENGINE: Rule "' + this.rule.uid + '" evaluated with -1 error code.');
            return {
                results: true,
                message: '',
                rule: this.rule,
                matrixId: this.matrixId,
                object: this.parent
            };
        }
        let res = lua.lua_toboolean(this.L, 1);
        let message = lua.lua_tojsstring(this.L, 2);
        return {
            results: res,
            message: !res ? (message ? message : (res ? '' : 'This field is invalid.')) : '',
            rule: this.rule,
            matrixId: this.matrixId,
            object: this.parent,
            userData: this.userData
        };
    }

    /**
     * @param {*} L 
     * @returns {string}
     */
    luaFindUid(L) {
        let uid = '';
        if (lua.lua_isuserdata(L, 1)) {
            let data = lua.lua_touserdata(L, 1);
            uid = data.obj.uid;
        } else if (lua.lua_iscfunction(L, 1)) {
            let func = lua.lua_tocfunction(L, 1); 
            lua.lua_getglobal(L, 'this');
            let globalThis = lua.lua_tocfunction(L, -1);
            lua.lua_getglobal(L, 'parent');
            let globalParent = lua.lua_tocfunction(L, -1);
            if (func == globalThis) {
                uid = this.rule.uid;
            } else if (func == globalParent) {
                uid = this.parent.uid;
            }
        } else if (lua.lua_isstring(L, 1)) {
            uid = lua.lua_tojsstring(L, 1);
        }
        return uid;
    }

    /**
     * @param {*} L 
     * @returns {int}
     */
    luaHasAnswer(L) {
        if (!this.userData) {
            console.warn('RULE ENGINE: User data not defined.');
            return 0;
        }
        let uid = this.luaFindUid(L);
        if (uid == '') {
            console.warn('RULE ENGINE: Lua \'has\' uid not provided.');
            return 0;
        }
        // check if answer/question is hidden, if so then it should not have answer
        let hidden = false;
        if (this.objects.length > 0) {
            for (let i in this.objects) {
                let obj = this.objects[i].getChild(uid);
                if (obj) {
                    hidden = this.userData.isHidden(obj, this.objects[i]);
                }
            }
        }
        lua.lua_pushboolean(
            L, !hidden && (this.userData.hasAnswer(uid) || this.userData.getQuestionAnswers(uid).length > 0)
        );
        return 1;
    }

    /**
     * @param {*} L 
     * @returns {int}
     */
    luaGetAnswers(L) {
        if (!this.userData) {
            console.warn('RULE ENGINE: User data not defined.');
            return 0;
        }
        let uid = this.luaFindUid(L);
        if (uid == '') {
            console.warn('RULE ENGINE: Lua \'get\' uid not provided.');
            return 0;
        }
        let matrixId = lua.lua_tojsstring(L, 2);
        if (!matrixId && (uid == this.rule.uid || (this.parent && uid == this.parent.uid))) {
           matrixId = this.matrixId;
        }
        let answers = this.userData.getQuestionAnswers(uid, matrixId);
        lua.lua_createtable(L, 0, answers.length);
        for (let i in answers) {
            lua.lua_pushinteger(L, parseInt(i)+1);
            lua.lua_pushstring(L, to_luastring(answers[i]));
            lua.lua_settable(L, -3);
        }
        return 1;
    }

    /**
     * @param {*} L 
     * @returns {int}
     */
    luaGetAnswerValue(L) {
        if (!this.root) {
            return 0;
        }
        let uid = this.luaFindUid(L);
        if (uid == '') {
            console.warn('RULE ENGINE: Lua \'value\' uid not provided.');
            return 0;
        }
        let obj = this.root.getChild(uid);
        if (!obj || !(obj instanceof DecisionAnswer)) {
            return 0;
        }
        lua.lua_pushstring(L, to_luastring(obj.value));
        return 1;
    }

    /**
     * @param {*} L 
     * @returns {int}
     */
    luaPrint(L) {
        let value = null;
        if (lua.lua_isstring(L, 1)) {
            value = lua.lua_tojsstring(L, 1);
        } else if (lua.lua_isnumber(L, 1)) {
            value = lua.lua_tonumber(L, 1);
        } else if (lua.lua_isboolean(L, 1)) {
            value = lua.lua_toboolean(L, 1);
        } else if (lua.lua_istable(L, 1)) {
            value = {};
            lua.lua_pushnil(L);
            while (lua.lua_next(L, 1)) {
                let key = null;
                if (lua.lua_isnumber(L, -2)) {
                    key = lua.lua_tonumber(L, -2);
                } else if (lua.lua_isstring(L, -2)) {
                    key = lua.lua_tojsstring(L, -2);
                }
                if (key) {
                    let val = lua.lua_tojsstring(L, -1);
                    value[key] = val;
                }
                lua.lua_pop(L, 1);
            }
        }
        console.log('LUA PRINT', value);
        return 0;
    }

    /**
     * @param {*} L 
     * @returns {int}
     */
    luaField(L) {
        let name = lua.lua_tojsstring(L, 1);
        let fieldType = lua.lua_tojsstring(L, 2);
        let defaultValue = null;
        let options = {};
        switch (fieldType) {
            case RULE_FIELD_CHOICE: {
                defaultValue = lua.lua_tojsstring(L, 3);
                if (lua.lua_istable(L, 4)) {
                    lua.lua_pushnil(L);
                    while (lua.lua_next(L, 4)) {
                        let key = null;
                        if (lua.lua_isnumber(L, -2)) {
                            key = lua.lua_tonumber(L, -2);
                        } else if (lua.lua_isstring(L, -2)) {
                            key = lua.lua_tojsstring(L, -2);
                        }
                        if (key) {
                            let val = lua.lua_tojsstring(L, -1);
                            options[key] = val;
                        }
                        lua.lua_pop(L, 1);
                    }
                }
                break;
            }
            case RULE_FIELD_ANSWER:
            case RULE_FIELD_OBJECT: {
                // TODO
                defaultValue = [];
                break;
            }
            default: {
                defaultValue = lua.lua_tojsstring(L, 3);
                break;
            }
        }
        if (!name) {
            console.warn('RULE ENGINE: Lua \'field\' expects at least one argument, none provided.');
            return 0;
        }
        for (let i in this.fields) {
            if (this.fields[i].name == name) {
                this.fields[i].type = fieldType;
                if (!(name in this.fieldValues) || !this.fieldValues[name]) {
                    if (this.fields[i].default) {
                        lua.lua_pushstring(L, to_luastring(this.fields[i].default));
                        return 1;
                    }
                    lua.lua_pushnil(L);
                    return 1;
                }
                switch (this.fields[i].type) {
                    case RULE_FIELD_ANSWER:
                    case RULE_FIELD_OBJECT: {
                        lua.lua_createtable(L, 0, 
                            this.fieldValues ? this.fieldValues[name].length : 0
                        );
                        for (let j in this.fieldValues[name]) {
                            let value = this.fieldValues[name][j];
                            if (typeof value != 'string' && typeof value.uid != 'undefined') {
                                value = value.uid;
                            }
                            lua.lua_pushinteger(L, parseInt(j)+1);
                            lua.lua_pushstring(L, to_luastring(value));
                            lua.lua_settable(L, -3);
                        }
                        break;
                    }
                    default: {
                        lua.lua_pushstring(L, to_luastring(this.fieldValues[name]));
                        break;
                    }
                }
                return 1;
            }
        }
        let field = new RuleFormField(name);
        field.type = fieldType;
        field.default = defaultValue;
        field.rule = this.rule;
        field.root = this.root;
        field.options = options;
        this.fields.push(field);
        lua.lua_pushnil(L);
        return 1;
    }

    /**
     * @param {*} L 
     * @returns {int}
     */
    luaRoot(L) {
        if (!this.root) {
            return 0;
        }
        let data = lua.lua_newuserdata(L);
        data.obj = this.root;
        lauxlib.luaL_setmetatable(L, LUA_METATABLE);
        return 1;
    }

    /**
     * @param {*} L 
     * @returns {int}
     */
    luaThis(L) {
        if (!this.rule) {
            return 0;
        }
        let data = lua.lua_newuserdata(L);
        data.obj = this.rule;
        lauxlib.luaL_setmetatable(L, LUA_METATABLE);
        return 1;
    }

    /**
     * @param {*} L 
     * @returns {int}
     */
     luaParent(L) {
        if (!this.parent) {
            return 0;
        }
        let data = lua.lua_newuserdata(L);
        data.obj = this.parent;
        lauxlib.luaL_setmetatable(L, LUA_METATABLE);
        return 1;
    }

    /**
     * @param {*} L 
     * @returns {int}
     */
    luaPrevious(L) {
        if (!this.root) {
            return 0;
        }
        for (let i in this.objects) {
            if (this.objects[i] instanceof DecisionRoot && this.objects[i].next == this.root.uid) {
                let prevData = lua.lua_newuserdata(L);
                prevData.obj = this.objects[i];
                lauxlib.luaL_setmetatable(L, 'DecisionObjectMT');
                return 1;
            }
        }
        return 0;
    }

    /**
     * @param {*} L 
     * @returns {int}
     */
     luaFind(L) {
        let uid = this.luaFindUid(L);
        if (!uid || !this.root) {
            return 0;
        }
        let obj = null;
        obj = this.root.getChild(uid);
        if (!obj) {
            for (let i in this.objects) {
                let obj = this.objects[i].getChild(uid);
                if (obj) {
                    break;
                }
            }
        }
        if (obj) {
            let data = lua.lua_newuserdata(L);
            data.obj = obj;
            lauxlib.luaL_setmetatable(L, LUA_METATABLE);
            return 1;
        }
        return 0;
    }

    /**
     * @param {*} L 
     * @returns {int}
     */
    luaSaveCount(L) {
        lua.lua_pushinteger(L, this.userData ? this.userData.saveCount : 0);
        return 1; 
    }

    /**
     * @param {*} L 
     * @returns {int}
     */
    luaGetExtra(L) {
        lua.lua_createtable(L, 0, Object.keys(this.userData.extra).length);
        for (let key in this.userData.extra) {
            let value = this.userData.extra[key];
            lua.lua_pushstring(L, to_luastring(key));
            switch (typeof value) {
                case "boolean": {
                    lua.lua_pushboolean(L, value);
                    break;
                }
                case "number": {
                    lua.lua_pushnumber(L, value);
                    break;
                }
                default: {
                    lua.lua_pushstring(L, to_luastring(value));
                    break;
                }
            }
            lua.lua_settable(L, -3);
        }
        return 1;
    }

    /**
     * Register lua 'DecisionObjectMT.'
     */
    luaRegisterDecisionObject() {
        lauxlib.luaL_newmetatable(this.L, to_luastring(LUA_METATABLE));
        lua.lua_pushvalue(this.L, -1);
        lua.lua_setfield(this.L, -2, '__index');
        // uid
        lua.lua_pushjsfunction(this.L, this.luaObjUid);
        lua.lua_setfield(this.L, -2, 'uid');
        // parent
        this.luaObjParent = this.luaObjParent.bind(this);
        lua.lua_pushjsfunction(this.L, this.luaObjParent);
        lua.lua_setfield(this.L, -2, 'parent');
        // children
        lua.lua_pushjsfunction(this.L, this.luaObjChildren);
        lua.lua_setfield(this.L, -2, 'children');
        // getChild
        lua.lua_pushjsfunction(this.L, this.luaObjGetChild);
        lua.lua_setfield(this.L, -2, 'getChild');
        // previous
        this.luaObjPrevious = this.luaObjPrevious.bind(this);
        lua.lua_pushjsfunction(this.L, this.luaObjPrevious);
        lua.lua_setfield(this.L, -2, 'previous');
        // name
        lua.lua_pushjsfunction(this.L, this.luaObjName);
        lua.lua_setfield(this.L, -2, 'name');
        // value
        lua.lua_pushjsfunction(this.L, this.luaObjValue);
        lua.lua_setfield(this.L, -2, 'value');
        // type
        lua.lua_pushjsfunction(this.L, this.luaObjType);
        lua.lua_setfield(this.L, -2, 'type');
        // param
        lua.lua_pushjsfunction(this.L, this.luaObjParam);
        lua.lua_setfield(this.L, -2, 'param');
        // answers
        this.luaObjAnswers = this.luaObjAnswers.bind(this);
        lua.lua_pushjsfunction(this.L, this.luaObjAnswers);
        lua.lua_setfield(this.L, -2, 'answers');
        // answerValues
        this.luaObjAnswerValues = this.luaObjAnswerValues.bind(this);
        lua.lua_pushjsfunction(this.L, this.luaObjAnswerValues);
        lua.lua_setfield(this.L, -2, 'answerValues');
        // hasAnswer
        this.luaObjHasAnswer = this.luaObjHasAnswer.bind(this);
        lua.lua_pushjsfunction(this.L, this.luaObjHasAnswer);
        lua.lua_setfield(this.L, -2, 'hasAnswer');
    }

    /**
     * Lua function 'DecisionObjectMT:uid.'
     * @param {*} L 
     * @returns {int}
     */
    luaObjUid(L) {
        let data = lua.lua_touserdata(L, 1);
        lua.lua_pushstring(L, to_luastring(data.obj.uid));
        return 1;
    }

    /**
     * Lua function 'DecisionObjectMT:name.'
     * @param {*} L 
     * @returns {int}
     */
    luaObjName(L) {
        let data = lua.lua_touserdata(L, 1);
        lua.lua_pushstring(L, to_luastring(data.obj.getName()));
        return 1;
    }

    /**
     * Lua function 'DecisionObjectMT:value.'
     * @param {*} L 
     * @returns {int}
     */
    luaObjValue(L) {
        let data = lua.lua_touserdata(L, 1);
        if (data.obj instanceof DecisionAnswer) {
            lua.lua_pushstring(L, to_luastring(data.obj.value));
            return 1;
        }
        console.warn(
            'RULE ENGINE: Lua \'DecisionObjectMT:value\' expected object of type ' + DecisionAnswer.getTypeName() +
            ' but got ' + data.obj.constructor.getTypeName() + ' (uid=' + data.obj.uid + ').'
        );
        return 0;
    }

    /**
     * Lua function 'DecisionObjectMT:type.'
     * @param {*} L 
     * @returns {int}
     */
    luaObjType(L) {
        let data = lua.lua_touserdata(L, 1);
        lua.lua_pushstring(L, to_luastring(data.obj.constructor.getTypeName()));
        return 1;
    }

    /**
     * Lua function 'DecisionObjectMT:param.'
     * @param {*} L 
     * @returns {int}
     */
     luaObjParam(L) {
        let data = lua.lua_touserdata(L, 1);
        let name = lua.lua_tojsstring(L, 2);
        let value = null;
        if (typeof data.obj[name] != 'undefined') {
            value = data.obj[name];
        }
        if (!value) {
            lua.lua_pushnil(L);
            return 1;
        }
        if (!isNaN(value)) {
            lua.lua_pushnumber(L, value);
            return 1;
        }
        lua.lua_pushstring(L, to_luastring(value));
        return 1;
    }

    /**
     * Lua function 'DecisionObjectMT:answers.'
     * @param {*} L 
     * @returns {int}
     */
     luaObjAnswers(L) {
        let data = lua.lua_touserdata(L, 1);
        if (data.obj instanceof DecisionQuestion) {
            let matrixId = lua.lua_tojsstring(L, 2);
            if (!matrixId && (data.obj.uid == this.rule.uid || (this.parent && data.obj.uid == this.parent.uid))) {
               matrixId = this.matrixId;
            }
            let answers = this.userData.getQuestionAnswers(data.obj, matrixId);
            lua.lua_createtable(L, 0, answers.length);
            for (let i in answers) {
                lua.lua_pushinteger(L, parseInt(i)+1);
                let answerObj = this.root.getChild(answers[i]);
                if (answerObj) {
                    let answerData = lua.lua_newuserdata(L);
                    answerData.obj = answerObj;
                    lauxlib.luaL_setmetatable(L, 'DecisionObjectMT');
                    lua.lua_settable(L, -3);
                    continue;
                }
                lua.lua_pushstring(L, to_luastring(answers[i]));
                lua.lua_settable(L, -3);
            }
            return 1;
        }
        console.warn(
            'RULE ENGINE: Lua \'DecisionObjectMT:answers\' expected object of type ' + DecisionQuestion.getTypeName() +
            ' but got ' + data.obj.constructor.getTypeName() + ' (uid=' + data.obj.uid + ').'
        );
        return 0;
    }

    /**
     * Lua function 'DecisionObjectMT:answerValues.'
     * @param {*} L 
     * @returns {int}
     */
     luaObjAnswerValues(L) {
        let data = lua.lua_touserdata(L, 1);
        if (data.obj instanceof DecisionQuestion) {
            let matrixId = lua.lua_tojsstring(L, 2);
            if (!matrixId && (data.obj.uid == this.rule.uid || (this.parent && data.obj.uid == this.parent.uid))) {
               matrixId = this.matrixId;
            }
            let answers = this.userData.getQuestionAnswers(data.obj, matrixId);
            lua.lua_createtable(L, 0, answers.length);
            for (let i in answers) {
                lua.lua_pushinteger(L, parseInt(i)+1);
                let answerObj = this.root.getChild(answers[i]);
                if (answerObj) {
                    lua.lua_pushstring(L, to_luastring(answerObj.value));
                    lua.lua_settable(L, -3);
                    continue;
                }
                lua.lua_pushstring(L, to_luastring(answers[i]));
                lua.lua_settable(L, -3);
            }
            return 1;
        }
        console.warn(
            'RULE ENGINE: Lua \'DecisionObjectMT:answerValues\' expected object of type ' + DecisionQuestion.getTypeName() +
            ' but got ' + data.obj.constructor.getTypeName() + ' (uid=' + data.obj.uid + ').'
        );
        return 0;
    }

    /**
     * Lua function 'DecisionObjectMT:hasAnswer.'
     * @param {*} L 
     * @returns {int}
     */    
    luaObjHasAnswer(L) {
        let data = lua.lua_touserdata(L, 1);
        for (let i in this.objects) {
            if (this.userData.isHidden(data.obj, this.objects[i])) {
                lua.lua_pushboolean(L, this.userData.hasAnswer(data.obj));    
                return 1;
            }
        }
        if (data.obj instanceof DecisionAnswer) {
            lua.lua_pushboolean(L, this.userData.hasAnswer(data.obj));
            return 1;
        } else if (data.obj instanceof DecisionQuestion) {
            let matrixId = lua.lua_tojsstring(L, 2);
            if (!matrixId && (data.obj.uid == this.rule.uid || (this.parent && data.obj.uid == this.parent.uid))) {
               matrixId = this.matrixId;
            }
            lua.lua_pushboolean(L, this.userData.getQuestionAnswers(data.obj, matrixId).length > 0);
            return 1;
        }
        console.warn(
            'RULE ENGINE: Lua \'DecisionObjectMT:value\' expected object of type ' + DecisionAnswer.getTypeName() +
            ' or ' + DecisionQuestion.getTypeName() + ' but got ' + data.obj.constructor.getTypeName() + ' (uid=' + data.obj.uid + ').'
        );
        return 0;
    }

    /**
     * Lua function 'DecisionObjectMT:parent.'
     * @param {*} L 
     * @returns {int}
     */
    luaObjParent(L) {
        let data = lua.lua_touserdata(L, 1);
        let parent = data.obj.getParent(this.root);
        if (!parent) {
            lua.lua_pushnil(L);
            return 1;
        }
        let parentData = lua.lua_newuserdata(L);
        parentData.obj = parent;
        lauxlib.luaL_setmetatable(L, 'DecisionObjectMT');
        return 1;
    }

    /**
     * Lua function 'DecisionObjectMT:children.'
     * @param {*} L 
     * @returns {int}
     */
    luaObjChildren(L) {
        let data = lua.lua_touserdata(L, 1);
        lua.lua_createtable(L, 0, data.obj.children.length);
        for (let i in data.obj.children) {
            let child = data.obj.children[i];
            lua.lua_pushinteger(L, parseInt(i)+1);
            let childData = lua.lua_newuserdata(L);
            childData.obj = child;
            lauxlib.luaL_setmetatable(L, 'DecisionObjectMT');
            lua.lua_settable(L, -3);
        }
        return 1;
    }

    /**
     * Lua function 'DecisionObjectMT:getChild.'
     * @param {*} L 
     * @returns {int}
     */
     luaObjGetChild(L) {
        let data = lua.lua_touserdata(L, 1);
        let uid = lua.lua_tojsstring(L, 2);
        if (uid == '') {
            return 0;
        }
        let child = data.obj.getChild(uid);
        if (!child) {
            return 0;
        }
        let childData = lua.lua_newuserdata(L);
        childData.obj = child;
        lauxlib.luaL_setmetatable(L, 'DecisionObjectMT');
        return 1;
    }

    /**
     * Lua function 'DecisionObjectMT:previous.'
     * @param {*} L 
     * @returns {int}
     */
     luaObjPrevious(L) {
        let data = lua.lua_touserdata(L, 1);
        if (data.obj instanceof DecisionRoot) {
            for (let i in this.objects) {
                if (this.objects[i] instanceof DecisionRoot && this.objects[i].next == data.obj.uid) {
                    let prevData = lua.lua_newuserdata(L);
                    prevData.obj = this.objects[i];
                    lauxlib.luaL_setmetatable(L, 'DecisionObjectMT');
                    lua.lua_settable(L, -3);
                    return 1;
                }
            }
            return 0;
        }
        console.warn(
            'RULE ENGINE: Lua \'DecisionObjectMT:previous\' expected object of type ' + DecisionRoot.getTypeName() +
            ' but got ' + data.obj.constructor.getTypeName() + ' (uid=' + data.obj.uid + ').'
        );
        return 0;
    }

}