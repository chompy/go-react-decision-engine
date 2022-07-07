import React from 'react';
import UserTimeComponent from './user_time';

export default class TreeVersionInfoComponent extends React.Component {

    constructor(props) {
        super(props);
        this.object = typeof props.treeversion != 'undefined' ? props.treeversion : '';
        this.showState = typeof props.showstate != 'undefined' ? props.showstate : true;
    }

    render() {
        let verNo = typeof this.object.version != 'undefined' ? this.object.version : '?';
        let state = typeof this.object.state != 'undefined' ? this.object.state : '?';
        let created = typeof this.object.created != 'undefined' ? this.object.created : null;
        let creator = typeof this.object.creator != 'undefined' ? this.object.creator : '';
        let modified = typeof this.object.modified != 'undefined' ? this.object.modified : null;
        let modifier = typeof this.object.modifier != 'undefined' ? this.object.modifier : '';
        return <div className='tree-version-info helper'>
            <span className='version'>Version {verNo}</span>
            <span className={'state' + (this.showState ? '' : ' hidden')}>
                {state}
            </span>
            <span className='created'>
                Created
                <UserTimeComponent user={creator} time={created} />
            </span>
            <span className='modified'>
                Modified
                <UserTimeComponent user={modifier} time={modified} />
            </span>
        </div>;
    }

}
