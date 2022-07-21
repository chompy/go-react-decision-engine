import React from 'react';
import { faBackward } from '@fortawesome/free-solid-svg-icons'
import BasePageComponent from './base';
import BackendAPI from '../../api';
import { BTN_BACK, ERR_NOT_FOUND, TITLE_FORM_SUBMISSION_LIST } from '../../config';
import ApiTableComponent from '../helper/api_table';
import FormSubmissionEditPageComponent from './form_submission_edit';
import DocumentViewComponent from './document_view';

export default class FormSubmissionListPageComponent extends BasePageComponent {

    constructor(props) {
        super(props);
        this.title = '';
        this.ref = null;
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
        if (!this.props.path?.id) {
            console.error('> ERROR: Missing ID parameter.')
            this.setState({error: ERR_NOT_FOUND});
            return;
        }
        BackendAPI.get('tree/fetch', {team: this.state.user.team, id: this.props.path.id}, this.onTreeResponse);    
    }

    /**
     * @param {Object} res 
     */
    onTreeResponse(res) {
        if (this.handleErrorResponse(res)) { return; }
        this.setState({root: res.data});
        this.title = TITLE_FORM_SUBMISSION_LIST.replace('{label}', res.data.label);
        this.setTitle(this.title);
        this.setLoaded();
    }

    /**
     * @param {Object} data 
     */
    onSelectSubmission(data) {
        if (this.props.path?.ref) {
            let ref = this.props.path.ref.split('-');
            this.gotoPage(DocumentViewComponent, {submission: data.id, document: ref[0], version: ref[1].substring(1)});
            return;
        }
        this.gotoPage(FormSubmissionEditPageComponent, {id: data.id});
    }

    onBackButton() {
        this.gotoReferer();
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
                {this.renderCallbackButton(BTN_BACK, this.onBackButton, faBackward)}
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
