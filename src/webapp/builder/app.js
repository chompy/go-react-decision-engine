import '../../scss/builder.scss';

import Events from '../core/events';
import React from 'react';
import ReactDOM from 'react-dom';
import BuilderBaseComponent from './components/base';
import DecisionBuilder from '../core/decision_builder';

export function initListen() {
    Events.listen(
        'init',
        function(e) {
            if (typeof(console) != 'undefined') {
                console.log('== INIT DECISION ENGINE BUILDER ==');
            }
            let obj = null;
            if (e.detail.object) {
                if (typeof e.detail.object == 'string') {
                    e.detail.object = JSON.parse(e.detail.object);
                }
                let b = new DecisionBuilder;
                obj = b.build(e.detail.object);
            }
            let elementId = 'app';
            if (typeof e.detail.element == 'string') {
                elementId = e.detail.element;
            }
            ReactDOM.render(
                <BuilderBaseComponent object={obj} />,
                document.getElementById(elementId)
            );
        }
    );
}

initListen();