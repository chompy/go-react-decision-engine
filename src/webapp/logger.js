import Events from './events';

export default class Logger {

    static timerStart = 0;
    static timers = {
        default: 0
    };

    static info(msg) {
        if (typeof(console) != 'undefined') {
            console.log('> ' + msg);
        }
    }

    static warn(msg) {
        if (typeof(console) != 'undefined') {
            console.log('WARNING: ' + msg);
        }
    }

    static error(msg, data) {
        if (typeof(console) != 'undefined') {
            console.log('ERROR: ' + msg);
        }
        if (!data || typeof(data) != 'object') {
            data = {};
        }
        Events.dispatch(
            'error',
            Object.assign({}, {message: msg}, data)
        );
    }

    static resetTimer(timerId) {
        if (!timerId) {
            timerId = 'default';
        }
        Logger.timers[timerId] = new Date().getTime();
    }

    static getTime(timerId) {
        if (!timerId) {
            timerId = 'default';
        }
        return new Date().getTime() - Logger.timers[timerId]
    }

    static infoTime(msg, timerId) {
        Logger.info(
            msg + ' (' + Logger.getTime(timerId) + 'ms)'
        );
    }

    static errorTime(msg, timerId) {
        Logger.error(
            msg + ' (' + Logger.getTime(timerId) + 'ms)'
        );
    }

}