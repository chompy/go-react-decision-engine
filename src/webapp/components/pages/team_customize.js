import React from 'react';
import BackendAPI from '../../api';
import { BTN_BACK,FIELD_CUSTOMIZE_ADV, FIELD_CUSTOMIZE_BASIC } from '../../config';
import BasePageComponent from './base';
import { faBackward } from '@fortawesome/free-solid-svg-icons';
import TeamDashboardPageComponent from './team_dashboard';
import AppHeaderComponent from '../header';

import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-css';
import 'ace-builds/src-noconflict/theme-github';
import ShadowContainerComponent from '../shadow_container';
import CustomizePreviewComponent from '../customize_preview';

export default class TeamCustomizePageComponent extends BasePageComponent {

    static colorOpts = {
        'titleCol': ['Title Color', '#ffffff'],
        'headerBgCol': ['Header Background', '#575757'],
        'headerFgCol': ['Header Foreground', '#ffffff'],
        'pageBgCol': ['Main Page Background', '#ffffff'],
        'pageFgCol': ['Main Page Foreground', '#000000']
    };

    constructor(props) {
        super(props);
        this.state.loading = true;
        this.state.style = '';
        this.state.generatedStyle = '';
        for (let k in TeamCustomizePageComponent.colorOpts) {
            this.state[k] = TeamCustomizePageComponent.colorOpts[k][1];
        }
    }

    /**
     * {@inheritDoc}
     */
    static getName() {
        return 'team-customize';
    }

    /**
     * {@inheritDoc}
     */
    onReady() {
        this.setTitle('layout');
        this.setLoaded();
    }

    onColorChange(e) {
        this.setState({[e.target.id]: e.target.value}, function() {
            this.setState({generatedStyle: this.generateStyle()});
        }.bind(this));
    }

    onStyleChange(value) {
        this.setState({style: value}, function() {
            this.setState({generatedStyle: this.generateStyle()});
        }.bind(this))
    }

    renderColorOptions() {
        let out = [];
        for (let k in TeamCustomizePageComponent.colorOpts) {
            out.push(
                <div key={'color-opt-' + k} className='color-opt'>
                    <label htmlFor={k}>{TeamCustomizePageComponent.colorOpts[k][0]}</label>
                    <input
                        type='color'
                        id={k}
                        defaultValue={this.state[k]}
                        onChange={this.onColorChange}
                    />                
                </div>
            );
        }
        return out;
    }

    generateStyle() {
        let style = '';
        style += '.decision-engine .header .app-name { color: ' + this.state.titleCol + '; }';
        style += '.decision-engine .header { background-color: ' + this.state.headerBgCol + '; color: ' + this.state.headerFgCol + '; }';
        style += '.decision-engine .header .user .options a { color: ' + this.state.headerFgCol + '; }';
        style += 'html, body, #root { background-color: ' + this.state.pageBgCol + '; color: ' + this.state.pageFgCol + '; }' ;
        style += '\n\n' + this.state.style
        return style;
    }

    /**
     * {@inheritDoc}
     */
    render() {
        if (this.state.error) {
            return this.renderError();
        } else if (this.state.loading) {
            return this.renderLoader();
        }
        return <div className='page team-customize'>
            <h1 className='title'>Customize Look</h1>
            <div className='options top'>
                {this.renderPageButton(BTN_BACK, TeamDashboardPageComponent, {}, faBackward)}
            </div>
            <section>
                <form className='pure-form pure-form-stacked' noValidate={true}>
                    <div className='customize-form'>
                        <fieldset>
                            <legend>{FIELD_CUSTOMIZE_BASIC}</legend>
                            {this.renderColorOptions()}
                        </fieldset>
                        <fieldset>
                            <legend>{FIELD_CUSTOMIZE_ADV}</legend>
                            <label>CSS Style</label>
                            <AceEditor
                                mode='css'
                                theme='github'
                                name='style-edit'
                                onChange={this.onStyleChange}
                                value={this.state.style}
                                width='100%'
                                setOptions={{
                                    useWorker: false
                                }}
                            />
                        </fieldset>
                    </div>
                    <fieldset className='preview-area'>
                        <legend>Preview</legend>
                        <ShadowContainerComponent inheritStyles={true} style={this.state.generatedStyle}>
                            <CustomizePreviewComponent user={this.props.user} team={this.props.team} path={this.props.path} />
                        </ShadowContainerComponent>
                    </fieldset>
                </form>
            </section>
        </div>;
    }

}
