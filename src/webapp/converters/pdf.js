
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import Logger from '../logger.js';
import DecisionUserData from '../user_data.js';
import Events from '../events';
import BaseNode from '../objects/base.js';
import BaseConverter from './base.js';
import GroupNode from '../objects/group.js';

const PDF_FONT_SIZE_MULTIPLIER = .6;
const PDF_BORDER_WIDTH_MULTIPLIER = .25;
const PDF_PADDING_MULTIPLIER = .5;
const PDF_MARGIN_MULTIPLIER = .5;

export default class PdfConverter extends BaseConverter {

    /**
     * @var {Array}
     */
    static inlineElements = ['#text', 'span', 'strong', 'bold', 'b', 'em', 'i', 'u', 'a'];

    /**
     * @var {Array}
     */
    static headerFontSizes = [20, 18, 16, 14, 12, 10];

    /**
     * Convert NodeList to pdfmake config.
     * @param {NodeList} nodeList
     * @param {object} params
     * @return {Array}
     */
    static nodeListToPdfMake(nodeList, params) {
        let out = [];
        for (let i = 0; i < nodeList.length; i++) {
            let node = nodeList[i];
            if (!node.textContent.trim()) {
                continue;
            }
            switch (node.nodeName.toLowerCase()) {
                case 'strong':
                case 'bold':
                case 'b': 
                {
                    let styles = PdfConverter.getStyles(node);
                    if (!styles._visible) { return out; }
                    out = out.concat(
                        PdfConverter.nodeListToPdfMake(
                            node.childNodes,
                            Object.assign(
                                { bold: true }, params, styles
                            )
                        )
                    );
                    break;
                }
                case 'em':
                case 'i':
                {
                    let styles = PdfConverter.getStyles(node);
                    if (!styles._visible) { return out; }
                    out = out.concat(
                        PdfConverter.nodeListToPdfMake(
                            node.childNodes,
                            Object.assign(
                                { italics: true }, params, styles
                            )
                        )
                    );
                    break;
                }
                case 'u':
                {
                    let styles = PdfConverter.getStyles(node);
                    if (!styles._visible) { return out; }
                    out = out.concat(
                        PdfConverter.nodeListToPdfMake(
                            node.childNodes,
                            Object.assign(
                                { decoration: 'underline' }, params, styles
                            )
                        )
                    );
                    break;
                }
                case 'a':
                {
                    let styles = PdfConverter.getStyles(node);
                    if (!styles._visible) { return out; }
                    let link = node.getAttribute('href').trim();
                    if (link && link[0] != '#' && link.indexOf('://') == -1) {
                        link = window.location.protocol + '//' + window.location.host + '/' + (link[0] == '/' ? link.substring(1) : link);
                    }
                    out = out.concat(
                        PdfConverter.nodeListToPdfMake(
                            node.childNodes,
                            Object.assign(
                                { 
                                    link: link, 
                                    decoration: 'underline',
                                    decorationColor: 'blue',
                                    color: 'blue' 
                                }, 
                                styles,
                                params
                            )
                        )
                    );
                    break;
                }
                case 'h1':
                case 'h2':
                case 'h3':
                case 'h4':
                case 'h5':
                case 'h6':
                {
                    let styles = PdfConverter.getStyles(node);
                    if (!styles._visible) { return out; }
                    let header = node.nodeName[1];
                    let fontSize = PdfConverter.headerFontSizes[header-1];
                    out.push(
                        PdfConverter.buildFilledBox(
                            Object.assign(
                                { text: node.textContent, tocItem: true, fontSize: fontSize, bold: true }, styles, params
                            )
                        )
                    );
                    break;
                }
                case 'ul':
                {
                    // TODO pdfmake should support ul/ol but it wasn't working
                    let styles = PdfConverter.getStyles(node);
                    if (!styles._visible) { return out; }
                    for (let i = 0; i < node.childNodes.length; i++) {
                        let element = node.childNodes[i];
                        out.push(
                            Object.assign(
                                {
                                    text: [{text: '• ', bold: true}, element.textContent + '\n']
                                },
                                params
                            )
                        );
                    }
                    break;
                }
                case 'ol':
                {
                    let styles = PdfConverter.getStyles(node);
                    if (!styles._visible) { return out; }
                    for (let i = 0; i < node.childNodes.length; i++) {
                        let element = node.childNodes[i];
                        out.push(
                            Object.assign(
                                {
                                    text: [{text: (i+1) + '. '}, element.textContent + '\n']
                                },
                                params
                            )
                        );
                    }
                    break;
                }
                case 'img':
                {
                    let styles = PdfConverter.getStyles(node);
                    if (!styles._visible) { return out; }
                    let w = node.getAttribute('width');
                    let h = node.getAttribute('height');
                    let imgParams = Object.assign(
                        {
                            image: node.getAttribute('src')
                        },
                        styles
                    );
                    /*if (w) {
                        imgParams['width'] = w;
                    }
                    if (h) {
                        imgParams['height'] = h;
                    }*/
                    out.push(imgParams);
                    break;
                }
                case '#text':
                {
                    out.push(
                        Object.assign(
                            {
                                text: node.textContent
                            },
                            params
                        )
                    );
                    break;
                }
                case 'p':
                {
                    let styles = PdfConverter.getStyles(node);
                    if (!styles._visible) { return out; }
                    let isInline = true;
                    for (let j = 0; j < node.childNodes.length; j++) {
                        if (PdfConverter.inlineElements.indexOf(node.childNodes[j].nodeName.toLowerCase()) == -1) {
                            isInline = false;
                            break;
                        }
                    }
                    if (isInline) {
                        out.push(
                            PdfConverter.buildFilledBox(
                                Object.assign(
                                    {
                                        text: PdfConverter.nodeListToPdfMake(node.childNodes, params)
                                    },
                                    styles
                                )                 
                            )
                        );
                        break;
                    }
                    out.push(
                        PdfConverter.buildFilledBox(
                            Object.assign(
                                {
                                    stack: PdfConverter.nodeListToPdfMake(node.childNodes, params)
                                },
                                styles
                            )                 
                        )
                    );
                    break;
                }
                case 'span':
                {
                    let styles = PdfConverter.getStyles(node);
                    if (!styles._visible) { return out; }
                    out.push(
                        PdfConverter.buildFilledBox(
                            Object.assign(
                                {
                                    //text: node.textContent.trim()
                                    text: PdfConverter.nodeListToPdfMake(node.childNodes, params)
                                },
                                styles
                            )
                        )
                    );  
                    break;
                }
                case 'table':
                {
                    let styles = PdfConverter.getStyles(node);
                    if (!styles._visible) { return out; }
                    if (!params) {
                        params = {};
                    }
                    let widths = [];
                    let body = [];
                    let trList = node.getElementsByTagName('tr');
                    for (let j = 0; j < trList.length; j++) {
                        let bodyIn = [];
                        for (let k = 0; k < trList[j].childNodes.length; k++) {
                            if (j == 0) {
                                // TODO calculate width
                                widths.push('auto');
                            }
                            let styles = PdfConverter.getStyles(trList[j].childNodes[k]);

                            bodyIn.push(
                                PdfConverter.nodeListToPdfMake(
                                    trList[j].childNodes[k].childNodes,
                                    Object.assign({
                                        fillColor: styles._boxBackgroundColor,
                                    }, styles, params)
                                )[0]
                            );
                        }
                        body.push(bodyIn);
                    }
                    out.push({
                        margin: (typeof(params.margin) != 'undefined' ? params.margin : false),
                        table: {
                            widths: widths,
                            headerRows: 1,
                            body: body
                        }
                    });
                    break;
                }
                default:
                {
                    let styles = PdfConverter.getStyles(node);
                    if (!styles._visible) { return out; }
                    out.push(
                        PdfConverter.buildFilledBox(
                            Object.assign(
                                {
                                    stack: PdfConverter.nodeListToPdfMake(node.childNodes, params)
                                },
                                styles
                            )
                        )
                    );  
                    break;
                }
            }
        }
        return out;
    }

