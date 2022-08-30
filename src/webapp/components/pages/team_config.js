import { faBackward, faFloppyDisk } from '@fortawesome/free-solid-svg-icons';
import React from 'react';
import { message as msgPopup } from 'react-message-popup';
import BackendAPI from '../../api';
import { BTN_BACK, BTN_SAVE, FIELD_CUSTOMIZE_BASIC, MSG_DISPLAY_TIME, MSG_SAVED, MSG_SAVING, MSG_UNSAVED_CHANGES } from '../../config';
import Events from '../../events';
import BasePageComponent, { FIELD_TYPE_CHECKBOX, FIELD_TYPE_TEXT } from './base';


export default class TeamConfigPageComponent extends BasePageComponent {

    static configOpts = {
        'allowSignUp': ['Allow New User Sign Up.', FIELD_TYPE_CHECKBOX],
        'hideEmail': ['Hide creator/modifier e-mail from normal users.', FIELD_TYPE_CHECKBOX]
    };

    constructor(props) {
        super(props);
        this.state.loading = true;
        this.state.name =  '';
        this.state.hasChange = false;
        for (let k in TeamConfigPageComponent.configOpts) {
            this.state[k] = '';
        }
    }

    /**
     * {@inheritDoc}
     */
    static getName() {
        return 'team-config';
    }

    /**
     * {@inheritDoc}
     */
    onReady() {
        this.setTitle('Configuration');
        BackendAPI.get('team/fetch', {id: this.props.team.id}, this.onTeamResponse);
    }

    /**
     * @param {Object} res 
     */
    onTeamResponse(res) {
        if (this.handleErrorResponse(res)) { return; }

        let params = {
            team: res.data,
            name: res.data.name
        };
        if (res.data?.options) {
            for (let k in TeamConfigPageComponent.configOpts) {
                params[k] = k in res.data.options && res.data.options[k] ? res.data.options[k] : '';
            }
        }
        this.setLoaded();
        this.setState(params);

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
        let params = {};
        for (let k in TeamConfigPageComponent.configOpts) {
            params[k] = this.state[k];
            if (params[k] === true) {
                params[k] = 'true';
            } else if (params[k] === false) {
                params[k] = '';
            }
        }
        this.msgLoadPromise = msgPopup.loading(MSG_SAVING, 10000);
        BackendAPI.post(
            'team/store',
            {},
            {
                id: this.props.team.id,
                name: this.state.name,
                options: params
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
        res.data.name = this.state.name;
        Events.dispatch('team', res.data);
        this.setState({hasChange: false});
    }

    /**
     * @param {Event} e 
     */
    onChangeName(e) {
        this.setState({
            name: e.target.value,
            hasChange: true
        });
    }

    /**
     * @param {Event} e 
     */
    onChangeOption(e) {
        let value = e.target.value;
        switch (e.target.type) {
            case 'checkbox': {
                value = e.target.checked;
                break;
            }
        }        
        this.setState({
            [e.target.id]: value,
            hasChange: true
        });
    }

    /**
     * @returns {Array}
     */
    renderOptions() {
        let out = [];
        for (let k in TeamConfigPageComponent.configOpts) {
            let label = TeamConfigPageComponent.configOpts[k][0];
            let fieldType = TeamConfigPageComponent.configOpts[k][1];
            let fieldParams = {
                id: k,
                type: fieldType,
                label: label,
                value: this.state[k],
                callback: this.onChangeOption,
                options: {},
                disabled: !this.state.user?.permission
            };
            out.push(this.renderFormField(fieldParams));
        }
        return out;
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
        return <div className='page team-config'>
            <h1 className='title'>Team Configuration</h1>
            <div className='options top'>
                {this.renderCallbackButton(BTN_BACK, this.onClickBack, faBackward)}
                {this.renderCallbackButton(BTN_SAVE, this.onSave, faFloppyDisk, !this.state.hasChange)}
            </div>
            <section>
                <form className='pure-form pure-form-stacked' noValidate={true}>
                    <fieldset>
                        {this.renderFormField({
                            id: 'name',
                            label: 'Team Name',
                            type: FIELD_TYPE_TEXT,
                            value: this.state.name,
                            callback: this.onChangeName,
                            options: {},
                            disabled: !this.state.user?.permission
                        })}
                        {this.renderOptions()}
                    </fieldset>
                </form>
            </section>
        </div>;
    }

}
