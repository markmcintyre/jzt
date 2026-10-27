import { CommandResult } from './shared.js';

export class SendCommand {
    constructor(recipient, message) {
    this.recipient = recipient;
    this.message = message;

    }

    execute(owner) {

    var recipients,
        index;

    if (this.recipient === 'SELF') {
        if (owner.scriptContext.jumpToLabel(this.message)) {
            return CommandResult.CONTINUE_AFTER_JUMP;
        }
        return CommandResult.CONTINUE;
    }

    if (this.recipient === 'ALL') {
        recipients = owner.board.getScripables();
    } else {
        recipients = owner.board.getScriptables(this.recipient);
    }

    for (index = 0; index < recipients.length; index += 1) {
        recipients[index].sendMessage(this.message);
    }

    return CommandResult.CONTINUE;


    }
}
