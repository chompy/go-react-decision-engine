import React from 'react';

import { faFileCirclePlus, faForward } from '@fortawesome/free-solid-svg-icons'
import BasePageComponent from './base';
import FormManagePageComponent from './form_manage';
import Events from '../../events';
import BackendAPI from '../../api';

export default class TeamPageComponent extends BasePageComponent {

    constructor(props) {
        super(props);
        this.state = {
            currentTeam: props.team,
            teams: []
        };
        this.onAPITeams = this.onAPITeams.bind(this);
        this.onSelectTeam = this.onSelectTeam.bind(this);
    }

    /**
     * {@inheritdoc}
     */
    componentDidMount() {
        BackendAPI.get('user/teams', null, this.onAPITeams);
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
     * @param {Object} res 
     */
    onAPITeams(res) {
        if (!res.success) {
            throw res;
        }
        this.setState({ teams: res.data, currentTeam: (this.props.currentTeam ? this.props.currentTeam : res.data[0].uid) });
    }

    onSelectTeam(e) {
        Events.dispatch('team', { team: e.target.value });
        this.setState({ currentTeam: e.target.value });
    }

    renderTeamSelect() {
        if (this.state.teams && this.state.teams.length > 1) {
            let choices = [];
            for (let i in this.state.teams) {
                let team = this.state.teams[i];
                choices.push(<option key={'team-select-' + team.uid} value={team.uid}>{team.name}</option>);
            }
            return <div className='team-name'><select value={this.state.currentTeam} onChange={this.onSelectTeam}>{choices}</select></div>;
        } else if (this.state.teams && this.state.teams.length == 1) {
            return <div className='team-name'>{this.state.teams[0].name}</div>
        }
        return <div className='team-name'>...</div>;
    }

    /**
     * {@inheritdoc}
     */
    render() {
        return <div className='page team'>
            <section>
                {this.renderTeamSelect()}
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
