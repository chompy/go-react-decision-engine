import DecisionBase from './base';
import DecisionGroupComponent from '../components/decision_group';
import PdfBuilder from '../pdf_builder';
import Events from '../events';
import shortcode from '../lib/shortcode-parser';

export default class DecisionGroup extends DecisionBase {

    constructor(uid) {
        super(uid);
        this.name = '';
        this.content = '';
        this.contentEdit = '';
    }

    /**
     * @inheritdoc
     */
    static getTypeName() {
        return 'decision_group';
    }

    /**
     * @inheritdoc
     */
    getComponent() {
        return DecisionGroupComponent;
    }

    /**
     * @inheritdoc
     */
    exportJSON() {
        let out = super.exportJSON();
        out['name'] = this.name;
        out['content_edit'] = this.contentEdit;
        out['content'] = this.content;
        return out;
    }

    /**
     * @inheritdoc
     */
    static importJSON(data) {
        let obj = super.importJSON(data);
        obj.importValues(
            {
                'name' : 'name',
                'content' : 'content',
                'content_edit': 'contentEdit'

            },
            data
        )
        if (!obj.contentEdit) {
            obj.contentEdit = obj.content;
        }
        return obj;
    }

    /**
     * @inheritdoc
     */
    toPdfMake(userData) {
        let element = document.createElement('div');
        element.id = 'decision-engine-pdf';
        let innerElement = document.createElement('div');
        innerElement.className = 'group_content' +
            ' level-' + this.level + 
            ' priority-' + this.priority +
            (this.tags.length > 0 ? ' tag-' + this.tags.join(' tag-') : '')
        ;
        innerElement.innerHTML = shortcode.parse(this.content);
        element.appendChild(innerElement);
        Events.dispatch('to_pdf_make', {
            object: this,
            element: element
        });
        document.getElementsByTagName('body')[0].appendChild(element);       
        let out = PdfBuilder.nodeListToPdfMake(element.childNodes).concat(super.toPdfMake(userData));
        document.getElementsByTagName('body')[0].removeChild(element);
        return out;
    }

    /**
     * @inheritdoc
     */
    builderFields() {
        return [
            ['name', 'Name', 'text'],
            ['contentEdit', 'Content', 'richtext']
        ];
    }

}
