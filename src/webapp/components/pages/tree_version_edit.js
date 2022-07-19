import React from 'react';
import { faBackward, faTrash, faCopy, faFloppyDisk } from '@fortawesome/free-solid-svg-icons'
import BasePageComponent from './base';
import { BTN_BACK, BTN_COPY, BTN_DELETE, BTN_PUBLISH, ERR_NOT_FOUND, MSG_COPY_SUCCESS, MSG_DISPLAY_TIME, MSG_DONE, MSG_LOADING, MSG_SAVED, MSG_SAVING, TREE_DOCUMENT, TREE_DOCUMENT_PDF_FORM } from '../../config';
import TreeVersionListPageComponent from './tree_version_list';
import BackendAPI from '../../api';
import BuilderComponent from '../builder/builder';
import JsonConverter from '../../converters/json';
import Events from '../../events';
import { message as msgPopup } from 'react-message-popup';
import TreeVersionInfoComponent from '../helper/tree_version_info';
import PdfFormComponent from '../pdf_form';

export default class TreeVersionEditPageComponent extends BasePageComponent {

    constructor(props) {
        super(props);
        this.state.loading = true;
        this.state.root = null;
        this.state.object = null;
        this.state.tree = null;
        this.state.formTree = null;
        this.storeTimeout = null;
    }

    /**
     * {@inheritdoc}
     */
    componentDidMount() {
        super.componentDidMount();
        Events.listen('root_update', this.onTreeUpdate);
    }

    /**
     * {@inheritdoc}
     */
    componentWillUnmount() {
        super.componentWillUnmount();
        Events.remove('root_update', this.onTreeUpdate);
    }

    /**
     * {@inheritdoc}
     */
    static getName() {
        return 'tree-version-edit';
    }

    /**
     * {@inheritdoc}
     */
    static getTitle() {
        return 'Version Edit';
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
        BackendAPI.get('tree/fetch', {team: this.state.user.team, id: treeRootId}, this.onTreeRootResponse);    
    }

    /**
     * @param {Object} res 
     */
    onTreeRootResponse(res) {
        if (this.handleErrorResponse(res)) { return; }
        let version = typeof this.props.path.version != 'undefined' ? this.props.path.version : null;
        if (!version) {
            console.error('> ERROR: Missing version parameter.')
            this.setState({error: ERR_NOT_FOUND});
            return;
        }
        this.setState({root: res.data});
        BackendAPI.get('tree/version/fetch', {id: res.data.id, version: version}, this.onTreeVersionResponse);    
    }

    /**
     * @param {Object} res 
     */
    onTreeVersionResponse(res) {
        if (this.handleErrorResponse(res)) { return; }
        // new tree
        if (!res.data.tree || res.data.tree.length == 0) {
            res.data.tree = [{
                label: 'TOP',
                type: 'root',
                version: res.data.version,
                created: new Date(),
                modified: new Date()
            }];
        }
        res.data.tree[0].uid = this.state.root.id;
        res.data.tree[0].version = res.data.version;
        let jc = new JsonConverter;
        this.setState({
            object: res.data,
            tree: jc.import(res.data.tree)
        });
        this.setTitle(this.state.root.label + ' v' + res.data.version);
        if (this.state.root.type == TREE_DOCUMENT || this.state.root.type == TREE_DOCUMENT_PDF_FORM) {
            BackendAPI.get(
                'tree/version/fetch', 
                {id: this.state.root.parent}, this.onFormTreeVersionResponse
            );
            return;
        }
        this.setLoaded();
    }

    /**
     * @param {Object} res 
     * @returns 
     */
    onFormTreeVersionResponse(res)
    {
        if (res.success) {
            let jc = new JsonConverter;
            this.setState({
                formTree: jc.import(res.data.tree)
            });
        }
        this.setLoaded();
    }

    /**
     * @param {Event} e 
     */
    onTreeUpdate(e) {
        clearTimeout(this.storeTimeout);
        this.storeTimeout = setTimeout(
            this.onTreeStore,
            5000,
            e.detail.data
        );
    }

    /**
     * @param {Array} data 
     */
    onTreeStore(data) {
        clearTimeout(this.storeTimeout);
        this.storeTimeout = null;
        BackendAPI.post(
            'tree/version/store',
            null,
            {
                id: this.state.object.root_id,
                version: this.state.object.version,
                state: this.state.object.state,
                tree: data
            },
            this.onTreeStoreResponse
        );
    }

