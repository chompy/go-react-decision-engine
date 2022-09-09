import React from 'react';
import ReactDOM from 'react-dom';
import DecisionEngineMainComponent from './components/main';
import purecss from 'purecss-sass';
import styles from './scss/main.scss';
import quillStyles from 'react-quill/dist/quill.snow.css';
import AnswersShortcode from './shortcode/answer';

function collectStyles() {
    let out = [];
    const styles = document.getElementsByTagName('style');
    for (let i = 0; i < styles.length; i++) {
        out.push(styles[i]);
    }
    return out;
}

new AnswersShortcode().hook();

if (document.currentScript && document.currentScript.getAttribute("data-embed")) {
    // embeded mode
    let originalStyles = collectStyles();
    const container = document.createElement('div');
    container.id = 'cc-logic-engine';
    document.currentScript.parentNode.insertBefore(
        container,
        document.currentScript.nextSibling
    );
    container.attachShadow({ mode: 'open' });
    const target = container.shadowRoot;
    let styleTag = document.createElement('style');
    styleTag.innerHTML = purecss + quillStyles + styles;
    ReactDOM.render(<div id='root'><DecisionEngineMainComponent mode='embed' team={document.currentScript.getAttribute("data-team")} /></div>, target);
    target.prepend(styleTag);
    let allStyles = collectStyles();
    for (let i = 0; i < allStyles.length; i++) {
        let compare = originalStyles.filter(s => s.innerHTML == allStyles[i].innerHTML);
        if (compare.length == 0)  {
            styleTag.innerHTML += allStyles[i].innerHTML;
            allStyles[i].remove();
        }
    }
} else {
    // full/normal mode
    let styleTag = document.createElement('style');
    styleTag.innerHTML = purecss + quillStyles + styles;
    document.head.appendChild(styleTag);
    ReactDOM.render(<div><DecisionEngineMainComponent /></div>, document.getElementById('root'));
}
