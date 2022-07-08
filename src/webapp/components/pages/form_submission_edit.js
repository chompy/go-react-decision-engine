import { faBackward, faForward } from '@fortawesome/free-solid-svg-icons';
import React from 'react';
import BackendAPI from '../../api';
import { BTN_BACK, BTN_NEXT, ERR_NOT_FOUND, TREE_FORM } from '../../config';
import JsonConverter from '../../converters/json';
import UserData from '../../user_data';
import TreeVersionInfoComponent from '../helper/tree_version_info';
import RootNodeComponent from '../nodes/root';
import BasePageComponent from './base';

export default class FormSubmissionEditPageComponent extends BasePageComponent {

    constructor(props) {
        super(props);
        this.userData = new UserData;
        this.state.root = null;
        this.state.version = null;
        this.state.tree = null;
        this.state.loading = true;
    }

    /**
     * {@inheritdoc}
     */
    static getName() {
        return 'form-submission-edit';
    }

    /**
     * {@inheritdoc}
     */
    onReady() {
        this.setState({loading: true});
        let formId = typeof this.props.path.id != 'undefined' ? this.props.path.id : null;
        if (!formId) {
            console.error('> ERROR: Missing ID parameter.')
            this.setState({error: ERR_NOT_FOUND});
            return;
        }
        BackendAPI.get('tree/fetch', {team: this.state.user.team, id: formId}, this.onTreeRootResponse);
        
    }

    /**
     * @param {Object} res 
     */
    onTreeRootResponse(res) {
        if (this.handleErrorResponse(res)) { return; }
        this.setState({ root: res.data });
        BackendAPI.get('tree/version/fetch', {team: this.state.user.team, id: res.data.id}, this.onTreeVersionResponse);
    }

    /**
     * @param {Object} res 
     */
    onTreeVersionResponse(res) {
        if (this.handleErrorResponse(res)) { return; }
        let js = new JsonConverter;
        let tree = js.import(res.data.tree);
        tree.type = TREE_FORM;
        this.setState({
            loading: false,
            version: res.data,
            tree: tree
        });
        this.setTitle(this.state.root.label);
    }

    /**
     * @param {Event} e 
     */
    onClickBack(e) {
        e.preventDefault();
        window.history.back();
    }

    render() {
        if (this.state.error) {
            return this.renderError();
        } else if (this.state.loading) {
            return this.renderLoader();
        }
        return <div className='page submission-edit'>
            <h1 className='title'>{this.state.root.label}</h1>
            <TreeVersionInfoComponent treeversion={this.state.version} showstate={false} />
            <div className='options top'>
                {this.renderCallbackButton(BTN_BACK, this.onClickBack, faBackward)}
            </div>
            <section>
                <RootNodeComponent node={this.state.tree} userData={this.userData} />
            </section>
        </div>;
    }

}