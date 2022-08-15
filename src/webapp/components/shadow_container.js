import React from 'react';
import ReactDOM from 'react-dom'

export default class ShadowContainerComponent extends React.Component {

    constructor(props) {
        super(props);
        this.shadowRef = React.createRef();
    }

    /**
     * {@inheritdoc}
     */
    componentDidMount() {
        const element = this.shadowRef.current.attachShadow({mode: 'open'});
        ReactDOM.render(
            this.props?.children,
            element
        );
        if (this.props?.inheritStyles) {
            let styles = document.getElementsByTagName('style');
            for (let i = 0; i < styles.length; i++) {
                let style = styles[i];
                let newElement = document.createElement('style');
                newElement.innerHTML = style.innerHTML;
                element.append(newElement);
            }
        }
        this.updateStyle();
    }

    /**
     * {@inheritdoc}
     */
    componentWillUnmount() {

    }

    componentDidUpdate() {
        this.updateStyle();
    }

    updateStyle() {
        let previewStyle = this.shadowRef.current.shadowRoot.getElementById('preview-style');
        if (!previewStyle) {
            previewStyle = document.createElement('style');
            previewStyle.id = 'preview-style';
            this.shadowRef.current.shadowRoot.append(previewStyle);
        }
        previewStyle.innerHTML = this.props?.style;
    }

    /**
     * {@inheritdoc}
     */
    render() {
        return <div className='shadow' ref={this.shadowRef}></div>;
    }

}
