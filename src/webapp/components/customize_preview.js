import React from 'react';
import Events from '../events';
import AppHeaderComponent from './header';
import PreviewPageComponent from './pages/preview';

export default class CustomizePreviewComponent extends React.Component {

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
    componentWillUnmount() {

    }

    /**
     * {@inheritdoc}
     */
    render() {
        return <div id='root' className='customize-preview'>
            <div className='decision-engine'>
                <AppHeaderComponent user={this.props.user} team={this.props.team} />
                <PreviewPageComponent user={this.props.user} team={this.props.team} path={this.props.path} referer='' />
            </div>
        </div>;
    }

}
