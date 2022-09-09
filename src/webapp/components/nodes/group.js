import React from 'react';
import GroupNode from '../../nodes/group';
import BaseNodeComponent from './base';
import MatrixNodeComponent from './matrix';
import QuestionNodeComponent from './question';

export default class GroupNodeComponent extends BaseNodeComponent {

    constructor(props) {
        super(props);
        this.contentHtml = '';
    }

    /**
     * Get node type name.
     * @return {String}
     */
    static getTypeName() {
        return 'group';
    }

    /**
     * {@inheritdoc}
     */
    availableChildTypes() {
        return [
            GroupNodeComponent,
            QuestionNodeComponent,
            MatrixNodeComponent
        ];
    }

    /**
     * {@inheritdoc}
     */
    render() {
        if (!(this.node instanceof GroupNode) || !this.state.visible) { return null; }
        if (!this.contentHtml) {
            this.contentHtml = this.parseShortcode(this.node.content);
        }
        return <div className={this.getClass()}>
            <div className='tree-content' dangerouslySetInnerHTML={{ __html: this.contentHtml }} />
            <div className='tree-children'>{this.renderChildren()}</div>
        </div>;
    }

}