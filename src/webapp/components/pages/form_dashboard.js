import React from 'react';
import { faBackward, faCirclePlus, faForward, faTrash } from '@fortawesome/free-solid-svg-icons'
import BasePageComponent from './base';
import BackendAPI from '../../api';
import { BTN_BACK, BTN_DELETE, BTN_GO, BTN_NEW, ERR_NOT_FOUND, MSG_DELETE_SUCCESS, MSG_DISPLAY_TIME, MSG_DONE, MSG_LOADING, MSG_NO_PUBLISHED, TREE_DOCUMENT, TREE_FORM } from '../../config';
import TreeVersionListPageComponent from './tree_version_list';
import ApiTableComponent from '../helper/api_table';
import { message as msgPopup } from 'react-message-popup';
import EditTitleComponent from '../helper/edit_title';
import TreeVersionEditPageComponent from './tree_version_edit';
import TreeListPageComponent from './tree_list';
import TreeVersionInfoComponent from '../helper/tree_version_info';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import FormSubmissionEditPageComponent from './form_submission_edit';
import FormSubmissionListPageComponent from './form_submission_list';

export default class FormDashboardPageComponent extends BasePageComponent {

    constructor(props) {
        super(props);
        this.state.loading = true;
        this.state.form = null;
        this.state.published = null;
    }

    /**
     * {@inheritdoc}
     */
    static getName() {
        return 'form-dashboard';
    }

    /**
     * {@inheritdoc}
     */
    onReady() {
        this.setState({loading: true});
        let treeRootId = typeof this.props.path.id != 'undefined' ? this.props.path.id : null;
        if (!treeRootId) {
            console.error('> ERROR: Missing ID parameter.')
            this.setState({error: ERR_NOT_FOUND});
            return;
        }
        BackendAPI.batch(
            [
                {path: 'tree/fetch', payload: {team: this.state.user.team, id: treeRootId}},
                {path: 'tree/version/fetch', payload: {id: treeRootId}}
            ],
            this.onApiResponse
        );
    }

    /**
     * @param {Object} res 
     */
    onApiResponse(res) {
        if (this.handleErrorResponse(res) || this.handleErrorResponse(res.data[0])) { return; }
        let root = res.data[0].data;
        if (root.type != TREE_FORM) {
            console.error('> ERROR: unexpected tree type');
            this.setState({error: ERR_NOT_FOUND});
            return;
        }
        this.setTitle(root.label);
        let publishedVer = null;
        if (res.data[1].success) {
            publishedVer = res.data[1].data;
        }
        this.setState({
            form: root,
            title: root.label,
            published: publishedVer
        });
        this.setLoaded();
    }

    /**
     * @param {string} text
     */
    onLabel(text) {
        BackendAPI.post(
            'tree/store', null, {
                id: this.state.form.id,
                team: this.state.form.parent,
                type: this.state.form.type,
                label: text
            },
            this.onLabelResponse
        );
        this.setState({
            title: text
        });
    }

    /**
     * @param {Object} res 
     */
    onLabelResponse(res) {
        if (this.handleErrorResponse(res)) { return; }
    }

    /**
     * @param {Event} e 
     */
    onClickDelete(e) {
        e.preventDefault();
        // TODO really make sure the user wants to delete this
        if (!confirm('Are you sure you want to delete this?')) {
            return;
        }
        this.msgLoadPromise = msgPopup.loading(MSG_LOADING, 10000);
        BackendAPI.post(
            'tree/delete', null,
            { id: this.state.form.id },
            this.onDeleteResponse
        );
    }

    /**
     * @param {Object} res 
     */
    onDeleteResponse(res) {
        if (this.msgLoadPromise) { this.msgLoadPromise.then(({destory}) => { destory(); } ); }
        if (this.handleErrorResponse(res)) { return; }
        msgPopup.success(MSG_DELETE_SUCCESS.replace('{name}', this.state.form.label), MSG_DISPLAY_TIME);
        this.gotoReferer();
    }

    /**
     * @param {Object} data 
     */
    onSelectFormVersion(data) {
        this.gotoPage(
            TreeVersionEditPageComponent,
            {
                id: data.root_id,
                version: data.version
            }
        );
    }

    /**
     * @param {Event} e 
     */
    onClickNewDocument(e) {
        e.preventDefault();
        this.msgLoadPromise = msgPopup.loading(MSG_LOADING, 10000);
        BackendAPI.post(
            'tree/store',
            null,
            {
                form: this.state.form.id,
                type: TREE_DOCUMENT,
                label: 'Untitled Document'
            },
            this.onNewDocumentResponse
        );
    }

