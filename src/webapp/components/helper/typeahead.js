import React from 'react';
import { Tokenizer } from 'react-typeahead';
import { MSG_TYPEAHEAD_PLACEHOLDER } from '../../config';
import AnswerNode from '../../nodes/answer';
import QuestionNode from '../../nodes/question';

export default class TypeaheadComponent extends React.Component {

    constructor(props) {
        super(props);
        this.root = props?.root;
        this.state = {
            value: props?.value ? props.value : []
        }
        this.onChange = props?.onChange;
        this.onTokenAdd = this.onTokenAdd.bind(this);
        this.onTokenRemove = this.onTokenRemove.bind(this);
    }

    /**
     * @returns {Array}
     */
    getTokens() {
        if (!this.root) {
            return [];
        }
        let ittChildren = function (node, labels) {
            let out = [];
            for (let i in node.children) {
                let child = node.children[i];
                if (child instanceof AnswerNode || child instanceof QuestionNode) {
                    let name = '';
                    if (labels.length-2 >= 0) {
                        name += labels[labels.length-2] + ' > ';
                    }
                    name += labels[labels.length-1] + ' > ' + child.getName();
                    out.push(name);
                }
                out = out.concat(ittChildren(child, labels.concat(child.getName())));
            }
            return out;
        };
        let out = ittChildren(this.root, []);
        return out;
    }

    /**
     * @param {string} name
     * @return {string}
     */
    tokenToUid(name) {
        if (!this.root) {
            return null;
        }
        let ittChildren = function (node, labels, match) {
            for (let i in node.children) {
                let child = node.children[i];
                if (child instanceof AnswerNode || child instanceof QuestionNode) {
                    let name = '';
                    if (labels.length-2 >= 0) {
                        name += labels[labels.length-2] + ' > ';
                    }
                    name += labels[labels.length-1] + ' > ' + child.getName();
                    if (name == match) {
                        return child.uid;
                    }
                }
                let res = ittChildren(child, labels.concat(child.getName()), match);
                if (res) {
                    return res;
                }
            }
            return null;
        };
        return ittChildren(this.root, [], name);
    }

    /**
     * @param {string} uid
     * @return {string}
     */
    uidToToken(uid) {
        if (!this.root) {
            return null;
        }
        let ittChildren = function (node, labels, uid) {
            for (let i in node.children) {
                let child = node.children[i];
                if (child instanceof AnswerNode || child instanceof QuestionNode) {
                    if (uid == child.uid) {
                        let name = '';
                        if (labels.length-2 >= 0) {
                            name += labels[labels.length-2] + ' > ';
                        }
                        name += labels[labels.length-1] + ' > ' + child.getName();
                        return name;
                    }
                }
                let res = ittChildren(child, labels.concat(child.getName()), uid);
                if (res) {
                    return res;
                }
            }
            return null;
        };
        return ittChildren(this.root, [], uid);
    }

    /**
     * @param {string} token 
     */
    onTokenAdd(token) {
        let uid = this.tokenToUid(token);
        if (!uid) {
            return;
        }
        this.setState(function(state, props) {
            let newValue = [ ...state.value, uid];
            if (this.onChange) {
                this.onChange(newValue);
            }
            return {
                value: newValue
            };
        });
    }

    /**
     * @param {string} token 
     */
    onTokenRemove(token) {
        let uid = this.tokenToUid(token);
        this.setState(function(state, props) {
            let values = [];
            for (let i in state.value) {
                if (state.value[i] != uid) {
                    values.push(state.value[i]);
                }
            }
            if (this.onChange) {
                this.onChange(values);
            }
            return {
                value: values
            };
        });
    }

    render() {
        let values = [];
        if (this.state.value && this.state.value.length > 0) {
            for (let i in this.state.value) {
                let name = this.uidToToken(this.state.value[i]);
                if (name) { values.push(name); }
            }
        }
        return <div className='helper typeahead'><Tokenizer
            options={this.getTokens()}
            onTokenAdd={this.onTokenAdd}
            onTokenRemove={this.onTokenRemove}
            defaultSelected={values}
            maxVisible={10}
            placeholder={MSG_TYPEAHEAD_PLACEHOLDER}
        /></div>;
    }

}