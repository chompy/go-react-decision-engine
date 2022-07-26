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
import RuleTemplateCollector from '../../rule_template_collector';

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
        let documentId = this.props.path?.document;
        if (!documentId) {
            console.error('> ERROR: Missing document parameter.')
            this.setState({error: ERR_NOT_FOUND});
            return;
        } 
        BackendAPI.batch(
            [
                {path: 'submission/fetch', payload: {id: submissionId}},
                {path: 'tree/fetch', payload: {id: documentId}},
                {path: 'tree/version/fetch', payload: {id: '$2.id', version: this.props.path?.version}}
            ],
            this.onApiResponse
        );
    }

    /**
     * @param {Object} res 
     */
    onApiResponse(res) {
        if (this.handleBatchErrorResponse(res)) { return; }
        // submission
        let submission = res.data[0].data;
        let formVersion = submission.form_version;
        this.userData = UserData.importJSON(submission);
        // root
        let root = res.data[1].data;
        let formId = root.parent;
        // version
        let version = res.data[2].data;
        this.title = root.label + ' (v' + version.version + ')';
        this.setTitle(this.title);
        let jc = new JsonConverter;
        let tree = jc.import(version.tree);
        if (!tree.type) { tree.type = TREE_DOCUMENT; }
        this.setState({
            submission: submission,
            tree: tree
        });
        // import rules
        let ruleTemplates = version?.rule_templates ? version.rule_templates : [];
        for (let i in ruleTemplates) { RuleTemplateCollector.add(ruleTemplates[i]); }
        // fetch form tree for rules
        if (tree.type == TREE_DOCUMENT_PDF_FORM || tree.type == TREE_DOCUMENT) {
            BackendAPI.get(
                'tree/version/fetch', {id: formId, version: formVersion},
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
        // import rules
        let ruleTemplates = res.data?.rule_templates ? res.data.rule_templates : [];
        for (let i in ruleTemplates) { RuleTemplateCollector.add(ruleTemplates[i]); }
        // add form tree
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
