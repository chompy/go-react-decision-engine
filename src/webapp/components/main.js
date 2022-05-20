import React from 'react';
import BasePageComponent from './pages/base';
import BuilderPageComponent from './pages/builder';
import FormManagePageComponent from './pages/form_manage';
import TeamPageComponent from './pages/team';

export default class DecisionEngineMainComponent extends React.Component {

    /**
     * List of available page components.
     */
    static pageComponents = [
        TeamPageComponent,
        FormManagePageComponent,
        BuilderPageComponent
    ];

    constructor(props) {
        super(props);
        this.state = {
            team: 'abc123',
            page: TeamPageComponent.getName(),
            params: {}
        };
        this.onHashChange = this.onHashChange.bind(this);
    }

    /**
     * {@inheritdoc}
     */
    componentDidMount() {
        window.addEventListener('hashchange', this.onHashChange);
        if (window.location.hash) {
            this.gotoHashPage(window.location.hash);
        }        
    }

    /**
     * {@inheritdoc}
     */
    componentWillUnmount() {
        window.removeEventListener('hashchange', this.onHashChange);
    }

    /**
     * @param {Event} e 
     */
    onHashChange(e) {
        e.preventDefault();
        this.gotoHashPage(window.location.hash);
    }

    /**
     * Navigate to page based on hash string.
     * @param {string} hash 
     */
    gotoHashPage(hash) {
        if (hash[0] == '#') {
            hash = window.location.hash.substring(1);
        }
        if (!hash) {
            this.setState({
                page: DecisionEngineMainComponent.pageComponents[0].getName(),
                params: {}
            });
            return;
        }
        hash = hash.split('-');
        let page = hash[0];
        let params = {};
        for (let i = 1; i < hash.length; i += 2) {
            params[hash[i]] = hash[i+1];
        }
        this.setState({
            page: page,
            params: params
        });
    }

    /**
     * {@inheritdoc}
     */
     render() {
        let Component = BasePageComponent;
        for (let i in DecisionEngineMainComponent.pageComponents) {
            if (DecisionEngineMainComponent.pageComponents[i].getName() == this.state.page) {
                Component = DecisionEngineMainComponent.pageComponents[i];
                break;
            }
        }
        return <div className='decision-engine'>
            <Component team={this.state.team} params={this.state.params} />
        </div>;
    }

}
