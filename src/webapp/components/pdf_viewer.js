import React from 'react';
import { PDFDocument } from 'pdf-lib';
import PdfFieldNode from '../nodes/pdf_field';
import PdfFieldMapNode from '../nodes/pdf_field_map';
import PdfFieldValueNode from '../nodes/pdf_field_value';
import RootNode from '../nodes/root';
import UserData from '../user_data';

export default class PdfViewerComponent extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            pdfLoaded: false,
        };
        this.docTree = props?.document ? props.document : new RootNode;
        this.formTree = props?.form ? props.form : new RootNode;
        this.userData = props?.userData ? props.userData : new UserData;
        this.pdfCallback = props?.callback;
        this.pdfData = null;
        this.pdfIframeRef = React.createRef();
        this.onResize = this.onResize.bind(this);
    }

    /**
     * {@inheritDoc}
     */
    componentDidMount() {
        this.generatePdf();
        window.addEventListener('resize', this.onResize);
    }

    /**
     * {@inheritDoc}
     */
    componentWillUnmount() {
        window.removeEventListener('resize', this.onResize);
    }

    /**
     * {@inheritDoc}
     */
    componentDidUpdate() {
        this.onResize();
    }

    /**
     * Fires on window resize. Resize PDF iframe.
     */
    onResize() {
        const node = this.pdfIframeRef.current;
        if (!node) { return; }
        node.style.height =  (window.innerHeight - node.offsetTop - 32) + 'px';
    }
    
    /**
     * Get PDF field values.
     * @returns {Object}
     */
    getFields() {
        let out = {};
        for (let i in this.docTree.children) {
            let field = this.docTree.children[i];
            if (field instanceof PdfFieldNode) {
                if (!field.fieldName) { continue; }
                out[field.fieldName] = [];
                for (let j in field.children) {
                    let fieldValue = field.children[j];
                    if (this.userData.isHidden(fieldValue, this.docTree)) { continue; }
                    if (fieldValue instanceof PdfFieldValueNode) {
                        if (fieldValue.value) {
                            out[field.fieldName].push(fieldValue.value);
                        }
                    } else if (fieldValue instanceof PdfFieldMapNode) {
                        out[field.fieldName] = out[field.fieldName].concat(
                            fieldValue.getFieldValues(this.formTree, this.userData)
                        );
                    }
                }
            }
        }
        return out;
    }

    /**
     * Generate PDF file with form field values set.
     */
    generatePdf() {
        if (!this.docTree.data.pdfB64) { return; }
        let fields = this.getFields();
        PDFDocument.load(this.docTree.data.pdfB64).then(
            doc => {
                const form = doc.getForm();
                for (let name in fields) {
                    try {
                        let field = form.getTextField(name);
                        if (fields[name].length > 0) {
                            field.setText(fields[name][0]);
                        }
                        continue;
                    } catch {}
                    try {
                        let field = form.getCheckBox(name);
                        field.uncheck();
                        if (fields[name] && fields[name].length > 0) {
                            field.check();
                        }
                        continue;
                    } catch {}
                    try {
                        let field = form.getDropdown(name);
                        field.select(fields[name]);
                        continue;
                    } catch {}
                }
                doc.save().then(
                    res => {
                        let b = new Blob([res], { type: 'application/pdf' });
                        let reader = new FileReader;
                        reader.onload = function(e) {
                            this.pdfData = e.target.result;
                            if (this.pdfCallback) {
                                this.pdfCallback(this.pdfData);
                            }
                            this.setState({pdfLoaded: true});
                        }.bind(this);
                        reader.readAsDataURL(b);
                    }
                )
            }
        );
    }

    /**
     * {@inheritDoc}
     */
    render() {
        if (!this.state.pdfLoaded) {
            return <div className='pdf-viewer loading'></div>;
        }
        return <div className='pdf-viewer'>
            <iframe ref={this.pdfIframeRef} src={this.pdfData} />
        </div>;
    }

}