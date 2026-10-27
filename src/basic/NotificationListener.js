/**
 * NotificationListener
 */
class NotificationListener {
    constructor() {
        this.notifications = [];
    }

    addNotification(type, message) {
        this.notifications.push({type: type, message: message, timestamp: Date.now()});
    }
}


export { NotificationListener };
