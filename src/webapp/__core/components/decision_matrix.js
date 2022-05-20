import React from 'react';
import DecisionBaseComponent from './decision_base.js';
import DecisionRenderer from '../decision_renderer.js';
import DecisionBase from '../decision_objects/base.js';

export default class DecisionMatrixComponent extends DecisionBaseComponent {

    constructor(props) {
        super(props);
        this.state.ids = this.userData.findMatrixIds(this.object);
        this.addItem = this.addItem.bind(this);
        this.removeItem = this.removeItem.bind(this);
    }

    /**
     * {@inheritdoc}
     */
    getTypeName() {
        return 'decision_matrix';
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
        idList.push('m_' + DecisionBase.generateUid());
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
        if (
            typeof(e.detail.object.instanceId) == 'undefined' || 
            e.detail.object.instanceId != this.object.instanceId
        ) { 
            return;
        }
        this.userData = e.detail.userData;
        let values = this.userData.findMatrixIds(this.object);
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
                    {DecisionRenderer.renderChildren(this.object, renderParams)}
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