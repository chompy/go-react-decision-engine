import React from 'react';
import { faBackward, faCirclePlus, faForward } from '@fortawesome/free-solid-svg-icons'
import BasePageComponent from './base';
import BackendAPI from '../../api';
import { BTN_BACK, BTN_GO, BTN_NEW, ERR_NOT_FOUND, MSG_DISPLAY_TIME, MSG_DONE, MSG_LOADING, MSG_NO_PUBLISHED, TREE_DOCUMENT, TREE_FORM } from '../../config';
import TreeVersionListPageComponent from './tree_version_list';
import ApiTableComponent from '../helper/api_table';
import { message as msgPopup } from 'react-message-popup';
import EditTitleComponent from '../helper/edit_title';
import TreeVersionEditPageComponent from './team_version_edit';
import TreeListPageComponent from './tree_list';
import UserTimeComponent from '../helper/user_time';

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
    static getTitle() {
        return 'Form Dashboard';
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
        BackendAPI.get('tree/fetch', {team: this.state.user.team, id: treeRootId}, this.onTreeResponse);
    }

    /**
     * @param {Object} res 
     */
    onTreeResponse(res) {
        if (this.handleErrorResponse(res)) { return; }
        if (res.data.type != TREE_FORM) {
            console.error('> ERROR: unexpected tree type');
            this.setState({error: ERR_NOT_FOUND});
            return;
        }
        this.setState({
            form: res.data,
            title: res.data.label
        });
        BackendAPI.get('tree/version/fetch', {id: res.data.id}, this.onPublishedVersionResponse)
    }

    onPublishedVersionResponse(res) {
        //if (this.handleErrorResponse(res)) { return;
        this.setState({published: res.data});
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

    onSelectDocument(data) {
        console.log(data);
        this.gotoPage(
            TreeVersionListPageComponent, {id: data.id, version: data.version}
        );
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
                <span className='version'>Version {this.state.published.version}</span>
                <span className='created'>
                    Created
                    <UserTimeComponent user={this.state.published.creator} time={this.state.published.created} />
                </span>
                <span className='modified'>
                    Modified
                    <UserTimeComponent user={this.state.published.modifier} time={this.state.published.modified} />
                </span>
                <div className='options'>
                    {this.renderCallbackButton(BTN_GO, null, faForward)}
                </div>
            </div>
        }
        return <div className='page form-dashboard'>
            <EditTitleComponent title={this.state.title} callback={this.onLabel} />
            <div className='options top'>
                {this.renderPageButton(BTN_BACK, TreeListPageComponent, {}, faBackward)}
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
                        {this.renderCallbackButton(BTN_NEW, null, faCirclePlus)}
                    </div>
                    <ApiTableComponent
                        columns={{
                            'id': 'ID',
                            'label': 'Name'
                        }}
                        endpoint='tree/list'
                        params={{form: this.state.form.id, team: this.state.user.team, type: TREE_DOCUMENT}}
                        callback={this.onSelectFormVersion}
                        seeMore={[TreeVersionListPageComponent, {form: this.state.form.id, type: TREE_DOCUMENT}]}
                    />
                </div>

            </section>
        </div>;
    }

}
