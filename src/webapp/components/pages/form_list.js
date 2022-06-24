import React from 'react';
import { faBackward, faTrash, faEdit, faCopy, faCirclePlus, faForward } from '@fortawesome/free-solid-svg-icons'
import BasePageComponent from './base';
import BackendAPI from '../../api';
import { MSG_NO_LIST_DATA, TREE_FORM } from '../../config';
import Helper from '../../helpers';
import TruncateIdComponent from '../helper/truncate_id';
import TreeVersionListPageComponent from './tree_version_list';

export default class FormListPageComponent extends BasePageComponent {

    constructor(props) {
        super(props);
        this.state.offset = 0;
        this.state.count = 0;
        this.state.data = [];
        this.onFormsResponse = this.onFormsResponse.bind(this);
        this.onClickNewForm = this.onClickNewForm.bind(this);
        this.onNewFormResponse = this.onNewFormResponse.bind(this);
    }

    /**
     * {@inheritdoc}
     */
    static getName() {
        return 'form-list';
    }

    /**
     * {@inheritdoc}
     */
    static getTitle() {
        return 'Forms';
    }

    /**
     * {@inheritdoc}
     */
    onReady() {
        this.setState({loading: true});
        this.fetchForms(0);
    }

    /**
     * Fetch form list.
     * @param {integer} offset 
     */
    fetchForms(offset) {
        this.setState({offset: offset});
        BackendAPI.get('tree/list', {type: 'form', offset: offset}, this.onFormsResponse);
    }

    /**
     * @param {Object} res 
     */
    onFormsResponse(res) {
        this.setState({
            loading: false,
            count: res.count,
            data: res.data
        });
    }

    /**
     * @param {Event} e 
     */
    onClickNewForm(e) {
        e.preventDefault();
        BackendAPI.post(
            'tree/store',
            null,
            {
                team: this.state.user.team,
                type: TREE_FORM,
                label: 'Untitled Form'
            },
            this.onNewFormResponse
        );
    }

    /**
     * @param {Object} res 
     */
    onNewFormResponse(res) {
        if (!res.success) {
            console.error('> ERROR: ' + res.message, res);
            this.setState({error: res.message});
            return;
        }
        this.gotoPage(
            TreeVersionListPageComponent,
            {
                team: this.state.user.team,
                id: res.data.id
            }
        );
    }

    /**
     * Render form list table rows.
     */
    renderTableRows() {
        if (!this.state.data || this.state.data.length == 0) {
            return <tr><td rowSpan={5}><em>{MSG_NO_LIST_DATA}</em></td></tr>;
        }
        let out = [];
        for (let i in this.state.data) {
            let data = this.state.data[i];
            out.push(
                <tr key={'form-list-row-' + data.id}>
                    <td><TruncateIdComponent id={data.id} /></td>
                    <td>{data.label}</td>
                    <td>{Helper.formatDate(data.created)} ({data.creator})</td>
                    <td>{Helper.formatDate(data.modified)} ({data.modifier})</td>
                    <td>
                        {this.renderPageButton('Go', TreeVersionListPageComponent, {id: data.id}, faForward)}
                    </td>
                </tr>
            );
        }
        return out;
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

        return <div className='page form-list'>
            <div className='options top'>
                {this.renderCallbackButton('New Form', this.onClickNewForm, faCirclePlus)}
            </div>

            <section>

                <table className='pure-table'>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Created</th>
                                <th>Modified</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {this.renderTableRows()}
                        </tbody>
                    </table>

            </section>
        </div>;
    }

}
