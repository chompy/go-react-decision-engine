import React from 'react';
import { faBackward, faTrash, faEdit, faCopy, faCirclePlus } from '@fortawesome/free-solid-svg-icons'
import BasePageComponent from './base';
import BackendAPI from '../../api';
import FormListPageComponent from './form_list';
import EditTitleComponent from '../helper/edit_title';
import { ERR_NOT_FOUND } from '../../config';

export default class TreeVersionListPageComponent extends BasePageComponent {

    constructor(props) {
        super(props);
        this.state.root = null;
        this.state.list = [];
        this.state.title = '';
        this.state.count = 0;
        this.onTreeResponse = this.onTreeResponse.bind(this);
        this.onTreeListResponse = this.onTreeListResponse.bind(this);
        this.onLabel = this.onLabel.bind(this);
        this.onLabelResponse = this.onLabelResponse.bind(this);
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
        })
        BackendAPI.get('tree/list', {team: this.state.user.team, id: res.data.id}, this.onTreeListResponse);
    }

    /**
     * @param {Object} res 
     */
    onTreeListResponse(res) {
        if (!res.success) {
            console.error('> ERROR: ' + res.message, res);
            this.setState({error: res.message});
            return;       
        }
        this.setState({
            loading: false,
            count: res.count,
            list: res.data
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
     * {@inheritdoc}
     */
    render() {

        if (this.state.error) {
            return this.renderError();
        } else if (this.state.loading) {
            return this.renderLoader();
        }
        
        return <div className='page tree-version-list'>

            <div className='options top'>
            {this.renderPageButton('Back', FormListPageComponent, {}, faBackward)}
            </div>
            <EditTitleComponent title={this.state.title} callback={this.onLabel} />
            <section>

                <table className='pure-table'>
                        <thead>
                            <tr>
                                <th>Version</th>
                                <th>State</th>
                                <th>Created</th>
                                <th>Modified</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>1</td>
                                <td>Published</td>
                                <td>1/1/2020 5:00 PM (Nathan Ogden)</td>
                                <td>1/1/2020 5:01 PM (Sam Ogden)</td>
                                <td>
                                    <div className='pure-button-group' role='group'>
                                        {this.renderPageButton('Edit', FormListPageComponent, {}, faEdit)}
                                        {this.renderPageButton('Copy', FormListPageComponent, {}, faCopy)}
                                        {this.renderPageButton('Delete', FormListPageComponent, {}, faTrash)}
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>2</td>
                                <td>Draft</td>
                                <td>1/1/2020 5:00 PM (Nathan Ogden)</td>
                                <td>1/1/2020 5:01 PM (Sam Ogden)</td>
                                <td>
                                    <div className='pure-button-group' role='group'>
                                        {this.renderPageButton('Edit', FormListPageComponent, {}, faEdit)}
                                        {this.renderPageButton('Copy', FormListPageComponent, {}, faCopy)}
                                        {this.renderPageButton('Delete', FormListPageComponent, {}, faTrash)}
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>3</td>
                                <td>Draft</td>
                                <td>1/1/2020 5:00 PM (Nathan Ogden)</td>
                                <td>1/1/2020 5:01 PM (Sam Ogden)</td>
                                <td>
                                    <div className='pure-button-group' role='group'>
                                        {this.renderPageButton('Edit', FormListPageComponent, {}, faEdit)}
                                        {this.renderPageButton('Copy', FormListPageComponent, {}, faCopy)}
                                        {this.renderPageButton('Delete', FormListPageComponent, {}, faTrash)}
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>

            </section>
        </div>;
    }

}