    static convertDecisionNode(node, userData) {
        // hidden, skip
        if (userData.isHidden(node)) {
            return [];
        }
        let out = [];
        // render group, so far group is the only node we care to render in a pdf
        if (node instanceof GroupNode) {
            let element = document.createElement('div');
            element.id = 'decision-engine-pdf';
            let innerElement = document.createElement('div');
            innerElement.className = 'group_content' +
                ' level-' + this.level + 
                ' priority-' + this.priority +
                (this.tags.length > 0 ? ' tag-' + this.tags.join(' tag-') : '')
            ;
            innerElement.innerHTML = shortcode.parse(this.content);
            element.appendChild(innerElement);
            Events.dispatch('to_pdf_make', {
                node: this,
                element: element
            });
            document.getElementsByTagName('body')[0].appendChild(element);
            out.push(PdfConverter.nodeListToPdfMake(element.childNodes));
            document.getElementsByTagName('body')[0].removeChild(element);
        }
        // itterate children
        for (let i in node.children) {
            out = out.concat(PdfConverter.convertDecisionNode(node.children[i], userData));
        }
        return out;
    }

    /**
     * Build and download PDF.
     * @param {BaseNode} node
     * @param {DecisionUserData} userData
     */
    static build(node, userData) {
        Logger.resetTimer('ccde_pdf');
        let prependContentDef = [];
        let appendContentDef = [];
        let vfs = pdfFonts.pdfMake.vfs;
        let fonts = {
            Roboto: {
                normal: 'Roboto-Regular.ttf',
                bold: 'Roboto-Medium.ttf',
                italics: 'Roboto-Italic.ttf',
                bolditalics: 'Roboto-MediumItalic.ttf'
            }
        };
        let appendDef = {};
        Events.dispatch(
            'pdf_pre_build',
            {
                setVfs: function(data) {
                    vfs = data;
                },
                setFonts: function(data) {
                    fonts = data;
                },
                prependContentDef: function(data) {
                    prependContentDef = data;
                },
                appendContentDef: function(data) {
                    appendContentDef = data;
                },
                appendDef: function(data) {
                    appendDef = data;
                }
            }
        );
        let def = {
            pageSize: 'LETTER',
            content: prependContentDef.concat(PdfConverter.convertDecisionNode(node, userData), appendContentDef)
        };
        if (fonts.length > 0) {
            def['defaultStyle'] = Array.keys(fonts)[0];
        }
        let out = pdfMake.createPdf(
            Object.assign({}, def, appendDef),
            null,
            fonts,
            vfs
        ).getBlob();
        Logger.infoTime(`Generated PDF. [UID=${node.uid}]`, 'ccde_pdf');
        return out;
    }

