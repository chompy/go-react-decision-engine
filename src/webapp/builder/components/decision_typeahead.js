import React from 'react';
import { Tokenizer } from 'react-typeahead';
import DecisionAnswer from '../../core/decision_objects/answer';
import DecisionQuestion from '../../core/decision_objects/question';

export default class DecisionTypeaheadComponent extends React.Component {

    constructor(props) {
        super(props);
        this.root = typeof props.root != 'undefined' ? props.root : null;
        this.state = {
            value: typeof props.value != 'undefined' && props.value ? props.value : []
        }
        this.onChange = typeof props.onChange != 'undefined' ? props.onChange : null;
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
        let ittChildren = function (obj, labels) {
            let out = [];
            for (let i in obj.children) {
                let child = obj.children[i];
                if (child instanceof DecisionAnswer || child instanceof DecisionQuestion) {
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
        let ittChildren = function (obj, labels, match) {
            for (let i in obj.children) {
                let child = obj.children[i];
                if (child instanceof DecisionAnswer || child instanceof DecisionQuestion) {
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
        let ittChildren = function (obj, labels, uid) {
            for (let i in obj.children) {
                let child = obj.children[i];
                if (child instanceof DecisionAnswer || child instanceof DecisionQuestion) {
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
                values.push(name);
            }
        }
        return <Tokenizer
            options={this.getTokens()}
            onTokenAdd={this.onTokenAdd}
            onTokenRemove={this.onTokenRemove}
            defaultSelected={values}
            maxVisible={10}
        />;
    }

}