import ReactDOM from 'react-dom';
import shortcode from '../lib/shortcode-parser';
import {BaseShortcode, SHORTCODE_CLASS_NAME, SHORTCODE_DATA_ATTR} from './base';
import Events from '../events';
import Logger from '../logger';

const SHORTCODE_CONTEXT_WEB = 'web';
const SHORTCODE_CONTEXT_PDF = 'pdf';
export default class ShortcodeManager {

    constructor() {
        this.handlers = [];
        this.add = this.add.bind(this);
        this.render = this.render.bind(this);
        this.renderPdf = this.renderPdf.bind(this);
        this.element = document;
        this.context = SHORTCODE_CONTEXT_WEB;
    }

    /**
     * Add shortcode handler.
     * @param {BaseShortcode} h 
     */
    add(h) {
        this.handlers.push(h);
    }

    /**
     * Reset all handlers.
     */
    reset() {
        for (let i in this.handlers) {
            this.handlers[i].reset();
        }
        Events.remove('render', this.render);
    }

    /**
     * Hook shortcode handlers in to shortcode parser.
     */
    hook() {
        Events.dispatch(
            'shortcode_init',
            {
                add: this.add
            }
        );
        for (let i in this.handlers) {
            shortcode.add(
                this.handlers[i].name(),
                this.handlers[i].inject
            );
        }
        this.element = document;
        this.context = SHORTCODE_CONTEXT_WEB;
        Events.listen('render', this.render);
        Events.listen('root_component_update', this.render);
        Events.listen('to_pdf_make', this.renderPdf);
    }

    /**
     * Bind all shortcode injectors to React elements/components.
     */
    render() {
        Logger.resetTimer('ccde_shortcode_render');
        let elements = this.element.getElementsByClassName(SHORTCODE_CLASS_NAME);
        for (let i = 0; i < elements.length; i++) {
            // get id
            let id = elements[i].getAttribute(SHORTCODE_DATA_ATTR);
            if (!id) {
                continue;
            }
            // find handler and collector
            let h = null;
            let c = null;
            for (let j in this.handlers) {
                h = this.handlers[j];
                c = h.getCollectorFromId(id)
                if (c) {
                    break;
                }
            }
            if (!h || !c) {
                continue;
            }
            c.context = this.context;
            elements[i].classList.add('shortcode-' + h.name());
            // render
            ReactDOM.render(
                this.context == SHORTCODE_CONTEXT_PDF ? h.renderPdf(c) : h.render(c),
                elements[i]
            );
        }
        Logger.infoTime('Rendered shortcodes. [CONTEXT=' + this.context + ']', 'ccde_shortcode_render')
    }

    /**
     * Set context to PDF and render.
     * @param {Event} e
     */
    renderPdf(e) {
        this.element = e.detail.element;
        this.context = SHORTCODE_CONTEXT_PDF;
        this.render();
        this.element = document;
        this.context = SHORTCODE_CONTEXT_WEB;
    }

}