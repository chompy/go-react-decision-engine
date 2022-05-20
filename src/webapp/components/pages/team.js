import React from 'react';

import { faFileCirclePlus, faForward } from '@fortawesome/free-solid-svg-icons'
import BasePageComponent from './base';
import FormManagePageComponent from './form_manage';

export default class TeamPageComponent extends BasePageComponent {

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
        return 'team';
    }

    /**
     * {@inheritdoc}
     */
    getTitle() {
        return 'Team Dashboard';
    }

    /**
     * {@inheritdoc}
     */
     render() {
        return <div className='page team'>
            <h1 className='team-name'>Team Alpha</h1>
            <section>
                <h2 className='section-name'>Forms</h2>
                <div className='options pure-button-group' role='group'>
                    {this.renderPageButton('New Form', FormManagePageComponent.getName(), {}, faFileCirclePlus)}
                </div>
                <table className='pure-table'>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Name</th>
                            <th>Created</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>1</td>
                            <td>Sample Alpha</td>
                            <td>1/1/2020 5:00 PM</td>
                            <td>
                                {this.renderPageButton('Go', FormManagePageComponent.getName(), {id: 1}, faForward)}
                            </td>
                        </tr>
                        <tr>
                            <td>2</td>
                            <td>Form 'abc123efg'</td>
                            <td>1/1/2020 5:00 PM</td>
                            <td>
                                {this.renderPageButton('Go', FormManagePageComponent.getName(), {id: 2}, faForward)}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </section>
        </div>;
    }

}
