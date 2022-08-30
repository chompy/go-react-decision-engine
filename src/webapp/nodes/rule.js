import BaseNode from './base.js';

export const RULE_TYPE_VISIBILITY = 'visibility';
export const RULE_TYPE_VALIDATION = 'validation';

export default class RuleNode extends BaseNode {

    constructor(uid) {
        super(uid);
        this.type = RULE_TYPE_VISIBILITY;
        this.templateData = {
            template: '',
            fieldValues: {}
        };

    }

    /**
     * {@inheritDoc}
     */
    static getTypeName() {
        return 'rule';
    }

    /**
     * {@inheritDoc}
     */
    getData() {
        return {
            'type' : this.type,
            'template': this.templateData?.template,
            'fieldValues': this.templateData?.fieldValues   
        };
    }
    
    /**
     * {@inheritDoc}
     */
    builderFields() {
        let out = [
            ['label', 'Label', 'text'],
            ['templateData', 'Template', 'rule_template'],
        ];
        return out;
    }

    /**
     * @returns {string}
     */
    getTemplateId() {
        return this.templateData?.template ? this.templateData.template : '';
    }

    /**
     * @returns {Object}
     */
    getRuleFieldValues() {
        return this.templateData?.fieldValues ? this.templateData.fieldValues : {};
    }

    /**
     * {@inheritDoc}
     */
    importData(data) {
        this.type = data?.type;
        this.templateData = {
            template: data?.template,
            fieldValues: data?.fieldValues ? data.fieldValues : {}  
        }
    }

}
