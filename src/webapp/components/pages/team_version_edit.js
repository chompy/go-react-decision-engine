import React from 'react';
import { faBackward, faTrash, faEdit, faCopy, faCirclePlus, faFloppyDisk } from '@fortawesome/free-solid-svg-icons'
import BasePageComponent from './base';
import { ERR_NOT_FOUND } from '../../config';
import TreeVersionListPageComponent from './tree_version_list';
import BackendAPI from '../../api';
import BuilderComponent from '../builder';
import JsonConverter from '../../converters/json';

export default class TreeVersionEditPageComponent extends BasePageComponent {

    constructor(props) {
        super(props);
        this.state.loading = true;
        this.state.root = null;
        this.state.object = null;
        this.state.tree = null;
        this.onTreeRootResponse = this.onTreeRootResponse.bind(this);
        this.onTreeVersionResponse = this.onTreeVersionResponse.bind(this);
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
        if (!res.success) {
            console.error('> ERROR: ' + res.message, res);
            this.setState({error: res.message});
            return;
        }
        let version = typeof this.props.path.version != 'undefined' ? this.props.path.version : null;
        if (!version) {
            console.error('> ERROR: Missing version parameter.')
            this.setState({error: ERR_NOT_FOUND});
            return;
        }
        this.setState({root: res.data});
        BackendAPI.get('tree/version/fetch', {team: this.state.user.team, id: res.data.id, version: version}, this.onTreeVersionResponse);    
    }

    /**
     * @param {Object} res 
     */
    onTreeVersionResponse(res) {
        if (!res.success) {
            console.error('> ERROR: ' + res.message, res);
            this.setState({error: res.message});
            return;
        }
        // new tree
        if (!res.data.tree || res.data.tree.length == 0) {
            res.data.tree = [{
                uid: this.state.root.id,
                type: "root",
                version: res.data.version,
                label: 'TOP',
                created: new Date(),
                modified: new Date()
            }];
        }
        let jc = new JsonConverter;
        this.setState({
            loading: false,
            object: res.data,
            tree: jc.import(res.data.tree)
        });
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
            <h1 className='title'>{this.state.root.label} - v{this.state.object.version}</h1>
            <div className='options top'>
                {this.renderPageButton('Back', TreeVersionListPageComponent, {id: this.props.path.id}, faBackward)}
                {this.renderCallbackButton('Delete', null, faTrash)}
                {this.renderCallbackButton('Publish', null, faFloppyDisk)}
            </div>
            <section>
                <BuilderComponent node={this.state.tree} />
            </section>
        </div>;
    }

}