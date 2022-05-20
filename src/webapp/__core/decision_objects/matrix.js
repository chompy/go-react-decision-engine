import DecisionBase from './base';
import DecisionMatrixComponent from '../components/decision_matrix';

export default class DecisionMatrix extends DecisionBase {

    constructor(uid) {
        super(uid);
        this.name = '';
    }

    /**
     * @inheritdoc
     */
    static getTypeName() {
        return 'decision_matrix';
    }

    /**
     * @inheritdoc
     */
    getComponent() {
        return DecisionMatrixComponent;
    }

    /**
     * @inheritdoc
     */
    exportJSON() {
        let out = super.exportJSON();
        out['name'] = this.name;
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
            },
            data
        )
        return obj;
    }

    /**
     * @inheritdoc
     */
    toPdfMake(userData) {
        // matrix is only intended to be used on forms
        return {};
    }

    /**
     * @inheritdoc
     */
    builderFields() {
        return [
            ['name', 'Name', 'text'],
        ];
    }

}
