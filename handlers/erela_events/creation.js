const config = require(`${process.cwd()}/botconfig/config.json`);
const { CompatManager } = require("../lavalink_compat");

module.exports = client => {
    client.manager = new CompatManager(client, collect(config.clientsettings.nodes));

    //require the other events
    require("./node_events")(client);
    require("./client_events")(client);
    require("./events")(client);
    require("./musicsystem")(client);
};
/**
 * @INFO
 * Bot Coded by Tomato#6966 | https://github?.com/Tomato6966/discord-js-lavalink-Music-Bot-erela-js
 * @INFO
 * Work for Milrato Development | https://milrato.eu
 * @INFO
 * Please mention Him / Milrato Development, when using this Code!
 * @INFO
 */

function collect(node) {
    return node.map(x => {
        if (!x.host) throw new RangeError('"host" must be provided');
        if (!x.password) throw new RangeError('"password" must be provided');
        if (typeof x.port !== "number") throw new RangeError('"port" must be a number');
        if (x.retryAmount && typeof x.retryAmount !== "number") throw new RangeError("Retry amount must be a number");
        if (x.retryDelay && typeof x.retryDelay !== "number") throw new RangeError("Retry delay must be a number");
        if (x.secure && typeof x.secure !== "boolean") throw new RangeError("Secure must be a boolean");

        return {
            host: x.host,
            authorization: x.password ? x.password : "youshallnotpass",
            port: x.port && !isNaN(x.port) ? Number(x.port) : 2333,
            id: x.identifier || x.host,
            retryAmount: x.retryAmount ? Number(x.retryAmount) : 5,
            retryDelay: x.retryDelay ? Number(x.retryDelay) : 5000,
            secure: x.secure ? x.secure : false,
        };
    });
}
