import shortcodeParser from "../lib/shortcode-parser";
import RootNode from "../nodes/root";
import UserData from "../user_data";
import * as ReactDOMServer from 'react-dom/server';

export default class BaseShortcode {

    /** @var {RootNode} */
    static root = null;

    /** @var {UserData} */
    static userData = null;

    constructor() {
        this.callback = this.callback.bind(this);
    }

    /**
     * @return {string}
     */
    name() {
        return 'base';
    }

    /**
     * Hook shortcode.
     */
    hook() {
        shortcodeParser.add(
            this.name(),
            this.callback
        );
    }

    /**
     * @param {Object} c
     * @return {*}
     */
    render(c) {
        return null;
    }

    /**
     * @param {*} buf 
     * @param {*} opts 
     * @returns {string}
     */
    callback(buf, opts) {
        let rendered = this.render({
            id: '',
            buf: buf,
            opts: opts
        });
        return ReactDOMServer.renderToStaticMarkup(rendered);
    }

}