    /**
     * @param {Object} res 
     */
    onNewDocumentResponse(res) {
        if (this.msgLoadPromise) { this.msgLoadPromise.then(({destory}) => { destory(); } ); }
        if (this.handleErrorResponse(res)) { return; }
        this.gotoPage(
            TreeVersionListPageComponent, {type: TREE_DOCUMENT, id: res.data.id}
        );
    }

    /**
     * @param {Object} data 
     */
    onSelectDocument(data) {
        this.gotoPage(
            TreeVersionListPageComponent, {id: data.id, version: data.version}
        );
    }

    /**
     * @param {Event} e 
     */
    onGotoPublished(e) {
        e.preventDefault();
        this.gotoPage(
            TreeVersionEditPageComponent, {id: this.state.published.root_id, version: this.state.published.version}
        );
    }

    /**
     * @param {Event} e 
     */
    onClickNewSubmission(e) {
        e.preventDefault();
        BackendAPI.post(
            'submission/store', {},
            {
                form_id: this.state.form.id,
                form_version: this.state.published.version,
                valid: false
            },
            this.onNewSubmissionResponse
        );
    }

    /**
     * @param {Object} res 
     */
    onNewSubmissionResponse(res) {
        if (this.msgLoadPromise) { this.msgLoadPromise.then(({destory}) => { destory(); } ); }
        if (this.handleErrorResponse(res)) { return; }
        this.gotoPage(FormSubmissionEditPageComponent, {id: res.data.id});
    }

    /**
     * @param {Object} data 
     */
    onSelectSubmission(data) {
        this.gotoPage(FormSubmissionEditPageComponent, {id: data.id});
    }

    /**
     * @param {Event} e 
     */
    onClickBack(e) {
        e.preventDefault();
        this.gotoReferer();
    }

    /**
     * {@inheritdoc}
     */
    render() {
        if (this.state.error) {
            return this.renderError();
        } else if (this.state.loading) {
            return this.renderLoader();
        }
        let publishedSection = <em>{MSG_NO_PUBLISHED}</em>;
        if (this.state.published) {
            publishedSection = <div>
                <TreeVersionInfoComponent showstate={false} treeversion={this.state.published} />
                <div className='options'>
                    <button className='pure-button' onClick={this.onGotoPublished}>
                        {BTN_GO} <FontAwesomeIcon icon={faForward} />
                    </button>
                </div>
            </div>;
        }
        return <div className='page form-dashboard'>
            <EditTitleComponent title={this.state.title} callback={this.onLabel} />
            <div className='options top'>
                {this.renderCallbackButton(BTN_BACK, this.onClickBack, faBackward)}
                {this.renderCallbackButton(BTN_DELETE, this.onClickDelete, faTrash)}
            </div>
            <section>
                <div className='published'>
                    <h2>Published</h2>
                    {publishedSection}
                </div>
                <div className='list versions'>
                    <h2>Versions</h2>
                    <ApiTableComponent
                        columns={{
                            'version': 'Version',
                            'state': 'State',
                            'created': 'Created',
                            'modified': 'Modified'
                        }}
                        endpoint='tree/version/list'
                        params={{id: this.state.form.id, team: this.state.user.team}}
                        callback={this.onSelectFormVersion}
                        seeMore={[TreeVersionListPageComponent, {id: this.state.form.id}]}
                    />
                </div>
                <div className='list documents'>
                    <h2>Documents</h2>
                    <div className='options'>
                        {this.renderCallbackButton(BTN_NEW, this.onClickNewDocument, faCirclePlus)}
                    </div>
                    <ApiTableComponent
                        columns={{
                            'id': 'ID',
                            'label': 'Name'
                        }}
                        endpoint='tree/list'
                        params={{form: this.state.form.id, team: this.state.user.team, type: TREE_DOCUMENT}}
                        callback={this.onSelectDocument}
                        seeMore={[TreeListPageComponent, {id: this.state.form.id}]}
                    />
                </div>
                <div className='list submissions'>
                    <h2>Submissions</h2>
                    <div className='options'>
                        {this.renderCallbackButton(BTN_NEW, this.onClickNewSubmission, faCirclePlus, !this.state.published)}
                    </div>
                    <ApiTableComponent
                        columns={{
                            'id': 'ID',
                            'created': 'Created'
                        }}
                        endpoint='submission/list'
                        params={{form: this.state.form.id}}
                        callback={this.onSelectSubmission}
                        seeMore={[FormSubmissionListPageComponent, {id: this.state.form.id}]}
                    />
                </div>
            </section>
        </div>;
    }

}
