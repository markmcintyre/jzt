/**
 * Delayed event scheduler.
 *
 * This scheduler includes an initial delay before repeating events. It is used,
 * for example, to repeat events while a key is held down while including a
 * slight delay before repeating begins.
 */
class DelayedEventScheduler {
    constructor(initialDelay, subsequentDelay) {
        this.initialDelay = initialDelay;
        this.subsequentDelay = subsequentDelay;
        this.event = undefined;
        this.nextAllowableEvent = 0;
    }

    scheduleEvent(eventTime, event) {
        var now = Date.now();
        if (now > this.nextAllowableEvent) {
            if (eventTime + this.initialDelay < now) {
                this.nextAllowableEvent = now + this.subsequentDelay;
            } else {
                this.nextAllowableEvent = now + this.initialDelay;
            }
            this.event = event;
        }
    }

    cancelEvent() {
        this.nextAllowableEvent = 0;
    }

    takeEvent() {
        var result = this.event;
        this.event = undefined;
        return result;
    }
}


export { DelayedEventScheduler };
