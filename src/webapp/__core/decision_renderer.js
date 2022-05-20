import React from 'react';

export default class DecisionRenderer {

    /**
     * Render decision object to DOM element.
     * @param {DecisionBase} object 
     * @param {object} params
     * @return {Element}
     */
    static render(object, params) {
        let component = object.getComponent();
        if (!component) {
            return null;
        }
        return React.createElement(component, 
            Object.assign(
                {
                    key: object.uid,
                    object: object
                },
                params
            )
        );
    }

    /**
     * Render decision object children to DOM element.
     * @param {DecisionBase} object
     * @param {object} params
     * @return {array}
     */
    static renderChildren(object, params) {
        let out = [];
        for (let i in object.children) {
            out.push(DecisionRenderer.render(object.children[i], params));
        }
        return out;
    }

}