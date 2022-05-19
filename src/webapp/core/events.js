/**
 * @var {string}
 */
const EVENT_NAME_PREFIX = 'cc_decision_engine_';

/**
 * Handles events.
 * 
 * DECISION ENGINE EVENTS...
 * update               - Fires when a decision object is updated and should be rerendered. (decision object)
 * root_update          - Fires when the root decision object is updated.
 * render               - Fires when the decision engine has been rendered.
 * error                - Fires when an error occurs. (type, message, revelevant decision object uid)
 * change               - Fires when an user makes form entry, update user data. (changed decision object, answer value, whether or not answer is multiple choice, whether or not answer is being deleted, matrix id)
 * section              - Fires when user request section navigation. (root object, section uid
 * render_options       - Fires when rendering buttons beneath decision form/document. Adds adding additionals buttons. (decision object, add function[label, callback])
 * pre_rule_evaluation  - Fires right before rules are evaluated. (decision object)
 * rule_evaluation      - Fires when a rule is evaluated. (See RuleEngine::evaluate)
 * do_load              - Signal that decision manager should load a decision object.
 * do_user_data         - Signal that decision manager should load user data.
 * do_submit            - Signal that decision manager should submit current user data.
 * do_pdf               - Signal that decision manager should render a PDF.
 * do_evaluate          - Signal that decision manager should evaluate rules of root decision object.
 */
export default class Events {

    /**
     * Dispatch an event.
     * @param {string} name 
     * @param {*} data 
     */
    static dispatch(name, data) {
        let ce = new CustomEvent(
            EVENT_NAME_PREFIX + Events.sanitizeEventName(name),
            {
                detail: data
            }
        )
        window.dispatchEvent(ce);
    }

    /**
     * Listen for event.
     * @param {string} name 
     * @param {Function} callback 
     */
    static listen(name, callback) {
        window.addEventListener(
            EVENT_NAME_PREFIX + Events.sanitizeEventName(name),
            callback
        );
    }

    /**
     * Stop listening for event.
     * @param {string} name 
     * @param {Function} callback 
     */
    static remove(name, callback) {
        window.removeEventListener(
            EVENT_NAME_PREFIX + Events.sanitizeEventName(name),
            callback
        );
    }

    /**
     * @param {string} name 
     * @return {string}
     */
    static sanitizeEventName(name) {
        return name.replace(EVENT_NAME_PREFIX, '').trim();
    }

}