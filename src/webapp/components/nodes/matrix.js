import React from 'react';
import BaseNodeComponent from './base';
import Renderer from '../../renderer';
import BaseNode from '../../objects/base';

export default class MatrixNodeComponent extends BaseNodeComponent {

    constructor(props) {
        super(props);
        this.state.ids = this.userData.findMatrixIds(this.node);
        this.addItem = this.addItem.bind(this);
        this.removeItem = this.removeItem.bind(this);
    }

    /**
     * {@inheritdoc}
     */
    getTypeName() {
        return 'matrix';
    }

    /**
     * {@inheritdoc}
     */
    getOptions() {
        let options = super.getOptions();
        options.push(['add_matrix', 'Add', this.addItem])
        return options;
    }

    /**
     * Add new item to matrix.
     * @param {Event} e 
     */
    addItem(e) {
        e.preventDefault();
        let idList = this.state.ids;
        idList.push('m_' + BaseNode.generateUid());
        this.setState({
            ids: idList
        });
    }

    /**
     * Remove item from matrix.
     * @param {Event} e 
     */
    removeItem(e) {
        e.preventDefault();
        let matrixId = e.target.getAttribute('data-matrix');
        if (!this.userData || !matrixId) {
            return;
        }
        let idList = [];
        for (let i in this.state.ids) {
            if (this.state.ids[i] != matrixId) {
                idList.push(this.state.ids[i]);
            }
        }
        this.userData.resetMatrix(matrixId);
        this.setState({
            ids: idList
        });
    }

    /**
     * {@inheritdoc}
     */
     onUpdate(e) {
        this.userData = e.detail.userData;
        let values = this.userData.findMatrixIds(this.node);
        if (
            (!this.state.ids || this.state.ids < values.length) &&
            values.length > 0
        ) {
            this.setState({
                ids: values
            });
        }
    }

    /**
     * {@inheritdoc}
     */
    render() {
        if (!this.state.visible) {
            return null;
        }
        let children = [];
        for (let i in this.state.ids) {
            let renderParams = {
                userData: this.userData ,
                embeds: typeof this.props.embeds != 'undefined' ? this.props.embeds : null,
                readOnly: this.readOnly,
                matrix: this.state.ids[i]
            };
            children.push(
                <div key={'matrix-item-' + renderParams.matrix} className='matrix-item'>
                    {Renderer.renderChildren(this.node, renderParams)}
                    <a href='#' onClick={this.removeItem} data-matrix={renderParams.matrix}>Remove</a>
                </div>
            );
        }
        return <div className={this.getClass()} id={this.getId()}>
            {this.renderOptions()}
            <div className='children'>{children}</div>
        </div>;
    }

}