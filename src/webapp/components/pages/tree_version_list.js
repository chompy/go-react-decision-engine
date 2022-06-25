import React from 'react';
import { faBackward, faTrash, faEdit, faCopy, faCirclePlus } from '@fortawesome/free-solid-svg-icons'
import BasePageComponent from './base';
import BackendAPI from '../../api';
import FormListPageComponent from './form_list';
import EditTitleComponent from '../helper/edit_title';
import { ERR_NOT_FOUND } from '../../config';
import Events from '../../events';
import ApiTableComponent from '../helper/api_table';

export default class TreeVersionListPageComponent extends BasePageComponent {

    constructor(props) {
        super(props);
        this.state.root = null;
        this.state.title = '';
        this.state.loading = true;
        this.onTreeResponse = this.onTreeResponse.bind(this);
        this.onLabel = this.onLabel.bind(this);
        this.onLabelResponse = this.onLabelResponse.bind(this);
        this.onClickDelete = this.onClickDelete.bind(this);
        this.onDeleteResponse = this.onDeleteResponse.bind(this);
        this.onSelectVersion = this.onSelectVersion.bind(this);
    }

    /**
     * {@inheritdoc}
     */
    static getName() {
        return 'tree-version-list';
    }

    /**
     * {@inheritdoc}
     */
    static getTitle() {
        return 'Version List';
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
        if (!res.success) {
            console.error('> ERROR: ' + res.message, res);
            this.setState({error: res.message});
            return;
        };
        this.setState({
            root: res.data,
            title: res.data.label,
            loading: false
        });
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
        if (!res.success) {
            console.error('> ERROR: ' + res.message, res);
            this.setState({error: res.message});
        }
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
        this.setState({loading: true});
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
        if (!res.success) {
            console.error('> ERROR: ' + res.message, res);
            this.setState({error: res.message});
            return;
        }
        Events.dispatch('tree_delete', this.state.root);
        this.gotoPage(FormListPageComponent);
    }

    /**
     * @param {Object} data 
     */
    onSelectVersion(data) {
        console.log(data);
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
                {this.renderPageButton('Back', FormListPageComponent, {}, faBackward)}
                {this.renderCallbackButton('Delete', this.onClickDelete, faTrash)}
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
