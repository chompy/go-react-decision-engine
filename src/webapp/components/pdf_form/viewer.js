import React from 'react';

//import 'pdfjs-dist/web/pdf_viewer.css';

export default class PdfViewerComponent extends React.Component {

    constructor(props) {
        super(props);
        this.id = 'pdf-viewer-' + new Date().getTime();
        this.document = props?.document;
        this.onPdfPage = this.onPdfPage.bind(this)
    }


    componentDidMount() {
        this.document.getPage(1).then(this.onPdfPage).catch(
            function(reason) { console.error('> ERROR: ' + reason); }
        );
    }

    onPdfPage(page) {
        let viewport = page.getViewport({ scale: 1.0 });
        let canvas = document.createElement('canvas');
        let containerElement = document.getElementById(this.id);
        containerElement.appendChild(canvas);

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        let ctx = canvas.getContext('2d');
        let renderTask = page.render({
            canvasContext: ctx,
            viewport,
        });
        renderTask.promise.then(this.onPdfRender)
    }

    onPdfRender() {
        
    }

    render() {
        return (<div className="pdf-viewer">
            <div id={this.id}></div>
        </div>);
    }
}