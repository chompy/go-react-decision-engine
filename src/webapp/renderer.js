import React from 'react';
import BaseNode from './objects/base';

export default class Renderer {

    /**
     * Render decision node to DOM element.
     * @param {BaseNode} node 
     * @param {object} params
     * @return {Element}
     */
    static render(node, params) {
        let component = node.getComponent();
        if (!component) {
            return null;
        }
        return React.createElement(component, 
            Object.assign(
                {
                    key: object.uid,
                    node: node
                },
                params
            )
        );
    }

    /**
     * Render decision node children to DOM element.
     * @param {BaseNode} node
     * @param {object} params
     * @return {array}
     */
    static renderChildren(node, params) {
        let out = [];
        for (let i in node.children) {
            out.push(Renderer.render(node.children[i], params));
        }
        return out;
    }

}