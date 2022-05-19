import '../../scss/core.scss';
import DecisionManager from './decision_manager';
import Events from './events';

export function initListen() {
    Events.listen(
        'init',
        function(e) {
            if (typeof(console) != 'undefined') {
                console.log('== INIT DECISION ENGINE ==');
            }
            let topEvent = e;
            let onError = function(e) {
                topEvent.detail.element.classList.add('error');
                topEvent.detail.element.innerText = 'ERROR: ' + e.detail.message;
            };
            Events.listen('error', onError);
            let m = new DecisionManager(e.detail);
            if (e.detail.userKey) {
                m.fetchUserData(
                    function() {
                        m.load(e.detail.uid);
                    }
                );
            } else if (e.detail.uid) {
                m.load(e.detail.uid);
            }
        }
    );
}

initListen();