    /**
     * Get styles for given node and convert to PDF make styles.
     * @param {*} node 
     * @return {object}
     */
    static getStyles(node) {
        let styles = window.getComputedStyle(node);
        let rgb2Hex = function(rgb) {  
            rgb = rgb.match(/^rgb[a]?\((\d+), \s*(\d+), \s*(\d+)(, \s*(\d+))?\)$/);  
            function hexCode(i) {  
                return ('0' + parseInt(i).toString(16)).slice(-2); 
            }  
            return '#' + hexCode(rgb[1]) + hexCode(rgb[2])  
                + hexCode(rgb[3]);  
        } 
        let out = {};
        out['_visible'] = true;
        if (styles.display == 'none') {
            out['_visible'] = false;
            return out;
        }
        if (styles.color) {
            out['color'] = rgb2Hex(styles.color);
        }
        if (styles.fontSize) {
            out['fontSize'] = parseInt(parseInt(styles.fontSize) * PDF_FONT_SIZE_MULTIPLIER);
        }
        if (styles.fontWeight > 400) {
            out['bold'] = true;
        }
        if (styles.fontStyle == 'italic') {
            out['italics'] = true;
        }
        if (['left', 'center', 'right'].indexOf(styles.textAlign) != -1) {
            out['alignment'] = styles.textAlign;
        }
        switch(styles.textDecorationLine) {
            case 'line-through': {
                out['decoration'] = 'lineThrough';
                break;
            }
            case 'underline': 
            case 'overline': {
                out['decoration'] = styles.getPropertyValue('text-decoration-line');
                break;
            }
        }
        if (styles.textDecorationColor) {
            out['decorationColor'] = rgb2Hex(styles.textDecorationColor);
        }
        if (styles.lineHeight) {
            out['lineHeight'] = 1.2;
        }
        let margins = [
            parseInt(styles.marginLeft) * PDF_MARGIN_MULTIPLIER, parseInt(styles.marginTop) * PDF_MARGIN_MULTIPLIER,
            parseInt(styles.marginRight) * PDF_MARGIN_MULTIPLIER, parseInt(styles.marginBottom) * PDF_MARGIN_MULTIPLIER
        ];
        out['margin'] = margins;
        // page break
        if (styles.pageBreakAfter == 'always') {
            out['pageBreak'] = 'after';
        } else if (styles.pageBreakBefore == 'always') {
            out['pageBreak'] = 'before';
        }
        // filled/bordered box
        out['_needBox'] = false;
        out['_boxBackgroundColor'] = false;
        out['_boxBorderColor'] = false;
        out['_boxBorder'] = [false, false, false, false];
        out['_boxBorderWidth'] = 0;
        out['_boxPadding'] = [5, 5, 5, 5];
        if (styles.backgroundColor && styles.backgroundColor != 'rgba(0, 0, 0, 0)') {
            out['_needBox'] = true;
            out['_boxBackgroundColor'] = rgb2Hex(styles.backgroundColor);
        }
        if (styles.borderBottomColor && styles.borderBottomColor != 'rgba(0, 0, 0, 0)') {
            out['_borderColor'] = rgb2Hex(styles.borderBottomColor);
        }
        if (styles.borderBottomWidth) {
            out['_boxBorderWidth'] = Math.ceil(styles.borderBottomWidth.replace('px', ''));
        }
        let borderStyleProps = ['borderLeftStyle', 'borderRightStyle', 'borderTopStyle', 'borderBottomStyle'];
        for (let key in borderStyleProps) {
            out['_boxBorder'][key] = false;
            if (styles[borderStyleProps[key]] && styles[borderStyleProps[key]] != 'none') {
                out['_needBox'] = true;
                out['_boxBorder'][key] = true;
            }
        }
        let boxPaddingProps = ['paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom'];
        for (let key in boxPaddingProps) {
            out['_boxPadding'][key] = Math.ceil(styles[boxPaddingProps[key]].replace('px', ''));
        }
        return out;
    }

