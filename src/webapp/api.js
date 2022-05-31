const URL_PREFIX = '/api/';

export default class BackendAPI {

    static request(endpoint, method, query, data, callback) {
        let url = URL_PREFIX + endpoint + (query && query.length > 0 ? '?' : '');
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
            .then(callback)
        ;
    }

    static get(endpoint, params, callback) {
        return BackendAPI.request(endpoint, 'GET', params, null, callback);
    }

    static post(endpoint, query, data, callback) {
        return BackendAPI.request(endpoint, 'POST', query, data, callback);
    }

}