import React from 'react';
import * as pdfjsLib from 'pdfjs-dist/webpack';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { BTN_DELETE, MSG_FILE_NOT_PDF, TREE_DOCUMENT, TREE_DOCUMENT_PDF_FORM } from '../../config';
import { faCircleXmark } from '@fortawesome/free-regular-svg-icons';
import BuilderComponent from '../builder/builder';
import RootNode from '../../nodes/root';
import PdfFieldNode from '../../nodes/pdf_field';
import Events from '../../events';

export default class PdfFormComponent extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            pdfLoaded: false,
            formFields: null,
            error: null,
            currentField: null,
            pdfScrollFixed: false,
            builderWidth: 0
        };
        this.canvasId = 'pdf-viewer-' + new Date().getTime();
        this.pdfViewerTop = 0;
        this.document = null;
        this.currentFile = null;
        this.ruleTypeaheadNode = props?.ruleNode;
        this.node = props?.node ? props.node : new RootNode;
        this.onPdfFile = this.onPdfFile.bind(this);
        this.onPdfFileLoad = this.onPdfFileLoad.bind(this);
        this.onPdfDocument = this.onPdfDocument.bind(this);
        this.onPdfFormFields = this.onPdfFormFields.bind(this);
        this.onPdfPage = this.onPdfPage.bind(this);
        this.onPdfRender = this.onPdfRender.bind(this);
        this.onClickDelete = this.onClickDelete.bind(this);
        this.onBuilderActiveNode = this.onBuilderActiveNode.bind(this);
        this.onScroll = this.onScroll.bind(this);
        this.onResize = this.onResize.bind(this);
    }

    componentDidMount() {
        Events.listen('builder-active-node', this.onBuilderActiveNode);
        window.addEventListener('scroll', this.onScroll);
        window.addEventListener('resize', this.onResize);
    }

    componentWillUnmount() {
        Events.remove('builder-active-node', this.onBuilderActiveNode);
        window.removeEventListener('scroll', this.onScroll);
        window.removeEventListener('resize', this.onResize);
    }
    
    /**
     * PDF file upload event.
     * @param {Event} e 
     */
    onPdfFile(e) {
        if (typeof e.target.files[0] == 'undefined') { return; }
        let file = e.target.files[0];
        if (file && file.type != 'application/pdf') {
            this.setState({error: MSG_FILE_NOT_PDF});
            return;
        }
        let reader = new FileReader;
        this.currentFile = file;
        reader.onload = this.onPdfFileLoad;
        reader.readAsBinaryString(file);
    }

    /**
     * PDF file load event.
     * @param {Event} e 
     */
    onPdfFileLoad(e) {
        let pdfLoadTask = pdfjsLib.getDocument({data: e.target.result});
        pdfLoadTask.promise.then(this.onPdfDocument);
    }

    /**
     * Fires when PDF get document promise is fufilled.
     * @param {pdfjsLib.PDFDocumentProxy} pdf 
     */
    onPdfDocument(pdf) {
        console.log('> PDF loaded.');
        this.setState({pdfLoaded: true});
        this.document = pdf;
        let getFieldPromise = pdf.getFieldObjects();
        getFieldPromise.then(this.onPdfFormFields);
    }

    /**
     * Fires when a PDF get field objects promise is fufilled.
     * @param {Object} fields 
     */
    onPdfFormFields(fields) {
        this.setState(
            {formFields: fields}, function() {
                let fields = this.sortFields();
                if (this.node && this.node.name != this.currentFile.name) {
                    this.node.type = TREE_DOCUMENT_PDF_FORM;
                    this.node.children = [];
                    let fields = this.sortFields();
                    for (let i in fields) {
                        let child = new PdfFieldNode(PdfFieldNode.generateUid());
                        child.setField(fields[i]);
                        this.node.addChild(child);
                    }
                    this.node.name = this.currentFile.name;
                }
                for (let i in fields) {
                    this.highlightField(fields[i].name);
                    return;
                }
                this.highlightField('');
            }.bind(this)
        );       
    }

    /**
     * Fires when a PDF page promise is fufilled.
     * @param {pdfjsLib.PDFPageProxy} page 
     */
    onPdfPage(page) {
        let viewport = page.getViewport({ scale: 1.0 });
        let canvas = document.createElement('canvas');
        let containerElement = document.getElementById(this.canvasId);
        containerElement.innerHTML = '';
        containerElement.appendChild(canvas);
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        let ctx = canvas.getContext('2d');
        let renderTask = page.render({
            canvasContext: ctx,
            viewport,
        });
        renderTask.promise.then(this.onPdfRender);
    }

    /**
     * Fires when a PDF render promise is fufilled.
     */
    onPdfRender() {
        if (!this.state.builderWidth) { this.onResize(); }
        if (this.state.currentField) {
            let canvasContainer = document.getElementById(this.canvasId);
            let canvas = canvasContainer.getElementsByTagName('canvas')[0];
            let ctx = canvas.getContext('2d');
            ctx.fillStyle = "rgba(255, 0, 0, 128)";
            ctx.fillRect(
                this.state.currentField.rect[0],
                canvas.height - this.state.currentField.rect[3],
                this.state.currentField.rect[2] - this.state.currentField.rect[0],
                this.state.currentField.rect[3] - this.state.currentField.rect[1],
            );
        }
    }

    /**
     * @param {Event} e 
     */
    onClickDelete(e) {
        e.preventDefault();
        this.document = null;
        this.currentFile = null;
        this.setState({
            formFields: null,
            currentField: null,
            pdfLoaded: null,
            error: null
        });
    }

    onBuilderActiveNode(e) {
        let node = e.detail.node;
        while (node && !(node instanceof PdfFieldNode)) {
            node = node.getParent(this.node);
        }
        if (node && node?.field) {
            this.highlightField(node.field?.name);
            return;
        }
        this.highlightField('');
    }

    onScroll(e) {
        let containerElement = document.getElementById(this.canvasId);
        if (containerElement) {
            if (!this.pdfViewerTop && containerElement.offsetTop > 0) {
                this.pdfViewerTop = containerElement.offsetTop;
            }
            this.setState({
                pdfScrollFixed: window.scrollY > this.pdfViewerTop
            });
        }
    }

    onResize() {
        let containerElement = document.getElementById(this.canvasId);
        if (containerElement) {
            let marginR = parseFloat(window.getComputedStyle(containerElement).marginRight);
            this.setState({
                builderWidth: window.innerWidth - 40 - (containerElement.offsetLeft + containerElement.offsetWidth + marginR)
            });
        }
    }

    /**
     * Sort form fields by page and position on page (top to bottom, left to right).
     * @returns {Array}
     */
    sortFields() {
        if (!this.state.formFields) { return []; }
        console.log(this.state.formFields);
        let items = Object.keys(this.state.formFields).map(function(key) {
            this.state.formFields[key][0]['name'] = key;
            return this.state.formFields[key][0];
        }.bind(this));
        items.sort(function(a, b) {
            if (a.page != b.page) { return a.page - b.page; }
            if (a.rect[1] != b.rect[1]) { return b.rect[1] - a.rect[1]; }
            return a.rect[0] - b.rect[0];
            
        });
        return items;        
    }

    /**
     * Hightlight given field name in PDF and define current field
     * for the field editor.
     * @param {String} name 
     */
    highlightField(name) {
        if (this.state.formFields && name in this.state.formFields) { 
            this.setState(
                {currentField: this.state.formFields[name][0]}, 
                function() {
                    this.document.getPage(this.state.currentField ? (this.state.currentField.page+1) : 1).then(this.onPdfPage).catch(
                        function(reason) { console.error('> ERROR: ' + reason); }
                    );
                }.bind(this)
            );
            return;
        }
        this.document.getPage(this.state.currentField ? (this.state.currentField.page+1) : 1).then(this.onPdfPage).catch(
            function(reason) { console.error('> ERROR: ' + reason); }
        );
    }

    /**
     * Render form field editor.
     * @returns {*}
     */
    renderFormFieldEditor() {
        return <div className='field-editor'>
            <BuilderComponent key={'builder-' + this.currentFile.name} type={TREE_DOCUMENT_PDF_FORM} node={this.node} ruleNode={this.ruleTypeaheadNode} />
        </div>;
    }

    /**
     * {@inheritdoc}
     */
    render() {
        if (!this.state.pdfLoaded) {
            return <div className='pdf-form'>
                <div className='pure-form pure-form-stacked'>
                    <input type='file' onChange={this.onPdfFile} />
                </div>
                <div className={'alert error' + (this.state.error ? '' : ' hidden')}>
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    &nbsp;{this.state.error}
                </div>
            </div>;
        }
        return <div className='pdf-form loaded'>
            <div className='pdf-file-info'>
                <a href='#' title={BTN_DELETE} onClick={this.onClickDelete}>
                    <FontAwesomeIcon icon={faCircleXmark} />
                </a>
                {this.currentFile.name}
            </div>
            <div key='pdf-viewer' className={'viewer' + (this.state.pdfScrollFixed ? ' fixed' : '')} id={this.canvasId}></div>
            <div className='editor pure-form pure-form-stacked' style={{minWidth: this.state.builderWidth + 'px'}}>
                {this.renderFormFieldEditor()}
            </div>
        </div>
    }

}
