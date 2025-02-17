import React from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy } from '@fortawesome/free-solid-svg-icons'
import Helpers from "../../helpers";
import { BTN_COPY, MSG_CLIPBOARD } from "../../config";

export default class TruncateIdComponent extends React.Component {

    constructor(props) {
        super(props);
        this.id = typeof props.id != 'undefined' ? props.id : '';
        this.onClickCopy = this.onClickCopy.bind(this);
    }

    /**
     * @param {Event} e 
     */
    onClickCopy(e) {
        e.preventDefault();
        prompt(MSG_CLIPBOARD, this.id);
    }

    render() {
        return <span className='object-id helper' alt={this.id} title={this.id}>
            {Helpers.truncateId(this.id)}
            <a className='' alt={BTN_COPY} href='' onClick={this.onClickCopy}>
                <FontAwesomeIcon icon={faCopy} />
            </a>
        </span>
    }

}
