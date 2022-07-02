import React from 'react';
import Events from '../events';
import GroupNode from '../nodes/group';

export default class SectionNavigationComponent extends React.Component {

    constructor(props) {
        super(props);
        this.userData = props.userData;
        this.root = props.root;
        this.sectionChangeCallback = typeof props.callback == 'undefined' ? null : props.callback;
        this.state = {
            section: null
        };
        this.onUpdate = this.onUpdate.bind(this);
        this.onSection = this.onSection.bind(this);
        this.onSectionClick = this.onSectionClick.bind(this);
    }

    componentDidMount() {
        Events.listen('update', this.onUpdate);
        Events.listen('section', this.onSection);
    }

    componentWillUnmount() {
        Events.remove('update', this.onUpdate);
        Events.remove('section', this.onSection);
    }

    onUpdate(e) {
        if (e.detail.object.instanceId == this.root.instanceId) {
            this.forceUpdate();
        }
    }

    onSectionClick(e) {
        e.preventDefault();
        if (this.sectionChangeCallback) {
            let section = null;
            let child = e.target;
            while (child && !section) {
                section = child.getAttribute('data-section');
                child = child.parentNode;
            }
            this.setState({section: section});
            this.sectionChangeCallback(section);
        }
    }

    onSection(e) {
        if (e.detail.object.instanceId == this.root.instanceId) {
            this.setState({section: e.detail.section});
        }
    }

    render() {
        let out = [];
        let hasCurrent = false;
        for (let i in this.root.children) {
            let obj = this.root.children[i];
            if (!(obj instanceof GroupNode) || this.userData.isHidden(obj, this.root)) {
                continue;
            }
            let className = 'step-item section-item';
            if (!hasCurrent && (!this.state.section || this.state.section == obj.uid)) {
                className += ' current';
                hasCurrent = true;
            }
            let sectionData = {
                className: className,
                object: obj,
                index: i,
                render: <span>{obj.name}</span>
            };
            Events.dispatch('section_title', sectionData);
            out.push(
                <div key={'t_'+obj.uid} data-section={obj.uid} className={sectionData.className} onClick={this.onSectionClick}>
                    {sectionData.render}
                </div>
            );
        }
        return <div className='steps sections'>{out}</div>;
    }

}