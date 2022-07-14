import React from 'react';
import { faBackward, faFilePdf } from '@fortawesome/free-solid-svg-icons'
import BasePageComponent from './base';
import BackendAPI from '../../api';
import { BTN_BACK, BTN_DOWNLOAD_PDF, ERR_NOT_FOUND, TREE_DOCUMENT } from '../../config';
import ApiTableComponent from '../helper/api_table';
import DocumentViewComponent from './document_view';

export default class DocumentViewListComponent extends BasePageComponent {

    constructor(props) {
        super(props);
        this.title = '';
        this.state.submission = null;
        this.state.root = null;
        this.state.loading = true;
    }

    /**
     * {@inheritdoc}
     */
    static getName() {
        return 'document-view-list';
    }

    /**
     * {@inheritdoc}
     */
    onReady() {
        this.setState({loading: true});
        let submissionId = typeof this.props.path.id != 'undefined' ? this.props.path.id : null;
        if (!submissionId) {
            console.error('> ERROR: Missing ID parameter.')
            this.setState({error: ERR_NOT_FOUND});
            return;
        } 
        BackendAPI.get('submission/fetch', {id: submissionId}, this.onSubmissionResponse); 
    }

    /**
     * @param {Object} res 
     */
    onSubmissionResponse(res) {
        if (this.handleErrorResponse(res)) { return; }
        this.setState({submission: res.data});
        this.title = 'View Document'
        this.setTitle(this.title);
        this.setLoaded();
    }

    /**
     * @param {Object} data 
     */
    onSelectDocument(data) {
        this.gotoPage(
            DocumentViewComponent,
            {
                submission: this.state.submission.id,
                document: data.id
            }
        );
    }

    /**
     * @param {Event} e 
     */
    onClickBack(e) {
        e.preventDefault();
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
        return <div className='page tree-version-list'>
            <h1 className='title'>{this.title}</h1>
            <div className='options top'>
                {this.renderCallbackButton(BTN_BACK, this.onClickBack, faBackward)}
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
                    params={{type: TREE_DOCUMENT, form: this.state.submission.form_id}}
                    callback={this.onSelectDocument}
                />
            </section>
        </div>;
    }

}
