import React from 'react';
import { faBackward, faTrash, faEdit, faCopy } from '@fortawesome/free-solid-svg-icons'
import BasePageComponent from './base';
import TeamPageComponent from './team';

export default class FormManagePageComponent extends BasePageComponent {

    constructor(props) {
        super(props);
        this.state = {
            name: ''
        };
        this.onName = this.onName.bind(this);
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
        return 'form';
    }

    /**
     * {@inheritdoc}
     */
    getTitle() {
        return 'Form Manager';
    }

    onName(e) {
        this.setState({ name: e.target.value });
    }

    /**
     * {@inheritdoc}
     */
     render() {
        return <div className='page form'>

            <div className='options top'>
                {this.renderPageButton('Back', TeamPageComponent.getName(), {}, faBackward)}                
            </div>

            <section>
                <h2 className='section-name'>{this.getTitle()}</h2>

                <form className='pure-form pure-form-stacked'>
                    {this.renderFormField({
                            id: 'name',
                            label: 'Form Name',
                            value: this.state.name,
                            callback: this.onName
                    })}
                </form>

                <div className='options pure-button-group' role='group'>
                    
                </div>

            </section>
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
