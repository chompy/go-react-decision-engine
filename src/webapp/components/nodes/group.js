import React from 'react';
import Renderer from '../../renderer';
import BaseNodeComponent from './base';

export default class GroupNodeComponent extends BaseNodeComponent {

    constructor(props) {
        super(props);
        this.contentHtml = '';
    }

    /**
     * {@inheritdoc}
     */
    getTypeName() {
        return 'group';
    }

    /**
     * {@inheritdoc}
     */
    render() {
        if (!this.state.visible) {
            return null;
        }
        // prepare content html
        if (!this.contentHtml) {
            // parse shortcode
            this.contentHtml = this.parseShortcode(this.node.content);
            // inject embeds
            if (typeof this.props.embeds != 'undefined') {
                for (let key in this.props.embeds) {
                    this.contentHtml = this.contentHtml.replaceAll(key, this.props.embeds[key]);
                }
            }
        }
        let renderParams = {
            userData: this.userData,
            checkValidation: typeof this.props.checkValidation != 'undefined' && this.props.checkValidation,
            embeds: typeof this.props.embeds != 'undefined' ? this.props.embeds : null,
            readOnly: this.readOnly,
            matrix: this.matrix
        };
        return <div className={this.getClass()} id={this.getId()}>
            {this.renderOptions()}
            <div className='content' dangerouslySetInnerHTML={{ __html: this.contentHtml }} />
            <div className='children'>
                {Renderer.renderChildren(this.node, renderParams)}
            </div>
        </div>;
    }

}