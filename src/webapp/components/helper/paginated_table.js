import React from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy } from '@fortawesome/free-solid-svg-icons'
import Helper from "../../helpers";
import { BTN_COPY } from "../../config";

export default class PaginatedTableComponent extends React.Component {

    constructor(props) {
        super(props);
        this.limit = typeof props.limit != 'undefined' ? props.limit : 25;
        this.state.headers = typeof props.headers != 'undefined' ? props.headers : [];
        this.state.rows =
        this.state.data = typeof props.data != 'undefined' ? props.data : null;
    }

    render() {
        return <span className='object-id helper' alt={this.id} title={this.id}>
            {Helper.truncateId(this.id)}
            <a className='' alt={BTN_COPY} href='' onClick={this.onClickCopy}>
                <FontAwesomeIcon icon={faCopy} />
            </a>
        </span>
    }

}
