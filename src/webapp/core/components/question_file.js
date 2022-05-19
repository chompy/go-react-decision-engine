
import React from 'react';
import Events from '../events';

export default class QuestionFileComponent extends React.Component {

    constructor(props) {
        super(props);
        let data = props.data.split('|');
        this.name = data[0];
        this.type = data[1];
        this.data = data[2];
        this.isPdf = (typeof(props.isPdf) != 'undefined' && props.isPdf);
        this.uri = (typeof(props.uri) != 'undefined' ? props.uri : '');
        this.onDelete = this.onDelete.bind(this);
    }

    /**
     * Event handler for when delete button is clicked
     * @param {Event} e 
     */
    onDelete(e) {
        e.preventDefault();
        Events.dispatch(
            'change',
            {
                question: this.props.object,
                answer: this.props.data,
                multiple: true,
                delete: true
            }
        );
    }

    /**
     * @inheritdoc
     */
    render() {
        let typeClass = this.type.split('/')[1];
        if (this.isPdf) {
            return <span className={'file type-' + typeClass}>
                <a className='file-name' href={this.uri}>{this.name}</a>
                <a className='file-uri' href={this.uri}> ({this.uri})</a>
            </span>;
        }
        let dataUri = 'data:' + this.type + ';base64,' + this.data;
        return <div className={'file type-' + typeClass}>
            <a href='#' onClick={this.onDelete} className='delete'>x</a>
            <a target='_blank' href={dataUri}>{this.name}</a>
        </div>;
    }

}