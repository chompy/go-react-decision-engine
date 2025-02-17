import Events from "./events";

const URL_PREFIX = '/api/';

export default class BackendAPI {

    static request(endpoint, method, query, data, callback) {
        let url = URL_PREFIX + endpoint + (query ? '?' : '');
        if (query) {
            for (let k in query) {
                url += encodeURIComponent(k) + '=' + encodeURIComponent(query[k]) + '&';
            }
        }
        let params = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        if (method != 'GET') {
            params['body'] = JSON.stringify(data);
        }
        fetch(url, params)
            .then(res => res.json())
            .then(function(res) {
                if (
                    !res.success && 
                    (
                        res.message.includes('no user provided') ||
                        res.message.includes('http invalid session') ||
                        res.message.includes('http login required')
                    )
                ) {
                    Events.dispatch('session_expire', null);
                }
                return res;
            })
            .then(callback)
        ;
    }

    static get(endpoint, params, callback) {
        return BackendAPI.request(endpoint, 'GET', params, null, callback);
    }

    static post(endpoint, query, data, callback) {
        return BackendAPI.request(endpoint, 'POST', query, data, callback);
    }

    static batch(requests, callback) {
        if (typeof requests != 'object' || requests.length == 0) { return; }
        let fixedRequests = requests.map(function(r) {
            r.path = URL_PREFIX + r.path;
            return r;
        })
        return BackendAPI.request('batch', 'POST', null, fixedRequests, callback);
    }

}