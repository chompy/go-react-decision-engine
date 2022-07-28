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

}
