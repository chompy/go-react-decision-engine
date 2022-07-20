import { faBackward, faEye, faForward, faTrash } from '@fortawesome/free-solid-svg-icons';
import React from 'react';
import BackendAPI from '../../api';
import { BTN_BACK, BTN_DELETE, BTN_NEXT, BTN_VIEW, ERR_NOT_FOUND, MSG_DISPLAY_TIME, MSG_SAVED, MSG_SAVING, MSG_SUBMISSION_DELETED, TREE_FORM } from '../../config';
import JsonConverter from '../../converters/json';
import UserData from '../../user_data';
import TreeVersionInfoComponent from '../helper/tree_version_info';
import RootNodeComponent from '../nodes/root';
import BasePageComponent from './base';
import { message as msgPopup } from 'react-message-popup';
import DocumentViewListComponent from './document_view_list';

export default class FormSubmissionEditPageComponent extends BasePageComponent {

    constructor(props) {
        super(props);
        this.userData = null;
        this.state.submission = null;
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
        let submissionId = typeof this.props.path.id != 'undefined' ? this.props.path.id : null;
        if (!submissionId) {
            console.error('> ERROR: Missing ID parameter.')
            this.setState({error: ERR_NOT_FOUND});
            return;
        }
        BackendAPI.get('submission/fetch', {id: submissionId}, this.onSubmissionResponse);        
    }

    /**
     * 
     * @param {Object} res 
     */
    onSubmissionResponse(res) {
        if (this.handleErrorResponse(res)) { return; }
        this.userData = UserData.importJSON(res.data);
        this.setState({submission: res.data});
        BackendAPI.get(
            'tree/version/fetch', {id: res.data.form_id, version: res.data.form_version},
            this.onTreeVersionResponse
        );
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
            version: res.data,
            tree: tree
        });
        BackendAPI.get('tree/fetch', {id: res.data.root_id}, this.onTreeRootResponse)
    }

    /**
     * @param {Object} res 
     */
    onTreeRootResponse(res) {
        if (this.handleErrorResponse(res)) { return; }
        this.setState({ root: res.data, loading: false, });
        this.setTitle(this.state.root.label + ' (v' + this.state.version.version + ')');
    }

    /**
     * Fired when save is requested.
     */
    onSave() {
        this.msgLoadPromise = msgPopup.loading(MSG_SAVING, 10000);
        BackendAPI.post(
            'submission/store',
            null,
            {
                id: this.userData.id,
                form_id: this.state.version.root_id,
                form_version: this.state.version.version,
                answers: this.userData.answers,
                valid: this.userData.valid
            },
            this.onStoreResponse
        );
    }

    /**
     * @param {Object} res 
     */
    onStoreResponse(res) {
        if (this.msgLoadPromise) { this.msgLoadPromise.then(({destory}) => { destory(); } ); }
        if (this.handleErrorResponse(res)) { return; }
        msgPopup.success(MSG_SAVED, MSG_DISPLAY_TIME);
    }

    /**
     * @param {Event} e 
     */
    onClickBack(e) {
        e.preventDefault();
        this.onSave();
        window.history.back();
    }

    /**
     * @param {Event} e 
     */
    onClickDelete(e) {
        e.preventDefault();
        BackendAPI.post(
            'submission/delete', {}, {id: this.userData.id},
            this.onDeleteResponse
        );
    }

    /**
     * @param {Object} res 
     */
    onDeleteResponse(res) {
        if (this.msgLoadPromise) { this.msgLoadPromise.then(({destory}) => { destory(); } ); }
        if (this.handleErrorResponse(res)) { return; }
        msgPopup.success(MSG_SUBMISSION_DELETED, MSG_DISPLAY_TIME);
        window.history.back();
    }

    /**
     * @param {Event} e 
     */
    onClickView(e) {
        e.preventDefault();
        this.onSave();
        this.gotoPage(DocumentViewListComponent, {id: this.userData.id});
    }

    /**
     * {@inheritDoc}
     */
    render() {
        if (this.state.error) {
            return this.renderError();
        } else if (this.state.loading) {
            return this.renderLoader();
        }
        return <div className='page submission-edit'>
            <h1 className='title'>{this.state.root.label + ' (v' + this.state.version.version + ')'}</h1>
            <em>Submission {this.userData.id}</em>
            <TreeVersionInfoComponent treeversion={this.state.submission} showstate={false} />
            <div className='options top'>
                {this.renderCallbackButton(BTN_BACK, this.onClickBack, faBackward)}
                {this.renderCallbackButton(BTN_DELETE, this.onClickDelete, faTrash)}
                {this.renderCallbackButton(BTN_VIEW, this.onClickView, faEye)}
            </div>
            <section>
                <RootNodeComponent
                    node={this.state.tree}
                    userData={this.userData} 
                    onSave={this.onSave}
                />
            </section>
        </div>;
    }

}