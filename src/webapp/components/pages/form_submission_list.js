import React from 'react';
import { faBackward, faTrash, faEdit, faCopy, faCirclePlus } from '@fortawesome/free-solid-svg-icons'
import BasePageComponent from './base';
import BackendAPI from '../../api';
import EditTitleComponent from '../helper/edit_title';
import { BTN_BACK, BTN_DELETE, ERR_NOT_FOUND, MSG_DELETE_SUCCESS, MSG_DISPLAY_TIME, MSG_LOADING, TREE_DOCUMENT, TREE_FORM } from '../../config';
import ApiTableComponent from '../helper/api_table';
import TreeVersionEditPageComponent from './tree_version_edit';
import { message as msgPopup } from 'react-message-popup';
import FormDashboardPageComponent from './form_dashboard';
import TreeListPageComponent from './tree_list';

export default class FormSubmissionListPageComponent extends BasePageComponent {

    constructor(props) {
        super(props);
        this.state.root = null;
        this.state.title = '';
        this.state.loading = true;
    }

    /**
     * {@inheritdoc}
     */
    static getName() {
        return 'form-submission-list';
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
        this.setState({
            root: res.data,
            title: res.data.label
        });
        this.setLoaded();
        //this.setTitle(res.data.label);
    }

    /**
     * @param {string} text
     */
    onLabel(text) {
        BackendAPI.post(
            'tree/store', null, {
                id: this.state.root.id,
                team: this.state.root.parent,
                form: this.state.root.parent,
                type: this.state.root.type,
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
            { id: this.state.root.id },
            this.onDeleteResponse
        );
    }

    /**
     * @param {Object} res 
     */
    onDeleteResponse(res) {
        if (this.msgLoadPromise) { this.msgLoadPromise.then(({destory}) => { destory(); } ); }
        if (this.handleErrorResponse(res)) { return; }
        msgPopup.success(MSG_DELETE_SUCCESS.replace('{name}', this.state.root.label), MSG_DISPLAY_TIME);
        this.onClickBack();
    }

    /**
     * @param {Object} data 
     */
    onSelectVersion(data) {
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
    onClickBack(e) {
        if (e) { e.preventDefault(); }
        if (this.state.root.type == TREE_DOCUMENT) {
            if (this.props.referer && this.props.referer.component == TreeListPageComponent) {
                this.gotoPage(TreeListPageComponent, {id: this.state.root.parent, type: TREE_DOCUMENT});
                return;
            }
            this.gotoPage(FormDashboardPageComponent, {id: this.state.root.parent});
            return;
        }
        this.gotoPage(FormDashboardPageComponent, {id: this.state.root.id});
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
        return <div className='page tree-version-list'>
            <EditTitleComponent title={this.state.title} callback={this.onLabel} />
            <div className='options top'>
                {this.renderCallbackButton(BTN_BACK, this.onClickBack, faBackward)}
                {this.renderCallbackButton(BTN_DELETE, this.onClickDelete, faTrash)}
            </div>
            <section>
                <ApiTableComponent
                    columns={{
                        'version': 'Version',
                        'state': 'State',
                        'created': 'Created',
                        'modified': 'Modified'
                    }}
                    endpoint='tree/version/list'
                    params={{id: this.state.root.id, team: this.state.user.team}}
                    callback={this.onSelectVersion}
                />
            </section>
        </div>;
    }

}
