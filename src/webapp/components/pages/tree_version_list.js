import React from 'react';
import { faBackward, faTrash, faEdit, faCopy, faCirclePlus } from '@fortawesome/free-solid-svg-icons'
import BasePageComponent from './base';
import BackendAPI from '../../api';
import FormListPageComponent from './form_list';

export default class TreeVersionListPageComponent extends BasePageComponent {

    constructor(props) {
        super(props);
        this.onForms = this.onForms.bind(this);
    }

    /**
     * {@inheritdoc}
     */
    static getName() {
        return 'tree-version-list';
    }

    /**
     * {@inheritdoc}
     */
    static getTitle() {
        return 'Version List';
    }

    /**
     * {@inheritdoc}
     */
    onReady() {
        //BackendAPI.get('tree/list', {type: 'form'}, this.onForms);    
    }

    /**
     * {@inheritdoc}
     */
    render() {

        if (this.state.error) {
            return this.renderError();
        } else if (this.state.loading) {
            return this.renderLoader();
        }

        return <div className='page tree-version-list'>
            <div className='options top'>
            {this.renderPageButton('Back', FormListPageComponent, {}, faBackward)}
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
                                        {this.renderPageButton('Edit', FormListPageComponent, {}, faEdit)}
                                        {this.renderPageButton('Copy', FormListPageComponent, {}, faCopy)}
                                        {this.renderPageButton('Delete', FormListPageComponent, {}, faTrash)}
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
                                        {this.renderPageButton('Edit', FormListPageComponent, {}, faEdit)}
                                        {this.renderPageButton('Copy', FormListPageComponent, {}, faCopy)}
                                        {this.renderPageButton('Delete', FormListPageComponent, {}, faTrash)}
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
                                        {this.renderPageButton('Edit', FormListPageComponent, {}, faEdit)}
                                        {this.renderPageButton('Copy', FormListPageComponent, {}, faCopy)}
                                        {this.renderPageButton('Delete', FormListPageComponent, {}, faTrash)}
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>

            </section>
        </div>;
    }

}
