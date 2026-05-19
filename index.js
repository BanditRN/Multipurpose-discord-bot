/**********************************************************
 * @INFO  [TABLE OF CONTENTS]
 * 1  Import_Modules
 * 1.1 Validating script for advertisement
 * 2  CREATE_THE_DISCORD_BOT_CLIENT
 * 3  Load_Discord_Buttons_and_Discord_Menus
 * 4  Create_the_client.memer
 * 5  create_the_languages_objects
 * 6  Raise_the_Max_Listeners
 * 7  Define_the_Client_Advertisments
 * 8  LOAD_the_BOT_Functions
 * 9  Login_to_the_Bot
 *
 *   BOT CODED BY: TOMato6966 | https://milrato.eu
 *********************************************************/

/**********************************************************
 * @param {1} Import_Modules for this FIle
 *********************************************************/
const Discord = require("discord.js");
const { GatewayIntentBits, Partials, ActivityType } = require("discord.js");
const colors = require("colors");
const fs = require("fs");
const OS = require("os");
const Events = require("events");
const emojis = require("./botconfig/emojis.json");
const config = require("./botconfig/config.json");
const advertisement = require("./botconfig/advertisement.json");
const { delay } = require("./handlers/functions");
require("dotenv").config();

/**********************************************************
 * @param {2} CREATE_THE_DISCORD_BOT_CLIENT with some default settings
 *********************************************************/
const client = new Discord.Client({
    shards: "auto",
    failIfNotExists: false,
    allowedMentions: {
        parse: ["roles", "users"],
        repliedUser: false,
    },
    partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.GuildMember, Partials.User],
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.MessageContent,
    ],
    presence: {
        activities: [
            {
                name: `${config.status.text}`.replace("{prefix}", config.prefix),
                type: ActivityType.Playing,
                url: config.status.url,
            },
        ],
        status: "online",
    },
});

/**********************************************************
 * @param {4} Create_the_client.memer property from Tomato's Api
 *********************************************************/
const Meme = require("memer-api");
client.memer = new Meme(process.env.memer_api || config.memer_api); // GET a TOKEN HERE: https://discord.gg/Mc2FudJkgP

/**********************************************************
 * @param {5} create_the_languages_objects to select via CODE
 *********************************************************/
client.la = {};
var langs = fs.readdirSync("./languages");
for (const lang of langs.filter(file => file.endsWith(".json"))) {
    client.la[`${lang.split(".json").join("")}`] = require(`./languages/${lang}`);
}
Object.freeze(client.la);
//function "handlemsg(txt, options? = {})" is in /handlers/functions

/**********************************************************
 * @param {6} Raise_the_Max_Listeners (default 10)
 * Using 25 instead of 0 to keep memory leak detection active.
 * process gets 60: each of the ~33 Enmap instances registers its own
 * process.on('exit') listener to close its SQLite connection, plus
 * Node internals and lavalink-client add several more.
 *********************************************************/
client.setMaxListeners(25);
Events.defaultMaxListeners = 25;
process.setMaxListeners(60);
process.env.UV_THREADPOOL_SIZE = OS.cpus().length;

/**********************************************************
 * @param {7} Define_the_Client_Advertisments from the Config File
 *********************************************************/
client.ad = {
    enabled: advertisement.adenabled,
    statusad: advertisement.statusad,
    spacedot: advertisement.spacedot,
    textad: advertisement.textad,
};

/**********************************************************
 * @param {8} LOAD_the_BOT_Functions
 *********************************************************/
//those are must haves, they load the dbs, events and commands and important other stuff
async function requirehandlers() {
    // Phase 1: Sync setup — collections and client properties must exist before anything else
    for (const handler of ["extraevents", "clientvariables"]) {
        try {
            require(`./handlers/${handler}`)(client);
        } catch (e) {
            console.log(e.stack ? String(e.stack).grey : String(e).grey);
        }
    }

    // Phase 2: Parallel — command loading (100+ file reads) and database init (20+ SQLite opens)
    // are fully independent; run them together to cut their combined cost down to max(cmd, db).
    await Promise.all([
        (async () => {
            try {
                await require(`./handlers/command`)(client);
            } catch (e) {
                console.log(e.stack ? String(e.stack).grey : String(e).grey);
            }
        })(),
        (async () => {
            try {
                await require(`./handlers/loaddb`)(client);
            } catch (e) {
                console.log(e.stack ? String(e.stack).grey : String(e).grey);
            }
        })(),
    ]);

    // Phase 3: Core Discord handlers — must be registered before the WebSocket opens
    for (const handler of ["events", "erelahandler", "slashCommands"]) {
        try {
            require(`./handlers/${handler}`)(client);
        } catch (e) {
            console.log(e.stack ? String(e.stack).grey : String(e).grey);
        }
    }

    // Phase 4: Login now — Discord WebSocket handshake (~200–500 ms) overlaps with Phase 5 below
    client.login(process.env.token || config.token);

    // Phase 5: Non-critical handlers — only need to be ready before real user traffic arrives.
    // Running after login means these ~34 require() calls no longer block the connection.
    ["twitterfeed", /*"twitterfeed2",*/ "livelog", "youtube", "tiktok"].forEach(handler => {
        try {
            require(`./social_log/${handler}`)(client);
        } catch (e) {
            console.log(e.stack ? String(e.stack).grey : String(e).grey);
        }
    });
    [
        "logger",
        "anti_nuke",
        "antidiscord",
        "antilinks",
        "anticaps",
        "antispam",
        "blacklist",
        "keyword",
        "antimention",
        "autobackup",

        "apply",
        "ticket",
        "ticketevent",
        "roster",
        "joinvc",
        "epicgamesverification",
        "boostlog",

        "welcome",
        "leave",
        "ghost_ping_detector",
        "antiselfbot",

        "jointocreate",
        "reactionrole",
        "ranking",
        "timedmessages",

        "membercount",
        "autoembed",
        "suggest",
        "validcode",
        "dailyfact",
        "autonsfw",
        "aichat",
        "mute",
        "automeme",
        "counter",
    ].forEach(handler => {
        try {
            require(`./handlers/${handler}`)(client);
        } catch (e) {
            console.log(e.stack ? String(e.stack).grey : String(e).grey);
        }
    });
}
process.on("unhandledRejection", reason => {
    console.log("=== UNHANDLED REJECTION ===".red);
    if (reason instanceof Error) {
        console.log((reason.stack || reason.message || String(reason)).grey);
    } else {
        try {
            console.log(JSON.stringify(reason, null, 2).grey);
        } catch {
            console.log(String(reason).grey);
        }
    }
    console.log("=== UNHANDLED REJECTION ===".red);
});

process.on("uncaughtException", err => {
    console.log("=== UNCAUGHT EXCEPTION ===".red);
    console.log((err?.stack || err?.message || String(err)).grey);
    console.log("=== UNCAUGHT EXCEPTION ===".red);
});

/**********************************************************
 * @param {9} Login_to_the_Bot — triggered from inside requirehandlers (Phase 4)
 *   after databases + critical events are ready but before non-critical handlers.
 *********************************************************/
requirehandlers();

/**********************************************************
 * @INFO
 * Bot Coded by Tomato#6966 | https://discord.gg/milrato
 * @INFO
 * Work for Milrato Development | https://milrato.eu
 * @INFO
 * Please mention him / Milrato Development, when using this Code!
 * @INFO
 *********************************************************/
