import { faX } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import { BTN_DELETE } from '../config';
export default class QuestionFileComponent extends React.Component {

    constructor(props) {
        super(props);
        let data = props.data.split('|');
        this.name = data[0];
        this.type = data[1];
        this.data = data[2];
        this.deleteCallback = props?.onDelete;
        this.onDelete = this.onDelete.bind(this);
    }

    /**
     * Event handler for when delete button is clicked
     * @param {Event} e 
     */
    onDelete(e) {
        e.preventDefault();
        if (this.deleteCallback) {
            this.deleteCallback(this.props.data);
        }
    }

    /**
     * @inheritdoc
     */
    render() {
        let typeClass = this.type.split('/')[1];
        let dataUri = 'data:' + this.type + ';base64,' + this.data;
        return <div className={'file type-' + typeClass}>
            <a href='#' onClick={this.onDelete} className='delete' alt={BTN_DELETE} title={BTN_DELETE}>
                <FontAwesomeIcon icon={faX} />
            </a>
            <a target='_blank' href={dataUri}>{this.name}</a>
        </div>;
    }

}