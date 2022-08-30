import {lua, lauxlib, lualib, to_luastring} from 'fengari-web';
import RuleFormField, { RULE_FIELD_ANSWER, RULE_FIELD_NODE, RULE_FIELD_CHOICE } from './rule_field';
import AnswerNode from './nodes/answer';
import QuestionNode from './nodes/question';
import BaseNode from './nodes/base';
import RuleNode from './nodes/rule';
import UserData from './user_data';
import RuleTemplateCollector from './rule_template_collector';

const LUA_METATABLE = 'DecisionNodeMT';

/**
 * LUA API
 * GLOBALS
 *  this        - Function, returns DecisionNodeMT representing rule being evaluated.
 *  parent      - Function, returns DecisionNodeMT representing parent of the rule being evaluated.
 *  root        - Function, returns DecisionNodeMT representing root node.
 *  find        - Function, returns DecisionNodeMT of given uid by searching all available sources (root and previous).
 *  print       - Function, prints first argument to console, mostly for debugging.
 *  has         - Function, returns true if given string is uid for either a question that has one or more answers or a user provided answer.
 *  get         - Function, returns list of uid and user inputted text answers for question of given uid.
 *  value       - Function, returns answer value for given answer uid.
 *  field       - Function, define a form field for custom rule variable and return its value.
 *  saveCount   - Function, returns number of saves.
 *  getExtra    - Function, returns user data 'extra' value as a Lua table.
 * 
 * DecisionNodeMT
 *  uid         - Function, returns decision node uid.
 *  parent      - Function, returns DecisionNodeMT representing parent node.
 *  children    - Function, returns Lua table containing multiple DecisionNodeMT representing child nodes.
 *  getChild    - Function, given uid of a child return DecisionNodeMT representing the child node.
 *  name        - Function, returns name of decision node.
 *  value       - Function, returns the value of an answer node.
 *  type        - Function, returns the type name of the decision node.
 *  param       - Function, returns given parameter of the decision node.
 *  answers     - Function, returns Lua table containing answers to question, both strings and DecisionNodeMT can be items in table.
 *  answerValues- Function, returns Lua table containing answer values to question, this is user inputted answers and the 'value' parameter of answer nodes.
 *  hasAnswer   - Function, returns true if given answer is in user data or given question contains an answer in user data.
 */
export default class RuleEngine {

