import BackendAPI from "./api";
import Events from "./events";

export default class RuleTemplateCollector {

    /** @var {Object} */
    static rules = {};

    /**
     * Add rule template to collector.
     * @param {Object} ruleTemplate 
     */
    static add(ruleTemplate) {
        RuleTemplateCollector.rules[ruleTemplate.id] = ruleTemplate;
    }

    /**
     * Get rule script from collector.
     * @param {String} id 
     * @returns {String}
     */
    static getScript(id) {
        return id in RuleTemplateCollector.rules ? RuleTemplateCollector.rules[id].script : '';
    }

    /**
     * Get rule template label from collector.
     * @param {String} id 
     * @returns {String}
     */
    static getLabel(id) {
        return id in RuleTemplateCollector.rules ? RuleTemplateCollector.rules[id].label : '';
    }

    /**
     * Fetch list of rule templates from backend.
     * @param {Array} ids
     * @param {CallableFunction} callback
     */
    static fetch(ids, callback) {
        let reqs = [];
        for (let i in ids) {
            let id = ids[i];
            reqs.push({path: 'rule_template/fetch', payload: {id: id}})
        }
        BackendAPI.batch(reqs, function(res) {
            RuleTemplateCollector.onFetch(res);
            if (callback) { callback(res); }
        });
    }

    /**
     * @param {Object} res  
     */
    static onFetch(res) {
        if (!res.success) { return; }
        for (let i in res.data) {
            let ruleRes = res.data[i];
            if (!ruleRes.success) { continue; }
            RuleTemplateCollector.add(ruleRes.data);
        }
        Events.dispatch('rule_template_collector_fetch');
    }

}