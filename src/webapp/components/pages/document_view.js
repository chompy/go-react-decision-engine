import React from 'react';
import { faBackward, faFilePdf } from '@fortawesome/free-solid-svg-icons'
import BasePageComponent from './base';
import BackendAPI from '../../api';
import { BTN_BACK, BTN_DOWNLOAD_PDF, ERR_NOT_FOUND, TREE_DOCUMENT, TREE_DOCUMENT_PDF_FORM } from '../../config';
import RootNodeComponent from '../nodes/root';
import JsonConverter from '../../converters/json';
import PdfConverter from '../../converters/pdf';
import UserData from '../../user_data';

export default class DocumentViewComponent extends BasePageComponent {

    constructor(props) {
        super(props);
        this.title = '';
        this.userData = null;
        this.formId = null;
        this.formVersion = null;
        this.state.submission = null;
        this.state.loading = true;
        this.state.tree = null;
        this.state.form = null;
    };

    /**
     * {@inheritdoc}
     */
    static getName() {
        return 'document-view';
    }

    /**
     * {@inheritdoc}
     */
    onReady() {
        this.setState({loading: true});
        let submissionId = typeof this.props.path.submission != 'undefined' ? this.props.path.submission : null;
        if (!submissionId) {
            console.error('> ERROR: Missing submission parameter.')
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
        this.userData = UserData.importJSON(res.data);
        this.formVersion = res.data.form_version;
        this.setState({submission: res.data});
        let documentId = typeof this.props.path.document != 'undefined' ? this.props.path.document : null;
        if (!documentId) {
            console.error('> ERROR: Missing document parameter.')
            this.setState({error: ERR_NOT_FOUND});
            return;
        } 
        BackendAPI.get(
            'tree/fetch', {id: documentId},
            this.onDocumentResponse
        );
    }

    /**
     * @param {Object} res 
     */
    onDocumentResponse(res) {
        if (this.handleErrorResponse(res)) { return; }
        this.title = res.data.label;
        this.setTitle(this.title);
        this.formId = res.data.parent;
        BackendAPI.get(
            'tree/version/fetch', {id: res.data.id},
            this.onDocumentTreeResponse
        );
    }

    /**
     * @param {Object} res 
     */
    onDocumentTreeResponse(res) {
        if (this.handleErrorResponse(res)) { return; }
        let jc = new JsonConverter;
        let tree = jc.import(res.data.tree);
        if (!tree.type) { tree.type = TREE_DOCUMENT; }
        this.setState({tree: tree});
        if (tree.type == TREE_DOCUMENT_PDF_FORM) {
            BackendAPI.get(
                'tree/version/fetch', {id: this.formId, version: this.formVersion},
                this.onFormTreeResponse
            );
            return;
        }
        this.setLoaded();
    }

    /**
     * @param {Object} res 
     */
    onFormTreeResponse(res) {
        let jc = new JsonConverter;
        this.setState({
            form: jc.import(res.data.tree)
        })
        this.setLoaded();
    }

    /**
     * @param {Event} e 
     */
    onClickBack(e) {
        e.preventDefault();
        window.history.back();
    }

    onClickPdf(e) {
        e.preventDefault();
        let c = new PdfConverter;
        c.userData = this.userData;
        console.log( c.export(this.state.tree) );
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
                {this.renderCallbackButton(BTN_DOWNLOAD_PDF, this.onClickPdf, faFilePdf)}
            </div>
            <section>
                <RootNodeComponent
                    node={this.state.tree}
                    userData={this.userData} 
                    parentForm={this.state.form}
                />
            </section>
        </div>;
    }

}
