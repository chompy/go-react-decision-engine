import React from 'react';
import Events from '../events';
import JsonConverter from '../converters/json';
import BaseNode from '../objects/base';
import RootNode, {DECISION_TYPE_DOCUMENT} from '../objects/root';
import BuilderNodeComponent from './builder_node';

export default class PdfFormComponent extends React.Component {

    constructor(props) {
        super(props);
        this.onFile = this.onFile.bind(this);
        this.onFileLoad = this.onFileLoad.bind(this);
    }

    /**
     * {@inheritdoc}
     */
    componentDidMount() {

    }

    onFile(e) {
        if (typeof e.target.files[0] == 'undefined') {
            return;
        }
        let file = e.target.files[0];
        let reader = new FileReader;
        reader.onload = this.onFileLoad;
        reader.readAsBinaryString(file);
    }

    onFileLoad(e) {
        console.log(e);
        console.log(e.target.result);
    }

    /**
     * {@inheritdoc}
     */
     render() {
        return <div className='pdf-form-reader'>
            <form>
                <input type='file' onChange={this.onFile} />
                <input type='submit' value='Go' />
            </form>
        </div>;
    }

}
