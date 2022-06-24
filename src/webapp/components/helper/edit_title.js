import React from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencil, faCircleXmark, faCircleCheck } from '@fortawesome/free-solid-svg-icons'
import { BTN_CANCEL, BTN_EDIT, BTN_SUBMIT } from "../../config";

export default class EditTitleComponent extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            edit: false,
            title: typeof props.title != 'undefined' ? props.title : 'Untitled'
        };
        this.originalTitle = this.state.title;
        this.callback = typeof props.callback != 'undefined' ? props.callback : null;
        this.onClickEdit = this.onClickEdit.bind(this);
        this.onClickCancel = this.onClickCancel.bind(this);
        this.onInputChange = this.onInputChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
    }

    /**
     * @param {Event} e 
     */
    onClickEdit(e) {
        e.preventDefault();
        this.setState({edit: true})
    }
    
    /**
     * @param {Event} e 
     */
    onClickCancel(e) {
        e.preventDefault();
        this.setState({edit: false, title: this.originalTitle});
    }

    /**
     * @param {Event} e 
     */
    onInputChange(e) {
        this.setState({
            title: e.target.value
        });
    }

    /**
     * @param {Event} e 
     */
    onSubmit(e) {
        e.preventDefault();
        this.originalTitle = this.state.title;
        this.setState({edit: false});
        if (this.callback) {
            this.callback(this.state.title);
        }
    }

    /**
     * {@inheritDoc}
     */
    render() {

        if (this.state.edit) {
            return <div className='edit-title helper edit'>
                <form onSubmit={this.onSubmit}>
                    <input autoFocus={true} type='text' className='title' value={this.state.title} onChange={this.onInputChange} />
                </form>
                <a className='' alt={BTN_CANCEL} href='' onClick={this.onClickCancel}>
                    <FontAwesomeIcon icon={faCircleXmark} />
                </a>
                <a className='' alt={BTN_SUBMIT} href='' onClick={this.onSubmit}>
                    <FontAwesomeIcon icon={faCircleCheck} />
                </a>
            </div>;
        }
        return <div className='edit-title helper'>
            <h1 className='title'>{this.state.title}</h1>
            <a className='' alt={BTN_EDIT} href='' onClick={this.onClickEdit}>
                <FontAwesomeIcon icon={faPencil} />
            </a>
        </div>
    }

}
