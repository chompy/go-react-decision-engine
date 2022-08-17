import React from 'react';
import { Tokenizer } from 'react-typeahead';
import BackendAPI from '../../api';
import { MSG_TYPEAHEAD_PLACEHOLDER } from '../../config';
import AnswerNode from '../../nodes/answer';
import QuestionNode from '../../nodes/question';

export default class TypeaheadComponent extends React.Component {

    constructor(props) {
        super(props);
        this.id = props?.id;
        this.version = props?.version;
        this.state = {
            loaded: false,
            items: [],
            value: props?.value ? props.value : []
        }
        this.onChange = props?.onChange;
        this.onTokenAdd = this.onTokenAdd.bind(this);
        this.onTokenRemove = this.onTokenRemove.bind(this);
        this.onTypeaheadResponse = this.onTypeaheadResponse.bind(this);
    }

    /**
     * {@inheritDoc}
     */
    componentDidMount() {
        if (this.id) {
            BackendAPI.get(
                'tree/typeahead', {id: this.id, version: this.version},
                this.onTypeaheadResponse
            );
            return;
        }
        this.setState({loaded: true});
    }

    /**
     * @param {Object} res 
     */
    onTypeaheadResponse(res) {
        if (!res.success) {
            console.error('> ERROR: ' + res.message, res);    
            return;
        }
        let items = this.generateTokens(res.data);
        let value = [];
        for (let i in this.state.value) {
            if (this.state.value[i] in items) {
                value.push(this.state.value[i]);
            }
        }
        this.setState({loaded: true, items: items, value: value});
    }

    /**
     * @param {Array} items 
     * @returns {Object}
     */
    generateTokens(items) {
        let out = {}
        for (let i in items) {
            let item = items[i];
            if (item.type != QuestionNode.getTypeName() && item.type != AnswerNode.getTypeName()) {
                continue;
            }
            let parents = [];
            let currentParent = item.parent;
            while (currentParent) {
                for (let j in items) {
                    let parentItem = items[j];
                    if (parentItem.uid == currentParent) {
                        parents.push(parentItem);
                        currentParent = parentItem.parent;
                        break;
                    }
                }
            }
            let label = (parents.length >= 2 ? parents[1].label + ' > ' : '') + 
                (parents.length >= 1 ? parents[0].label + ' > ' : '') +
                item.label
            ;
            out[item.uid] = '[v' + item.version + '] ' + label;
        }
        return out;
    }

    /**
     * @returns {Array}
     */
    getTokens() {
        if (!this.state.items) { return []; }
        return Object.values(this.state.items);
    }

    /**
     * @param {string} name
     * @return {string}
     */
    tokenToUid(name) {
        if (!this.state.items) { return null; }
        for (let k in this.state.items) {
            if (this.state.items[k] == name) {
                return k;
            }
        }
    }

    /**
     * @param {string} uid
     * @return {string}
     */
    uidToToken(uid) {
        if (!this.state.items) { return null; }
        return typeof this.state.items[uid] == 'undefined' ? '' : this.state.items[uid];
    }

    /**
     * @param {string} token 
     */
    onTokenAdd(token) {
        let uid = this.tokenToUid(token);
        if (!uid) { return; }
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
        if (!this.state.loaded) { return null; }
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