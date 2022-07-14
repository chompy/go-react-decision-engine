import React from 'react';
import * as pdfjsLib from 'pdfjs-dist/webpack';
import PdfViewerComponent from './viewer';

export default class PdfFormComponent extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            pdfLoaded: false,
            formFields: {}
        };
        this.canvasId = 'pdf-viewer-' + new Date().getTime();
        this.document = null;
        this.currentField = null;
        this.onPdfFile = this.onPdfFile.bind(this);
        this.onPdfFileLoad = this.onPdfFileLoad.bind(this);
        this.onPdfDocument = this.onPdfDocument.bind(this);
        this.onPdfFormFields = this.onPdfFormFields.bind(this);
        this.onPdfPage = this.onPdfPage.bind(this);
        this.onPdfRender = this.onPdfRender.bind(this);
        this.onSelectField = this.onSelectField.bind(this);
    }

    onPdfFile(e) {
        if (typeof e.target.files[0] == 'undefined') { return; }
        let file = e.target.files[0];
        let reader = new FileReader;
        reader.onload = this.onPdfFileLoad;
        reader.readAsBinaryString(file);
    }

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
        this.setState({formFields: fields});
        for (let n in this.state.formFields) {
            this.highlightField(n);
            break;
        }
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

    onPdfRender() {

        if (this.currentField) {
            let canvasContainer = document.getElementById(this.canvasId);
            let canvas = canvasContainer.getElementsByTagName('canvas')[0];
            let ctx = canvas.getContext('2d');
            ctx.fillStyle = "rgba(255, 0, 0, 128)";
            ctx.fillRect(
                this.currentField.rect[0],
                canvas.height - this.currentField.rect[3],
                this.currentField.rect[2] - this.currentField.rect[0],
                 this.currentField.rect[3] - this.currentField.rect[1],
            );
        }

    }

    onSelectField(e) {
        this.highlightField(e.target.value);
    }

    highlightField(name) {
        if (!(name in this.state.formFields)) { return; }
        this.currentField = this.state.formFields[name][0];
        this.document.getPage(this.currentField.page+1).then(this.onPdfPage).catch(
            function(reason) { console.error('> ERROR: ' + reason); }
        );
    }

    /**
     * {@inheritdoc}
     */
     render() {
        if (!this.state.pdfLoaded) {
            return <div className='pdf-form pure-form pure-form-stacked'>
                <input type='file' onChange={this.onPdfFile} />
            </div>;
        }
        let fieldOptions = [];
        for (let n in this.state.formFields) {
            fieldOptions.push(
                <option key={'pdf-field-' + n} value={n}>{n}</option>
            );
        }
        return <div className='pdf-form'>
            <div className='viewer' id={this.canvasId}></div>
            <div className='editor pure-form pure-form-stacked'>
                <select className='pure-form' onChange={this.onSelectField}>{fieldOptions}</select>
            </div>
        </div>
    }

}
