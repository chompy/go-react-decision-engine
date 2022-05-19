import React from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFileCirclePlus } from '@fortawesome/free-solid-svg-icons'
import BasePageComponent from './page_base';
import BuilderPageComponent from './page_builder';

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
                    {this.renderPageButton('New Form', BuilderPageComponent.getName(), {mode: 'new'}, faFileCirclePlus)}
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

                            </td>
                        </tr>
                        <tr>
                            <td>2</td>
                            <td>Toyota</td>
                            <td>Camry</td>
                            <td>2012</td>
                        </tr>
                        <tr>
                            <td>3</td>
                            <td>Hyundai</td>
                            <td>Elantra</td>
                            <td>2010</td>
                        </tr>
                    </tbody>
                </table>
                            </section>
        </div>;
    }

}
