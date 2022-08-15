// Generic helper functions.
export default class Helpers {

    /**
     * Format date object to human readable string.
     * @param {Date} date 
     * @return {String}
     */
    static formatDate(date) {
        if (typeof date == 'string') {
            date = new Date(date);
        }
        return date.toLocaleString();
    }

    /**
     * Shorten an id string.
     * @param {String} id 
     * @returns {String}
     */
    static truncateId(id) {
        if (typeof id != 'string') {
            return '(no data)';
        }
        if (id.length < 6) {
            return id;
        }
        return id.substring(0, 6) + '...';
    }

    /**
     * Validate an email address.
     * @param {String} email 
     * @returns {boolean}
     */
    static validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    /**
     * Generate custom CSS style.
     * @param {Object} data 
     * @returns {String}
     */
    static generateCustomStyle(data) {
        let style = '';
        style += '.decision-engine .header .app-name { color: ' + data.titleCol + '; }';
        style += '.decision-engine .header { background-color: ' + data.headerBgCol + '; color: ' + data.headerFgCol + '; }';
        style += '.decision-engine .header .user .options a { color: ' + data.headerFgCol + '; }';
        style += 'html, body, #root { background-color: ' + data.pageBgCol + '; color: ' + data.pageFgCol + '; }' ;
        style += '\n\n' + data.style
        return style;
    }

}
