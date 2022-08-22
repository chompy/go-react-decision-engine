import React from 'react';
import UserTimeComponent from './user_time';

export default class TreeVersionInfoComponent extends React.Component {

    constructor(props) {
        super(props);
        this.object = props?.treeversion ? props.treeversion : '';
        this.showState = props?.showstate;
    }

    render() {
        let verNo = this.object?.version ? this.object.version : '';
        return <div className='tree-version-info helper'>
            <span className={'version' + (verNo ? '' : ' hidden')}>Version {verNo}</span>
            <span className={'state' + (this.showState ? '' : ' hidden')}>
                {this.object?.state}
            </span>
            <span className='created'>
                Created
                <UserTimeComponent user={this.object?.creator} time={this.object?.created} />
            </span>
            <span className='modified'>
                Modified
                <UserTimeComponent user={this.object?.modifier} time={this.object?.modified} />
            </span>
        </div>;
    }

}
