import { faBackward, faClone, faEye, faForward, faTrash } from '@fortawesome/free-solid-svg-icons';
import React from 'react';
import BackendAPI from '../../api';
import { BTN_BACK, BTN_COPY_SYNC, BTN_DELETE, BTN_NEXT, BTN_VIEW, ERR_NOT_FOUND, MSG_COPY_SUCCESS, MSG_DISPLAY_TIME, MSG_SAVED, MSG_SAVING, MSG_SUBMISSION_DELETED, TREE_DOCUMENT, TREE_FORM } from '../../config';
import JsonConverter from '../../converters/json';
import UserData from '../../user_data';
import TreeVersionInfoComponent from '../helper/tree_version_info';
import RootNodeComponent from '../nodes/root';
import BasePageComponent from './base';
import { message as msgPopup } from 'react-message-popup';
import DocumentViewListComponent from './document_view_list';
import RuleTemplateCollector from '../../rule_template_collector';
import DocumentViewComponent from './document_view';

export default class FormSubmissionEditPageComponent extends BasePageComponent {

    constructor(props) {
        super(props);
        this.userData = null;
        this.hasChange = false;
        this.state.submission = null;
        this.state.root = null;
        this.state.version = null;
        this.state.tree = null;
        this.state.published = null;
        this.state.loading = true;
        this.state.publishedDocCount = 0;
        this.state.publishedDocId = '';
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
        BackendAPI.batch(
            [
                {path: 'submission/fetch', payload: {id: submissionId}},
                {path: 'tree/version/fetch', payload: {id: '$1.form_id', version: '$1.form_version'}},
                {path: 'tree/version/fetch', payload: {id: "$1.form_id"}},
                {path: 'tree/fetch', payload: {id: '$2.root_id'}},
                {path: 'tree/list', payload: {type: TREE_DOCUMENT, form: '$1.form_id', published: true}}
            ],
            this.onApiResponse
        );
    }

    /**
     * Fires on response from API fetch.
     * @param {Object} res 
     */
    onApiResponse(res) {
        if (this.handleBatchErrorResponse(res)) { return; }
        // submission
        let submission = res.data[0].data;        
        this.userData = UserData.importJSON(res.data[0].data);
        // tree version
        let treeVersion = res.data[1].data;
        let js = new JsonConverter;
        let tree = js.import(treeVersion.tree);
        if (tree) {
            tree.type = TREE_FORM;
        }
        // root form
        let root = res.data[3].data;
        // import rules
        let ruleTemplates = treeVersion?.rule_templates ? treeVersion.rule_templates : [];
        for (let i in ruleTemplates) { RuleTemplateCollector.add(ruleTemplates[i]); }
        // update state, set loaded
        this.setState({
            submission: submission,
            version: treeVersion,
            tree: tree,
            root: root,
            published: res.data[2].data,
            publishedDocCount: res.data[4]?.count ? res.data[4]?.count : 0,
            publishedDocId: res.data[4]?.count && res.data[4]?.count > 0 ? res.data[4]?.data[0].id : ''
        });        
        this.setTitle(this.state.root.label + ' (v' + this.state.version.version + ')');
        this.setLoaded();
    }

    /**
     * Fired when save is requested.
     */
    onSave() {
        if (!this.hasChange) { return; }
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
     * Fires when user changes/adds an answer.
     */
    onUpdate() {
        this.hasChange = true;
    }

    /**
     * @param {Object} res 
     */
    onStoreResponse(res) {
        if (this.msgLoadPromise) { this.msgLoadPromise.then(({destory}) => { destory(); } ); }
        if (this.handleErrorResponse(res)) { return; }
        msgPopup.success(MSG_SAVED, MSG_DISPLAY_TIME);
        this.hasChange = false;
    }

    /**
     * @param {Event} e 
     */
    onClickBack(e) {
        e.preventDefault();
        this.onSave();
        this.gotoReferer();
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
        this.gotoReferer();
    }

    /**
     * @param {Event} e 
     */
    onClickView(e) {
        e.preventDefault();
        this.onSave();
        if (this.state.publishedDocCount == 1 && this.state.publishedDocId) {
            this.gotoPage(DocumentViewComponent, {submission: this.state.submission.id, document: this.state.publishedDocId});
            return;
        }
        this.gotoPage(DocumentViewListComponent, {id: this.userData.id});
    }

    /**
     * @param {Event} e 
     */
    onClickCopySync(e) {
        e.preventDefault();
        this.msgLoadPromise = msgPopup.loading(MSG_SAVING, 10000);
        BackendAPI.post(
            'submission/store',
            null,
            {
                form_id: this.state.version.root_id,
                form_version: this.state.published.version,
                answers: this.userData.answers,
                valid: this.userData.valid
            },
            this.onCopySyncResponse
        );
    }

    /**
     * @param {Object} res 
     */
    onCopySyncResponse(res) {
        if (this.msgLoadPromise) { this.msgLoadPromise.then(({destory}) => { destory(); } ); }
        if (this.handleErrorResponse(res)) { return; }
        msgPopup.success(MSG_COPY_SUCCESS.replace('{version}', this.state.version.version), MSG_DISPLAY_TIME);
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
        let syncToPublish = null;
        if (this.state.published && this.state.published.version != this.state.version.version) {
            syncToPublish = this.renderCallbackButton(BTN_COPY_SYNC, this.onClickCopySync, faClone);
        }
        return <div className='page submission-edit'>
            <h1 className='title'>{this.state.root.label + ' (v' + this.state.version.version + ')'}</h1>
            <em>Submission {this.userData.id}</em>
            <TreeVersionInfoComponent treeversion={this.state.submission} showstate={false} />
            <div className='options top'>
                {this.renderCallbackButton(BTN_BACK, this.onClickBack, faBackward)}
                {this.renderCallbackButton(BTN_DELETE, this.onClickDelete, faTrash)}
                {syncToPublish}
                {this.renderCallbackButton(BTN_VIEW, this.onClickView, faEye, this.state.publishedDocCount == 0)}
            </div>
            <section>
                <RootNodeComponent
                    node={this.state.tree}
                    userData={this.userData} 
                    onSave={this.onSave}
                    onUpdate={this.onUpdate}
                />
            </section>
        </div>;
    }

}