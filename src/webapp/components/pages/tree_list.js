import React from 'react';
import { faBackward, faCirclePlus } from '@fortawesome/free-solid-svg-icons'
import BasePageComponent from './base';
import BackendAPI from '../../api';
import { BTN_BACK, BTN_NEW, MSG_DISPLAY_TIME, MSG_DONE, MSG_LOADING, TITLE_DOC_LIST, TREE_DOCUMENT, TREE_FORM } from '../../config';
import ApiTableComponent from '../helper/api_table';
import { message as msgPopup } from 'react-message-popup';
import FormDashboardPageComponent from './form_dashboard';
import TreeVersionListPageComponent from './tree_version_list';

export default class TreeListPageComponent extends BasePageComponent {

    constructor(props) {
        super(props);
        this.mode = TREE_FORM;
        this.title = 'Forms';
        this.state.loading = true;
    }

    /**
     * {@inheritdoc}
     */
    static getName() {
        return 'tree-list';
    }

    /**
     * {@inheritdoc}
     */
    onReady() {
        if (typeof this.props.path.id != 'undefined' && this.props.path.id) {
            this.mode = TREE_DOCUMENT;
            this.setState({loading: true});
            let treeRootId = typeof this.props.path.id != 'undefined' ? this.props.path.id : null;
            if (!treeRootId) {
                console.error('> ERROR: Missing ID parameter.')
                this.setState({error: ERR_NOT_FOUND});
                return;
            }
            BackendAPI.get('tree/fetch', {id: this.props.path.id}, this.onTreeResponse);  
            return;
        }
        this.setTitle(this.title);
        super.onReady();
    }

    /**
     * @param {Object} res 
     */
    onTreeResponse(res) {
        if (this.handleErrorResponse(res)) { return; }
        this.title = TITLE_DOC_LIST.replace('{label}', res.data.label);
        this.setLoaded();
        this.setTitle(this.title);
    }

    /**
     * @param {Event} e 
     */
    onClickNew(e) {
        e.preventDefault();
        this.msgLoadPromise = msgPopup.loading(MSG_LOADING, 10000);
        BackendAPI.post(
            'tree/store',
            null,
            {
                team: this.state.user.team,
                type: this.mode,
                label: 'Untitled ' + ((this.mode == TREE_DOCUMENT) ? 'Document' : 'Form'),
                form: this.mode == TREE_DOCUMENT ? this.props.path.id : ''
            },
            this.onNewResponse
        );
    }

    /**
     * @param {Object} res 
     */
    onNewResponse(res) {
        if (this.msgLoadPromise) { this.msgLoadPromise.then(({destory}) => { destory(); } ); }
        if (this.handleErrorResponse(res)) { return; }
        msgPopup.success(MSG_DONE, MSG_DISPLAY_TIME);
        this.gotoPage(
            this.mode == TREE_DOCUMENT ? TreeVersionListPageComponent : FormDashboardPageComponent,
            {
                team: this.state.user.team,
                id: res.data.id
            }
        );
    }

    /**
     * @param {Object} data 
     */
    onSelectTree(data)  {
        if (data.type == TREE_DOCUMENT) {
            this.gotoPage(
                TreeVersionListPageComponent,
                {
                    team: this.state.user.team,
                    id: data.id
                }
            );
            return
        }

        this.gotoPage(
            FormDashboardPageComponent,
            {
                team: this.state.user.team,
                id: data.id
            }
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
        let backBtn = null;
        if (this.mode == TREE_DOCUMENT) {
            backBtn = this.renderPageButton(BTN_BACK, FormDashboardPageComponent, {id: this.props.path.id}, faBackward);
        }
        return <div className='page form-list'>
            <h1 className='title'>{this.title}</h1>
            <div className='options top'>
                {backBtn}
                {this.renderCallbackButton(BTN_NEW, this.onClickNew, faCirclePlus)}
            </div>
            <section>
                <ApiTableComponent
                    columns={{
                        'id': 'ID',
                        'label': 'Name',
                        'created': 'Created',
                        'modified': 'Modified'
                    }}
                    endpoint='tree/list'
                    params={{type: this.mode, team: this.state.user.team, form: this.mode == TREE_DOCUMENT ? this.props.path.id : ''}}
                    callback={this.onSelectTree}
                />
            </section>
        </div>;
    }

}
