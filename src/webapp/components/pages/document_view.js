import React from 'react';
import { faBackward, faFilePdf } from '@fortawesome/free-solid-svg-icons'
import BasePageComponent from './base';
import BackendAPI from '../../api';
import { BTN_BACK, BTN_DOWNLOAD_PDF, ERR_NOT_FOUND, TREE_DOCUMENT, TREE_DOCUMENT_PDF_FORM } from '../../config';
import RootNodeComponent from '../nodes/root';
import JsonConverter from '../../converters/json';
import PdfConverter from '../../converters/pdf';
import UserData from '../../user_data';
import TreeVersionInfoComponent from '../helper/tree_version_info';

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
        this.pdfFormData = null;
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
        let submissionId = this.props.path?.submission;
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
        let documentId = this.props.path?.document;
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
            'tree/version/fetch', {id: res.data.id, version: this.props.path?.version},
            this.onDocumentTreeResponse
        );
    }

    /**
     * @param {Object} res 
     */
    onDocumentTreeResponse(res) {
        if (this.handleErrorResponse(res)) { return; }
        this.title += ' (v' + res.data.version + ')';
        this.setTitle(this.title);
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
        this.gotoReferer();
    }

    /**
     * @param {Event} e 
     */
    onClickPdf(e) {
        e.preventDefault();

        switch (this.state.tree.type) {
            case TREE_DOCUMENT: {
                let c = new PdfConverter;
                c.userData = this.userData;
                c.download(this.state.tree);
                return;
            }
            case TREE_DOCUMENT_PDF_FORM: {
                if (this.pdfFormData) {
                    window.open(this.pdfFormData, '_blank');
                    return;
                }
            }
        }
    }

    /**
     * @param {String} data 
     */
    onPdfFormGenerate(data) {
        this.pdfFormData = data;
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
        return <div className={'page document-view ' + this.state.tree.type}>
            <h1 className='title'>{this.title}</h1>
            <em>Submission {this.userData.id}</em>
            <TreeVersionInfoComponent treeversion={this.state.submission} showstate={false} />
            <div className='options top'>
                {this.renderCallbackButton(BTN_BACK, this.onClickBack, faBackward)}
                {this.renderCallbackButton(BTN_DOWNLOAD_PDF, this.onClickPdf, faFilePdf)}
            </div>
            <section>
                <RootNodeComponent
                    node={this.state.tree}
                    userData={this.userData} 
                    parentForm={this.state.form}
                    pdfViewerCallback={this.onPdfFormGenerate}
                />
            </section>
        </div>;
    }

}
