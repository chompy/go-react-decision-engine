export const SHORTCODE_CLASS_NAME = 'ccde-shortcode-injector';
export const SHORTCODE_ID_PREFIX = 'ccde-shortcode-';
export const SHORTCODE_DATA_ATTR = 'data-id';

export default class BaseShortcode {

    /** @var int */
    static injectCounter = 0;

    constructor() {
        this.inject = this.inject.bind(this);
        this.collector = [];
    }

    /**
     * Name of short code.
     * @return {string}
     */
    name() {
        return 'base';
    }

    /**
     * @returns {bool}
     */
    isInline() {
        return true;
    }

    /**
     * Inject shortcode in to render decision document/form.
     * @param {*} buf 
     * @param {*} opts 
     */
    inject(buf, opts) {
        BaseShortcode.injectCounter++;
        let id = `${this.name()}-${BaseShortcode.injectCounter}`;
        let data = {
            id: id,
            buf: buf,
            opts: opts
        }
        this.collector.push(data);
        if (this.isInline()) {
            return `<span class='${SHORTCODE_CLASS_NAME}' id='${SHORTCODE_ID_PREFIX}${data.id}' ${SHORTCODE_DATA_ATTR}='${data.id}'></span>`;
        }
        return `<div class='${SHORTCODE_CLASS_NAME}' id='${SHORTCODE_ID_PREFIX}${data.id}' ${SHORTCODE_DATA_ATTR}='${data.id}'></div>`;
    }

    /**
     * Reset all instances.
     */
    reset() {
        this.collector = [];
    }

    /**
     * Render React element/component.
     * @param {object} c Collector with data needed to render
     */
    render(c) {
        return null;
    }

    /**
     * Render element for PDF creation.
     * @param {object} c 
     */
    renderPdf(c) {
        return '';
    }

    /**
     * @param {string} id 
     * @return {object}
     */
    getCollectorFromId(id) {
        for (let i in this.collector) {
            if (this.collector[i].id == id) {
                return this.collector[i];
            }
        }
        return null;
    }

}