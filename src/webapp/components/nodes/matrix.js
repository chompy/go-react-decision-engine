import { faMinusCircle, faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import { BTN_ADD, BTN_DELETE, BTN_REMOVE } from '../../config';
import BaseNode from '../../nodes/base';
import MatrixNode from '../../nodes/matrix';
import BaseNodeComponent from './base';
import QuestionNodeComponent from './question';

export default class MatrixNodeComponent extends BaseNodeComponent {

    constructor(props) {
        super(props);
        this.state.ids = this.userData.findMatrixIds(this.node);
        this.onClickAddItem = this.onClickAddItem.bind(this);
        this.onClickRemoveItem = this.onClickRemoveItem.bind(this);
    }

    /**
     * Get node type name.
     * @return {String}
     */
    static getTypeName() {
        return 'matrix';
    }

    /**
     * {@inheritdoc}
     */
    availableChildTypes() {
        return [
            QuestionNodeComponent
        ];
    }

    /**
     * Add new item to matrix.
     * @param {Event} e 
     */
    onClickAddItem(e) {
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
    onClickRemoveItem(e) {
        e.preventDefault();
        let matrixId = e.target.getAttribute('data-matrix');
        if (!this.userData || !matrixId) { return; }
        let idList = [];
        for (let i in this.state.ids) {
            if (this.state.ids[i] != matrixId) {
                idList.push(this.state.ids[i]);
            }
        }
        this.userData.resetMatrix(matrixId);
        this.setState({ ids: idList });
    }

    /**
     * {@inheritdoc}
     */
    render() {
        if (!(this.node instanceof MatrixNode) || !this.state.visible) { return null; }
        let children = [];
    let origMatrx = this.matrix;
        for (let i in this.state.ids) {
            this.matrix = this.state.ids[i];
            children.push(
                <div key={this.matrix} className='matrix-item' data-matrix={this.matrix}>
                    {this.renderChildren()}
                    <button
                        className='pure-button'
                        onClick={this.onClickRemoveItem}
                        title={BTN_REMOVE}
                        data-matrix={this.matrix}
                    >
                        <FontAwesomeIcon icon={faMinusCircle} /> {BTN_REMOVE}
                    </button>
                </div>
            );
        }
        this.matrix = origMatrx;

        return <div className={this.getClass()} id={this.getId()}>
            <div className='tree-children'>{children}</div>
            <div className='matrix-options'>
                <button
                    className='pure-button'
                    onClick={this.onClickAddItem}
                    title={BTN_ADD}
                >
                    <FontAwesomeIcon icon={faPlusCircle} /> {BTN_ADD}
                </button>
            </div>
        </div>;
    }

}