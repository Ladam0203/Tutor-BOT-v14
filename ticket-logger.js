/*
A log should store:
id: The ticket's id
visibleTo: Which tutors or the tutor role can see the ticket, this can change
openedBy: The user who opened the ticket, the ones opened by tutors probs dont have to be stored (a thing to do in the openticket.js)
openedAt: The timestamp of the opening
claimedBy: The tutor who claimed the ticket
claimedAt: The timestamp of claiming
closedBy: The user who closed the ticket
closedAt: The timestamp of closing the ticket
*/

const fs = require('node:fs')

const ticketLogsPath = "./ticket_logs.json";

module.exports = {
    create(id, visibleTo, openedBy) {
        const ticketLogs = JSON.parse(fs.readFileSync(ticketLogsPath));
        ticketLogs[id] = 
        {
            id: id,
            visibleTo: visibleTo,
            openedBy: openedBy,
            openedAt: new Date(),
            claimedBy: null,
            claimedAt: null,
            closedBy: null,
            closedAt: null
        }
        fs.writeFileSync(ticketLogsPath, JSON.stringify(ticketLogs, null, 2));
    },

    update(ticketLog) {
        const ticketLogs = JSON.parse(fs.readFileSync(ticketLogsPath));
        ticketLogs[ticketLog.id] = {
            id: ticketLog.id,
            visibleTo: ticketLog.visibleTo,
            openedBy: ticketLog.openedBy,
            openedAt: ticketLog.openedAt,
            claimedBy: ticketLog.claimedBy,
            claimedAt: ticketLog.claimedAt,
            closedBy: ticketLog.closedBy,
            closedAt: ticketLog.closedAt
        }
        fs.writeFileSync(ticketLogsPath, JSON.stringify(ticketLogs, null, 2));
    },

    get(id) {
        const ticketLogs = JSON.parse(fs.readFileSync(ticketLogsPath));
        return ticketLogs[id];
    },

    makeTicketId() {
        //TODO: Keep in mind that id's have to be unique as they are logged
        var length = 5;
        var result           = '';
        var characters       = 'abcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for ( var i = 0; i < length; i++ ) {
          result += characters.charAt(Math.floor(Math.random() * 
     charactersLength));
       }
       return result;
    },

    IdFromChannelName(channelName) {
        return channelName.split("-")[1];
    }
}