    /**
     * @param {Object} res 
     */
    onTreeStoreResponse(res) {
        if (this.msgLoadPromise) { this.msgLoadPromise.then(({destory}) => { destory(); } ); }
        if (this.handleErrorResponse(res)) { return; }
        msgPopup.success(MSG_SAVED, MSG_DISPLAY_TIME);
        console.log('> Stored tree version data.', res.data);
    }

    /**
     * @param {Event} e 
     */
    onClickDelete(e) {
        e.preventDefault();
        this.msgLoadPromise = msgPopup.loading(MSG_LOADING, 10000);
        BackendAPI.post(
            'tree/version/delete', null,
            { id: this.state.root.id, version: this.state.object.version },
            this.onDeleteResponse
        );
    }

    /**
     * @param {Object} res 
     */
    onDeleteResponse(res) {
        if (this.msgLoadPromise) { this.msgLoadPromise.then(({destory}) => { destory(); } ); }
        if (this.handleErrorResponse(res)) { return; }
        console.log('> Delete tree version ' + this.state.object.root_id + '/v' + this.state.object.version + '.');
        this.gotoPage(TreeVersionListPageComponent, {id: this.state.root.id});
    }

    /**
     * @param {Event} e 
     */
    onClickPublish(e) {
        e.preventDefault();
        this.msgLoadPromise = msgPopup.loading(MSG_LOADING, 10000);
        BackendAPI.post(
            'tree/version/publish',
            null,
            {
                id: this.state.object.root_id,
                version: this.state.object.version
            },
            this.onPublishResponse
        );
    }

    /**
     * @param {Object} res 
     */
    onPublishResponse(res) {
        if (this.msgLoadPromise) { this.msgLoadPromise.then(({destory}) => { destory(); } ); }
        if (this.handleErrorResponse(res)) { return; }
        msgPopup.success(MSG_DONE, MSG_DISPLAY_TIME);
        this.setState({object: res.data});
    }

    /**
     * @param {Event} e 
     */
    onClickCopy(e) {
        e.preventDefault();
        this.msgLoadPromise = msgPopup.loading(MSG_LOADING, 10000);
        let js = new JsonConverter;
        let treeExport = js.export(this.state.tree);
        BackendAPI.post(
            'tree/version/store',
            null,
            {
                id: this.state.object.root_id,
                state: 'draft',
                tree: treeExport
            },
            this.onCopyResponse
        );
    }

    /**
     * @param {Object} res 
     */
    onCopyResponse(res) {
        if (this.msgLoadPromise) { this.msgLoadPromise.then(({destory}) => { destory(); } ); }
        if (this.handleErrorResponse(res)) { return; }
        msgPopup.success(MSG_COPY_SUCCESS.replace('{version}', this.state.object.version), MSG_DISPLAY_TIME);
        this.gotoPage(TreeVersionListPageComponent, {id: this.state.root.id});
    }

    /**
     * @param {Event} e 
     */
    onClickBack(e) {
        e.preventDefault();
        if (this.storeTimeout) {
            this.msgLoadPromise = msgPopup.loading(MSG_SAVING, 10000);
            let js = new JsonConverter;
            let treeExport = js.export(this.state.tree);
            this.onTreeStore(treeExport);
        }
        window.history.back();
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

        let builder = <BuilderComponent
            node={this.state.tree}
            type={this.state.root.type}
            ruleNode={this.state.formTree ? this.state.formTree : this.state.tree} 
        />;
        if (this.state.root.type == TREE_DOCUMENT) {
            builder = <PdfFormComponent
                node={this.state.tree}
                ruleNode={this.state.formTree ? this.state.formTree : this.state.tree} 
            />;
        }
        return <div className='page tree-version-edit'>
            <h1 className='title'>{this.state.root.label}</h1>
            <TreeVersionInfoComponent treeversion={this.state.object} />
            <div className='options top'>
                {this.renderCallbackButton(BTN_BACK, this.onClickBack, faBackward)}
                {this.renderCallbackButton(BTN_DELETE, this.onClickDelete, faTrash)}
                {this.renderCallbackButton(BTN_PUBLISH, this.onClickPublish, faFloppyDisk, this.state.object.state == 'published')}
                {this.renderCallbackButton(BTN_COPY, this.onClickCopy, faCopy)}
            </div>
            <section>{builder}</section>
        </div>;
    }

}