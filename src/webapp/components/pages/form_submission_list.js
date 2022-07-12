import React from 'react';
import { faBackward, faTrash, faEdit, faCopy, faCirclePlus } from '@fortawesome/free-solid-svg-icons'
import BasePageComponent from './base';
import BackendAPI from '../../api';
import EditTitleComponent from '../helper/edit_title';
import { BTN_BACK, BTN_DELETE, ERR_NOT_FOUND, MSG_DELETE_SUCCESS, MSG_DISPLAY_TIME, MSG_LOADING, TITLE_FORM_SUBMISSION_LIST, TREE_DOCUMENT, TREE_FORM } from '../../config';
import ApiTableComponent from '../helper/api_table';
import TreeVersionEditPageComponent from './tree_version_edit';
import { message as msgPopup } from 'react-message-popup';
import FormDashboardPageComponent from './form_dashboard';
import TreeListPageComponent from './tree_list';
import FormSubmissionEditPageComponent from './form_submission_edit';

export default class FormSubmissionListPageComponent extends BasePageComponent {

    constructor(props) {
        super(props);
        this.title = '';
        this.state.root = null;
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
        this.setState({root: res.data});
        this.setLoaded();
        this.title = TITLE_FORM_SUBMISSION_LIST.replace('{label}', res.data.label);
        this.setTitle(this.title);
    }

    /**
     * @param {Object} data 
     */
    onSelectSubmission(data) {
        this.gotoPage(FormSubmissionEditPageComponent, {id: data.id});
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
            <h1 className='title'>{this.title}</h1>
            <div className='options top'>
                {this.renderPageButton(BTN_BACK, FormDashboardPageComponent, {id: this.state.root.id}, faBackward)}
            </div>
            <section>
                <ApiTableComponent
                    columns={{
                        'id': 'ID',
                        'valid': 'Valid',
                        'created': 'Created',
                        'modified': 'Modified'
                    }}
                    endpoint='submission/list'
                    params={{form: this.state.root.id}}
                    callback={this.onSelectSubmission}
                />
            </section>
        </div>;
    }

}
