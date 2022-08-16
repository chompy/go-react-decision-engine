import React from 'react';
import BackendAPI from '../../api';
import { BTN_BACK,BTN_SAVE,FIELD_CUSTOMIZE_ADV, FIELD_CUSTOMIZE_BASIC, MSG_DISPLAY_TIME, MSG_SAVED, MSG_SAVING, MSG_UNSAVED_CHANGES } from '../../config';
import BasePageComponent, { FIELD_TYPE_COLOR } from './base';
import { faBackward, faFloppyDisk } from '@fortawesome/free-solid-svg-icons';
import TeamDashboardPageComponent from './team_dashboard';
import { message as msgPopup } from 'react-message-popup';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-css';
import 'ace-builds/src-noconflict/theme-github';
import ShadowContainerComponent from '../shadow_container';
import CustomizePreviewComponent from '../customize_preview';
import Helpers from '../../helpers';
import Events from '../../events';

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
        this.state.hasChange = false;
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
        this.setTitle('Customize');
        BackendAPI.get('team/fetch', {id: this.props.team.id}, this.onTeamResponse);
    }

    /**
     * @param {Object} res 
     */
    onTeamResponse(res) {
        if (this.handleErrorResponse(res)) { return; }
        if (res.data?.customize) {
            let params = {
                team: res.data,
                style: res.data?.customize?.style ? res.data.customize.style : ''
            };
            for (let k in TeamCustomizePageComponent.colorOpts) {
                params[k] = typeof res.data.customize[k] == 'undefined' ? TeamCustomizePageComponent.colorOpts[k][1] : res.data.customize[k];
            }
            this.setLoaded();
            this.setState(params, function() {
                this.setState({generatedStyle: this.generateStyle()});
            }.bind(this));
        }
        this.setLoaded();
    }

    /**
     * @param {Event} e 
     */
    onClickBack(e) {
        e.preventDefault();
        if (this.state.hasChange && !confirm(MSG_UNSAVED_CHANGES)) {
            return;
        }        
        this.gotoReferer();
    }

    /**
     * @param {Event} e 
     */
    onSave(e) {
        e.preventDefault();
        let params = {
            style: this.state.style
        };
        for (let k in TeamCustomizePageComponent.colorOpts) {
            params[k] = this.state[k];
        }
        this.msgLoadPromise = msgPopup.loading(MSG_SAVING, 10000);
        BackendAPI.post(
            'team/store',
            {},
            {
                id: this.props.team.id,
                customize: params
            },
            this.onSaveResponse
        );
    }

    /**
     * @param {Object} res 
     */
    onSaveResponse(res) {
        if (this.msgLoadPromise) { this.msgLoadPromise.then(({destory}) => { destory(); } ); }
        if (this.handleErrorResponse(res)) { return; }
        msgPopup.success(MSG_SAVED, MSG_DISPLAY_TIME);
        res.data.name = this.state.team.name;
        Events.dispatch('team', res.data);
        this.setState({hasChange: false});
    }

    /**
     * @param {Event} e 
     */
    onColorChange(e) {
        this.setState({hasChange: true, [e.target.id]: e.target.value}, function() {
            this.setState({generatedStyle: this.generateStyle()});
        }.bind(this));
    }

    /**
     * @param {String} value 
     */
    onStyleChange(value) {
        this.setState({hasChange: true, style: value}, function() {
            this.setState({generatedStyle: this.generateStyle()});
        }.bind(this))
    }

    /**
     * Render all color fields.
     * @returns {Array}
     */
    renderColorOptions() {
        let out = [];
        for (let k in TeamCustomizePageComponent.colorOpts) {
            out.push(
                this.renderFormField({
                    id: k,
                    type: FIELD_TYPE_COLOR,
                    label: TeamCustomizePageComponent.colorOpts[k][0],
                    value: this.state[k],
                    callback: this.onColorChange
                })
            );
        }
        return out;
    }

    /**
     * Generate stylesheet for customizations.
     * @returns {String}
     */
    generateStyle() {
        return Helpers.generateCustomStyle(this.state);
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
                {this.renderCallbackButton(BTN_BACK, this.onClickBack, faBackward)}
                {this.renderCallbackButton(BTN_SAVE, this.onSave, faFloppyDisk, !this.state.hasChange)}
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
                            <CustomizePreviewComponent user={this.props.user} team={this.state.team} path={this.props.path} />
                        </ShadowContainerComponent>
                    </fieldset>
                </form>
            </section>
        </div>;
    }

}
