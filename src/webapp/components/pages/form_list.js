import React from 'react';
import { faBackward, faTrash, faEdit, faCopy } from '@fortawesome/free-solid-svg-icons'
import BasePageComponent from './base';

export default class FormListPageComponent extends BasePageComponent {

    constructor(props) {
        super(props);
    }

    /**
     * {@inheritdoc}
     */
    componentDidMount() {

    }

    /**
     * {@inheritdoc}
     */
    static getName() {
        return 'form-list';
    }

    /**
     * {@inheritdoc}
     */
    static getTitle() {
        return 'Forms';
    }

    /**
     * {@inheritdoc}
     */
     render() {
        return <div className='page form'>
            <div className='options top'>
     
            </div>

            <section>

                <table className='pure-table'>
                        <thead>
                            <tr>
                                <th>Version</th>
                                <th>State</th>
                                <th>Created</th>
                                <th>Modified</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>1</td>
                                <td>Published</td>
                                <td>1/1/2020 5:00 PM (Nathan Ogden)</td>
                                <td>1/1/2020 5:01 PM (Sam Ogden)</td>
                                <td>
                                    <div className='pure-button-group' role='group'>
                                        {this.renderPageButton('Edit', 'builder', {}, faEdit)}
                                        {this.renderPageButton('Copy', 'builder', {}, faCopy)}
                                        {this.renderPageButton('Delete', 'builder', {}, faTrash)}
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>2</td>
                                <td>Draft</td>
                                <td>1/1/2020 5:00 PM (Nathan Ogden)</td>
                                <td>1/1/2020 5:01 PM (Sam Ogden)</td>
                                <td>
                                    <div className='pure-button-group' role='group'>
                                        {this.renderPageButton('Edit', 'builder', {}, faEdit)}
                                        {this.renderPageButton('Copy', 'builder', {}, faCopy)}
                                        {this.renderPageButton('Delete', 'builder', {}, faTrash)}
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>3</td>
                                <td>Draft</td>
                                <td>1/1/2020 5:00 PM (Nathan Ogden)</td>
                                <td>1/1/2020 5:01 PM (Sam Ogden)</td>
                                <td>
                                    <div className='pure-button-group' role='group'>
                                        {this.renderPageButton('Edit', 'builder', {}, faEdit)}
                                        {this.renderPageButton('Copy', 'builder', {}, faCopy)}
                                        {this.renderPageButton('Delete', 'builder', {}, faTrash)}
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>

            </section>
        </div>;
    }

}