    constructor() {
        this.root = null;
        this.nodes = [];
        this.rule = null;
        this.parent = null;
        this.matrixId = '';
        this.userData = null;
        this.fields = [];
        this.fieldValues = {};
        this.L = lauxlib.luaL_newstate();
        lualib.luaL_openlibs(this.L);
        this.luaRegisterDecisionNode();
        let funcs = {
            'this' : this.luaThis,
            'root' : this.luaRoot,
            'parent' : this.luaParent,
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
     * Set top level node for use with rule evaluation.
     * @param {BaseNode} node 
     */
    setRootNode(node) {
        this.root = null;
        if (node instanceof BaseNode) {
            this.root = node;
        }
    }

    /**
     * Set user data.
     * @param {UserData} userData 
     */
    setUserData(userData) {
        this.userData = null;
        if (userData instanceof UserData) {
            this.userData = userData;
        }
    }

    /**
     * Set rule node, load lua script.
     * @param {RuleNode} node 
     */
    setRuleNode(node) {
        this.rule = null;
        if (node instanceof RuleNode) {
            this.rule = node;
            this.fieldValues = this.rule.getRuleFieldValues();
        }
        this.parent = null;
        if (this.root) {
            this.parent = this.rule.getParent(this.root);
        }
        if (this.rule.getTemplateId()) {
            let script = RuleTemplateCollector.getScript(this.rule.getTemplateId());
            if (script) {
                let err = lauxlib.luaL_loadstring(this.L, to_luastring(script));
                if (err != 0) {
                    let errMsg = '(unknown)';
                    if (err > 0) {
                        errMsg = lua.lua_tojsstring(this.L, -1);
                    }
                    throw new {
                        number: err, 
                        message: errMsg, 
                        rule: this.rule
                    };
                }
                lua.lua_setglobal(this.L, '_rule_func');
                try {
                    this.evaluate();
                } catch (e) {
                    console.warn('RULE ENGINE: Rule "' + this.rule.uid + '" threw an error.', e);
                    
                }
            }
        }
    }

    /**
     * Evaluate a rule.
     * @returns {Object}
     */
    evaluate() {
        let script = this.rule && this.rule.getTemplateId() ? RuleTemplateCollector.getScript(this.rule.getTemplateId()) : null;
        if (!this.rule || !script) {
            return {
                results: false,
                message: 'No rule provided or empty script.',
                rule: null,
                matrixId: this.matrixId,
                parent: this.parent
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
            throw {
                number: err, 
                message: errMsg, 
                rule: this.rule
            };
        } else if (err == -1) {
            //console.warn('RULE ENGINE: Rule "' + this.rule.uid + '" evaluated with -1 error code.');
            return {
                results: true,
                message: '',
                rule: this.rule,
                matrixId: this.matrixId,
                parent: this.parent
            };
        }
        let res = lua.lua_toboolean(this.L, 1);
        let message = lua.lua_tojsstring(this.L, 2);
        return {
            results: res,
            message: !res ? (message ? message : (res ? '' : 'This field is invalid.')) : '',
            rule: this.rule,
            matrixId: this.matrixId,
            parent: this.parent,
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
            uid = data.node.uid;
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
        if (this.nodes.length > 0) {
            for (let i in this.nodes) {
                let node = this.nodes[i].getChild(uid);
                if (node) {
                    hidden = this.userData.isHidden(node, this.nodes[i]);
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
        let node = this.root.getChild(uid);
        if (!node || !(node instanceof AnswerNode)) {
            return 0;
        }
        lua.lua_pushstring(L, to_luastring(node.value));
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
            case RULE_FIELD_NODE: {
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
                    case RULE_FIELD_NODE: {
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
        data.node = this.root;
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
        data.node = this.rule;
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
        data.node = this.parent;
        lauxlib.luaL_setmetatable(L, LUA_METATABLE);
        return 1;
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
        let node = null;
        node = this.root.getChild(uid);
        if (!node) {
            for (let i in this.nodes) {
                let node = this.nodes[i].getChild(uid);
                if (node) {
                    break;
                }
            }
        }
        if (node) {
            let data = lua.lua_newuserdata(L);
            data.node = node;
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
     * Register lua 'DecisionNodeMT.'
     */
    luaRegisterDecisionNode() {
        lauxlib.luaL_newmetatable(this.L, to_luastring(LUA_METATABLE));
        lua.lua_pushvalue(this.L, -1);
        lua.lua_setfield(this.L, -2, '__index');
        // uid
        lua.lua_pushjsfunction(this.L, this.luaNodeUid);
        lua.lua_setfield(this.L, -2, 'uid');
        // parent
        this.luaNodeParent = this.luaNodeParent.bind(this);
        lua.lua_pushjsfunction(this.L, this.luaNodeParent);
        lua.lua_setfield(this.L, -2, 'parent');
        // children
        lua.lua_pushjsfunction(this.L, this.luaNodeChildren);
        lua.lua_setfield(this.L, -2, 'children');
        // getChild
        lua.lua_pushjsfunction(this.L, this.luaNodeGetChild);
        lua.lua_setfield(this.L, -2, 'getChild');
        // name
        lua.lua_pushjsfunction(this.L, this.luaNodeName);
        lua.lua_setfield(this.L, -2, 'name');
        // value
        lua.lua_pushjsfunction(this.L, this.luaNodeValue);
        lua.lua_setfield(this.L, -2, 'value');
        // type
        lua.lua_pushjsfunction(this.L, this.luaNodeType);
        lua.lua_setfield(this.L, -2, 'type');
        // param
        lua.lua_pushjsfunction(this.L, this.luaNodeParam);
        lua.lua_setfield(this.L, -2, 'param');
        // answers
        this.luaNodeAnswers = this.luaNodeAnswers.bind(this);
        lua.lua_pushjsfunction(this.L, this.luaNodeAnswers);
        lua.lua_setfield(this.L, -2, 'answers');
        // answerValues
        this.luaNodeAnswerValues = this.luaNodeAnswerValues.bind(this);
        lua.lua_pushjsfunction(this.L, this.luaNodeAnswerValues);
        lua.lua_setfield(this.L, -2, 'answerValues');
        // hasAnswer
        this.luaNodeHasAnswer = this.luaNodeHasAnswer.bind(this);
        lua.lua_pushjsfunction(this.L, this.luaNodeHasAnswer);
        lua.lua_setfield(this.L, -2, 'hasAnswer');
    }

    /**
     * Lua function 'DecisionNodeMT:uid.'
     * @param {*} L 
     * @returns {int}
     */
    luaNodeUid(L) {
        let data = lua.lua_touserdata(L, 1);
        lua.lua_pushstring(L, to_luastring(data.node.uid));
        return 1;
    }

    /**
     * Lua function 'DecisionNodeMT:name.'
     * @param {*} L 
     * @returns {int}
     */
    luaNodeName(L) {
        let data = lua.lua_touserdata(L, 1);
        lua.lua_pushstring(L, to_luastring(data.node.getName()));
        return 1;
    }

    /**
     * Lua function 'DecisionNodeMT:value.'
     * @param {*} L 
     * @returns {int}
     */
    luaNodeValue(L) {
        let data = lua.lua_touserdata(L, 1);
        if (data.node instanceof DecisionAnswer) {
            lua.lua_pushstring(L, to_luastring(data.node.value));
            return 1;
        }
        console.warn(
            'RULE ENGINE: Lua \'DecisionNodeMT:value\' expected node of type ' + DecisionAnswer.getTypeName() +
            ' but got ' + data.node.constructor.getTypeName() + ' (uid=' + data.node.uid + ').'
        );
        return 0;
    }

    /**
     * Lua function 'DecisionNodeMT:type.'
     * @param {*} L 
     * @returns {int}
     */
    luaNodeType(L) {
        let data = lua.lua_touserdata(L, 1);
        lua.lua_pushstring(L, to_luastring(data.node.constructor.getTypeName()));
        return 1;
    }

    /**
     * Lua function 'DecisionNodeMT:param.'
     * @param {*} L 
     * @returns {int}
     */
     luaNodeParam(L) {
        let data = lua.lua_touserdata(L, 1);
        let name = lua.lua_tojsstring(L, 2);
        let value = null;
        if (typeof data.node[name] != 'undefined') {
            value = data.node[name];
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
     * Lua function 'DecisionNodeMT:answers.'
     * @param {*} L 
     * @returns {int}
     */
     luaNodeAnswers(L) {
        let data = lua.lua_touserdata(L, 1);
        if (data.node instanceof QuestionNode) {
            let matrixId = lua.lua_tojsstring(L, 2);
            if (!matrixId && (data.node.uid == this.rule.uid || (this.parent && data.node.uid == this.parent.uid))) {
               matrixId = this.matrixId;
            }
            let answers = this.userData.getQuestionAnswers(data.node, matrixId);
            lua.lua_createtable(L, 0, answers.length);
            for (let i in answers) {
                lua.lua_pushinteger(L, parseInt(i)+1);
                let answerNode = this.root.getChild(answers[i]);
                if (answerNode) {
                    let answerData = lua.lua_newuserdata(L);
                    answerData.node = answerNode;
                    lauxlib.luaL_setmetatable(L, LUA_METATABLE);
                    lua.lua_settable(L, -3);
                    continue;
                }
                lua.lua_pushstring(L, to_luastring(answers[i]));
                lua.lua_settable(L, -3);
            }
            return 1;
        }
        console.warn(
            'RULE ENGINE: Lua \'DecisionNodeMT:answers\' expected node of type ' + QuestionNode.getTypeName() +
            ' but got ' + data.node.constructor.getTypeName() + ' (uid=' + data.node.uid + ').'
        );
        return 0;
    }

    /**
     * Lua function 'DecisionNodeMT:answerValues.'
     * @param {*} L 
     * @returns {int}
     */
     luaNodeAnswerValues(L) {
        let data = lua.lua_touserdata(L, 1);
        if (data.node instanceof QuestionNode) {
            let matrixId = lua.lua_tojsstring(L, 2);
            if (!matrixId && (data.node.uid == this.rule.uid || (this.parent && data.node.uid == this.parent.uid))) {
               matrixId = this.matrixId;
            }
            let answers = this.userData.getQuestionAnswers(data.node, matrixId);
            lua.lua_createtable(L, 0, answers.length);
            for (let i in answers) {
                lua.lua_pushinteger(L, parseInt(i)+1);
                let answerNode = this.root.getChild(answers[i]);
                if (answerNode) {
                    lua.lua_pushstring(L, to_luastring(answerNode.value));
                    lua.lua_settable(L, -3);
                    continue;
                }
                lua.lua_pushstring(L, to_luastring(answers[i]));
                lua.lua_settable(L, -3);
            }
            return 1;
        }
        console.warn(
            'RULE ENGINE: Lua \'DecisionNodeMT:answerValues\' expected node of type ' + QuestionNode.getTypeName() +
            ' but got ' + data.node.constructor.getTypeName() + ' (uid=' + data.node.uid + ').'
        );
        return 0;
    }

    /**
     * Lua function 'DecisionNodeMT:hasAnswer.'
     * @param {*} L 
     * @returns {int}
     */    
    luaNodeHasAnswer(L) {
        let data = lua.lua_touserdata(L, 1);
        for (let i in this.node) {
            if (this.userData.isHidden(data.node, this.nodes[i])) {
                lua.lua_pushboolean(L, this.userData.hasAnswer(data.node));    
                return 1;
            }
        }
        if (data.node instanceof AnswerNode) {
            lua.lua_pushboolean(L, this.userData.hasAnswer(data.node));
            return 1;
        } else if (data.node instanceof QuestionNode) {
            let matrixId = lua.lua_tojsstring(L, 2);
            if (!matrixId && (data.node.uid == this.rule.uid || (this.parent && data.node.uid == this.parent.uid))) {
               matrixId = this.matrixId;
            }
            lua.lua_pushboolean(L, this.userData.getQuestionAnswers(data.node, matrixId).length > 0);
            return 1;
        }
        console.warn(
            'RULE ENGINE: Lua \'DecisionNodeMT:value\' expected node of type ' + AnswerNode.getTypeName() +
            ' or ' + QuestionNode.getTypeName() + ' but got ' + data.node.constructor.getTypeName() + ' (uid=' + data.node.uid + ').'
        );
        return 0;
    }

    /**
     * Lua function 'DecisionNodeMT:parent.'
     * @param {*} L 
     * @returns {int}
     */
    luaNodeParent(L) {
        let data = lua.lua_touserdata(L, 1);
        let parent = data.node.getParent(this.root);
        if (!parent) {
            lua.lua_pushnil(L);
            return 1;
        }
        let parentData = lua.lua_newuserdata(L);
        parentData.node = parent;
        lauxlib.luaL_setmetatable(L, LUA_METATABLE);
        return 1;
    }

    /**
     * Lua function 'DecisionNodeMT:children.'
     * @param {*} L 
     * @returns {int}
     */
    luaNodeChildren(L) {
        let data = lua.lua_touserdata(L, 1);
        lua.lua_createtable(L, 0, data.node.children.length);
        for (let i in data.node.children) {
            let child = data.node.children[i];
            lua.lua_pushinteger(L, parseInt(i)+1);
            let childData = lua.lua_newuserdata(L);
            childData.node = child;
            lauxlib.luaL_setmetatable(L, LUA_METATABLE);
            lua.lua_settable(L, -3);
        }
        return 1;
    }

    /**
     * Lua function 'DecisionNodeMT:getChild.'
     * @param {*} L 
     * @returns {int}
     */
     luaNodeGetChild(L) {
        let data = lua.lua_touserdata(L, 1);
        let uid = lua.lua_tojsstring(L, 2);
        if (uid == '') {
            return 0;
        }
        let child = data.node.getChild(uid);
        if (!child) {
            return 0;
        }
        let childData = lua.lua_newuserdata(L);
        childData.node = child;
        lauxlib.luaL_setmetatable(L, LUA_METATABLE);
        return 1;
    }

}