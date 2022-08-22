import React from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBackward, faForward } from '@fortawesome/free-solid-svg-icons'
import { BTN_BACK, BTN_GO, BTN_MORE, BTN_NEXT, MSG_NO, MSG_NO_LIST_DATA, MSG_YES } from "../../config";
import md5 from 'blueimp-md5';
import BackendAPI from '../../api';
import UserTimeComponent from './user_time';
import Events from '../../events';

const SEE_MORE_MAX = 5;

// Display list data from backend API in a paginated table.
export default class ApiTableComponent extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            error: '',
            count: 0,
            data: null,
            offset: 0,
            limit: -1
        };
        this.columns = props?.columns ? props.columns : {};
        this.endpoint = props?.endpoint ? props.endpoint : '';
        this.params = props?.params ? props.params : '';
        this.callback = props?.callback;
        this.seeMore = props?.seeMore;

        this.key = md5(this.endpoint + JSON.stringify(this.columns) + JSON.stringify(this.params));
        this.onBackendResponse = this.onBackendResponse.bind(this);
        this.onPagination = this.onPagination.bind(this);
        this.onSelectRow = this.onSelectRow.bind(this);
        this.onClickMore = this.onClickMore.bind(this);
    }

    /**
     * {@inheritDoc}
     */
    componentDidMount() {
        if (!this.endpoint) { return; }
        this.setState({loading: true});
        let params = Object.assign({}, this.params, {offset: this.state.offset});
        BackendAPI.get(this.endpoint, params, this.onBackendResponse);
    }

    /**
     * @param {Object} res 
     */
    onBackendResponse(res) {
        if (!res.success) {
            console.error('> ERROR: ' + res.message, res);
            this.setState({error: res.message});
            return
        }
        console.log('> Fetched API table "' + this.endpoint + '."');
        this.setState({
            loading: false,
            count: res?.count ? res.count : 0,
            data: res.data,
            limit: this.state.limit == -1 ? res.data.length : this.state.limit
        });
    }

    /**
     * @param {Event} e 
     */
    onPagination(e) {
        e.preventDefault();
        // calculate params
        let pageNo = parseInt(e.target.getAttribute('data-page'));
        if (pageNo <= 0 || this.state.count == 0) { return; }
        let offset = (pageNo-1) * this.state.limit;
        if (offset > this.state.count) { return; }
        // send request
        let params = Object.assign({}, this.params, {offset: offset});
        BackendAPI.get(this.endpoint, params, this.onBackendResponse);
        // update state
        this.setState({
            loading: true,
            offset: offset
        });
    }

    /**
     * @param {Event} e 
     */
    onSelectRow(e) {
        e.preventDefault();
        let index = parseInt(e.target.getAttribute('data-index'));
        if (isNaN(index)) { return; }
        if (this.callback) {
            this.callback(this.state.data[index]);
        }
    }

    /**
     * @param {Event} e 
     */
    onClickMore(e) {
        e.preventDefault();
        if (!this.seeMore) { return; }
        Events.dispatch('goto_page', {component: this.seeMore[0], params: this.seeMore[1]});
    }

    /**
     * Render header columns.
     */
    renderHead() {
        let out = [];
        for (let i in this.columns) {
            out.push(<th key={this.key + '-head-' + i} className={'table-'+i}>{this.columns[i]}</th>);
        }
        if (this.callback) {
            out.push(<th key={this.key + '-head-callback'}></th>);
        }
        return out;
    }

    /**
     * Render field value.
     * @param {string} field 
     * @param {Object} data 
     * @returns {*}
     */
    renderFieldValue(field, data) {
        switch(field) {
            case 'created': {
                let user = typeof data.creator != 'undefined' ? data.creator : '';
                return <UserTimeComponent time={data[field]} user={user} />;
            }
            case 'modified': {
                let user = typeof data.modifier != 'undefined' ? data.modifier : '';
                return <UserTimeComponent time={data[field]} user={user} />;
            }
            case 'valid': {
                let valid = data?.valid;
                return valid ? MSG_YES : MSG_NO;
            }
            default: {
                return data[field];
            }
        }
    }

    /**
     * Render rows.
     */
    renderRows() {
        if (this.state.count == 0) {
            return <tr><td colSpan={Object.keys(this.columns).length}>{MSG_NO_LIST_DATA}</td></tr>
        }
        let out = [];
        for (let i in this.state.data) {
            if (this.seeMore && i > SEE_MORE_MAX) { break; }
            let data = this.state.data[i];
            let key = md5(JSON.stringify(data));
            let cols = [];
            for (let field in this.columns) {
                cols.push(
                    <td key={this.key + '-' + key + '-' + field} className={'table-' + field}>{this.renderFieldValue(field, data)}</td>
                );
            }
            if (this.callback) {
                cols.push(<td key={this.key + '-' + key + '-callback'} className='table-options'>
                    <button className='pure-button btn-go' onClick={this.onSelectRow} data-index={i}>
                        {BTN_GO} <FontAwesomeIcon icon={faForward} />
                    </button>
                </td>);
            }
            out.push(
                <tr key={this.key + '-row-' + key}>{cols}</tr>
            );
        }
        return out;
    }

    /**
     * Render pagination options.
     */
    renderPagination() {
        if (this.state.count == 0 || this.seeMore) {
            if (this.seeMore && this.state.count >= 5) {
                return <div className='options'>
                    <button className='pure-button btn-more' onClick={this.onClickMore}>
                        {BTN_MORE.replace('{count}', this.state.count)} <FontAwesomeIcon icon={faForward} />
                    </button>
                </div>
            }
            return null;
        }
        let totalPages = Math.ceil(this.state.count / this.state.limit);
        let currentPage = Math.ceil(this.state.offset / this.state.limit) + 1;
        let pages = [];
        for (let i = 0; i < totalPages; i++) {
            pages.push(
                <button
                    key={'table-' + this.key + '-page-' + (i+1)}
                    className='pure-button btn-page'
                    disabled={currentPage == (i+1)}
                    data-page={currentPage != (i+1) ? (i+1) : -1}
                    onClick={this.onPagination}
                >{i+1}</button>
            );
        }
        return <div className='pagination'>
            <button className='pure-button btn-back' disabled={totalPages <= 1 || currentPage <= 1} onClick={this.onPagination} data-page={currentPage-1}>
                <FontAwesomeIcon icon={faBackward} />{BTN_BACK}
            </button>
            {pages}
            <button className='pure-button btn-next' disabled={totalPages <= 1 || currentPage >= totalPages} onClick={this.onPagination} data-page={currentPage+1}>
                {BTN_NEXT}<FontAwesomeIcon icon={faForward} />
            </button>
        </div>;
    }

    /**
     * {@inheritDoc}
     */
    render() {
        return <div className='api-table helper'>
            <table className='pure-table'>
                <thead><tr>{this.renderHead()}</tr></thead>
                <tbody>{this.renderRows()}</tbody>
            </table>
            {this.renderPagination()}
        </div>;
    }

}
