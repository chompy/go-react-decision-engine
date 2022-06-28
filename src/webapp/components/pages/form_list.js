import React from 'react';
import { faCirclePlus } from '@fortawesome/free-solid-svg-icons'
import BasePageComponent from './base';
import BackendAPI from '../../api';
import { TREE_FORM } from '../../config';
import TreeVersionListPageComponent from './tree_version_list';
import ApiTableComponent from '../helper/api_table';

export default class FormListPageComponent extends BasePageComponent {

    constructor(props) {
        super(props);
        this.state.loading = true;
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
        this.setState({loading: false});
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
        if (this.handleErrorResponse(res)) { return; }
        this.gotoPage(
            TreeVersionListPageComponent,
            {
                team: this.state.user.team,
                id: res.data.id
            }
        );
    }

    /**
     * @param {Object} data 
     */
    onSelectForm(data)  {
        this.gotoPage(
            TreeVersionListPageComponent,
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
        return <div className='page form-list'>
            <h1 className='page-title'>Forms</h1>
            <div className='options top'>
                {this.renderCallbackButton('New Form', this.onClickNewForm, faCirclePlus)}
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
                    params={{type: 'form', team: this.state.user.team}}
                    callback={this.onSelectForm}
                />
            </section>
        </div>;
    }

}
