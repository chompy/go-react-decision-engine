import '../../scss/rule_editor.scss';

import Events from '../core/events';
import React from 'react';
import ReactDOM from 'react-dom';
import RuleEditorComponent from './components/editor';

export function initListen() {
    Events.listen(
        'init',
        function(e) {
            if (typeof(console) != 'undefined') {
                console.log('== INIT DECISION ENGINE RULE EDITOR ==');
            }
            let data = {}
            if (e.detail.data) {
                data = e.detail.data;
            }
            let elementId = 'app';
            if (typeof e.detail.element == 'string') {
                elementId = e.detail.element;
            }
            let mode = '';
            if (typeof e.detail.mode != 'undefined') {
                mode = e.detail.mode;
            }
            ReactDOM.render(
                <RuleEditorComponent data={data} mode={mode} />,
                document.getElementById(elementId)
            );
        }
    );
}

initListen();