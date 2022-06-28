// Generic helper functions.
export default class Helpers {

    /**
     * Format date object to human readable string.
     * @param {Date} date 
     * @return {string}
     */
    static formatDate(date) {
        if (typeof date == 'string') {
            date = new Date(date);
        }
        return date.toLocaleString();
    }

    /**
     * Shorten an id string.
     * @param {string} id 
     * @returns 
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


}
