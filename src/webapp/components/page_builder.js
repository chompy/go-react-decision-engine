import React from 'react';
import { faBackward } from '@fortawesome/free-solid-svg-icons'
import BasePageComponent from './page_base';
import TeamPageComponent from './page_team';
import BuilderComponent from './builder';

export default class BuilderPageComponent extends BasePageComponent {

    constructor(props) {
        super(props);
        this.state = {
            name: ''
        };
        this.onName = this.onName.bind(this);
    }

    /**
     * {@inheritdoc}
     */
    componentDidMount() {

    }

    /**
     * {@inheritdoc}
     */
    static getName() {
        return 'builder';
    }

    /**
     * {@inheritdoc}
     */
    getTitle() {
        return 'Decision Builder';
    }

    onName(e) {
        this.setState({ name: e.target.value });
    }

    /**
     * {@inheritdoc}
     */
     render() {
        return <div className='page builder'>

            <div className='options top'>
                {this.renderPageButton('Back', TeamPageComponent.getName(), {}, faBackward)}                
            </div>

            <section>
                
                <h2 className='section-name'>Form Builder</h2>

                <form className='pure-form pure-form-stacked'>
                    {this.renderFormField({
                            id: 'name',
                            label: 'Form Name',
                            value: this.state.name,
                            callback: this.onName
                    })}
                </form>

                <div className='options pure-button-group' role='group'>
                    
                </div>

            </section>
            <section>
                <BuilderComponent />
            </section>
        </div>;
    }

}