    /**
     * Wrap given parameters in a filled box (table with background color)
     * @param {*} params 
     */
    static buildFilledBox(params) {
        if (!params._needBox) {
            return params;
        }
        return {
            margin: (typeof(params.margin) != 'undefined' ? params.margin : false),
            table: {
                widths: ['*'],
                body: [
                    [
                        Object.assign({}, {border: params._boxBorder}, params, {margin: false, padding: false})
                    ]
                ]
            },
            layout: {
                fillColor: params._boxBackgroundColor,
                hLineWidth: function(i, node) { return params._boxBorderWidth * PDF_BORDER_WIDTH_MULTIPLIER },
                vLineWidth: function(i, node) { return params._boxBorderWidth * PDF_BORDER_WIDTH_MULTIPLIER },
                hLineColor: function(i, node) { return params._boxBorderColor },
                vLineColor: function(i, node) { return params._boxBorderColor },
                paddingLeft: function(i, node) { return params._boxPadding[0] * PDF_PADDING_MULTIPLIER },
                paddingRight: function(i, node) { return params._boxPadding[1] * PDF_PADDING_MULTIPLIER },
                paddingTop: function(i, node) { return params._boxPadding[2] * PDF_PADDING_MULTIPLIER },
                paddingBottom: function(i, node) { return params._boxPadding[3] * PDF_PADDING_MULTIPLIER },
            }
        };
    }

    /**
     * {@inheritdoc}
     */
    export(node) {
        return PdfConverter.build(node, this.userData ? this.userData : new DecisionUserData(''));
    }

}