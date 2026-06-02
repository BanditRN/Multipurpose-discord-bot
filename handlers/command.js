const { readdirSync } = require("fs");
const {
    EmbedBuilder,
} = require("discord.js");
const serialize = require("serialize-javascript");
const ee = require(`${process.cwd()}/botconfig/embed.json`);
console.log("Welcome to SERVICE HANDLER /--/ By https://milrato.eu /--/ Discord: Tomato#6966".yellow);
module.exports = async client => {
    const { default: Enmap } = await import("enmap");
    let dateNow = Date.now();
    console.log(`${String("[x] :: ".magenta)}Now loading the Commands ...`.brightGreen);
    try {
        readdirSync("./commands/").forEach(dir => {
            const commands = readdirSync(`./commands/${dir}/`).filter(file => file.endsWith(".js"));
            for (let file of commands) {
                try {
                    let pull = require(`../commands/${dir}/${file}`);
                    if (pull.name) {
                        client.commands.set(pull.name, pull);
                        //console.log(`    | ${file} :: Ready`.brightGreen)
                    } else {
                        //console.log(`    | ${file} :: error -> missing a help.name,or help.name is not a string.`.brightRed)
                        continue;
                    }
                    if (pull.aliases && Array.isArray(pull.aliases))
                        pull.aliases.forEach(alias => client.aliases.set(alias, pull.name));
                } catch (e) {
                    const errText = String(e.stack || e || "");
                    const isKnownEsmIssue =
                        errText.includes("ERR_REQUIRE_ESM") &&
                        (errText.includes("@m3rcena\\weky") || errText.includes("\\commands\\🕹️ Fun\\joke.js"));
                    if (isKnownEsmIssue) {
                        console.log(
                            `[WARN] Skipping incompatible command file due to ESM/CJS mismatch: ${dir}/${file}`.yellow
                        );
                    } else {
                        console.log(String(e.stack).grey.bgRed);
                    }
                }
            }
        });
    } catch (e) {
        console.log(String(e.stack).grey.bgRed);
    }

    client.backupDB = new Enmap({ name: "backups", dataDir: "./databases" });

    let GiveawaysManager = null;
    try {
        ({ GiveawaysManager } = require("discord-giveaways"));
    } catch (e) {
        console.log("[WARN] discord-giveaways is not compatible with this Discord.js major. Skipping giveaways init.".yellow);
    }
    client.giveawayDB = new Enmap({ name: "giveaways", dataDir: "./databases" });
    if (!GiveawaysManager) {
        console.log(
            `[x] :: `.magenta +
                `LOADED THE ${client.commands.size} COMMANDS after: `.brightGreen +
                `${Date.now() - dateNow}ms`.green
        );
        return;
    }
    const GiveawayManagerWithOwnDatabase = class extends GiveawaysManager {
        async getAllGiveaways() {
            return Array.from(client.giveawayDB.values());
        }
        async saveGiveaway(messageId, giveawayData) {
            client.giveawayDB.set(messageId, giveawayData);
            return true;
        }
        async editGiveaway(messageId, giveawayData) {
            client.giveawayDB.set(messageId, giveawayData);
            return true;
        }
        async deleteGiveaway(messageId) {
            client.giveawayDB.delete(messageId);
            return true;
        }
    };

    let manager = null;
    try {
        manager = new GiveawayManagerWithOwnDatabase(client, {
            default: {
                botsCanWin: false,
                embedColor: ee.color,
                embedColorEnd: ee.wrongcolor,
                reaction: "🎉",
            },
        });
    } catch (e) {
        console.log("[WARN] discord-giveaways runtime init failed on this setup. Skipping giveaways manager.".yellow);
        console.log(e.stack ? String(e.stack).grey : String(e).grey);
        console.log(
            `[x] :: `.magenta +
                `LOADED THE ${client.commands.size} COMMANDS after: `.brightGreen +
                `${Date.now() - dateNow}ms`.green
        );
        return;
    }
    // We now have a giveawaysManager property to access the manager everywhere!
    client.giveawaysManager = manager;
    client.giveawaysManager.on("giveawayReactionAdded", async (giveaway, member, reaction) => {
        try {
            const isNotAllowed = await giveaway.exemptMembers(member);
            if (isNotAllowed) {
                member
                    .send({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(ee.wrongcolor)
                                .setThumbnail(member.guild.iconURL({ dynamic: true }))
                                .setAuthor({ name: `Missing the Requirements`, iconURL: `https://cdn.discordapp.com/emojis/906917501986820136.png?size=128` })
                                .setDescription(
                                    `> **Your are not fullfilling the Requirements for [this Giveaway](https://discord.com/channels/${giveaway.guildId}/${giveaway.channelId}/${giveaway.messageId}), please make sure to fullfill them!.**\n\n> Go back to the Channel: <#${giveaway.channelId}>`
                                )
                                .setFooter({ text: member.guild.name, iconURL: member.guild.iconURL({ dynamic: true }) }),
                        ],
                    })
                    .catch(() => {});
                reaction.users.remove(member.user).catch(() => {});
                return;
            }
            let BonusEntries = (await giveaway.checkBonusEntries(member.user).catch(() => {})) || 0;
            if (!BonusEntries) BonusEntries = 0;
            member
                .send({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(ee.color)
                            .setThumbnail(member.guild.iconURL({ dynamic: true }))
                            .setAuthor({ name: `Giveaway Entry Confirmed`, iconURL: `https://cdn.discordapp.com/emojis/833101995723194437.gif?size=128` })
                            .setDescription(
                                `> **Your entry for [this Giveaway](https://discord.com/channels/${giveaway.guildId}/${giveaway.channelId}/${giveaway.messageId}) has been confirmed.**\n\n**Prize:**\n> ${giveaway.prize}\n\n**Winnersamount:**\n> \`${giveaway.winnerCount}\`\n\n**Your Bonus Entries**\n> \`${BonusEntries}\`\n\n> Go back to the Channel: <#${giveaway.channelId}>`
                            )
                            .setFooter({ text: member.guild.name, iconURL: member.guild.iconURL({ dynamic: true }) }),
                    ],
                })
                .catch(() => {});
            console.log(`${member.user.tag} entered giveaway #${giveaway.messageId} (${reaction.emoji?.name})`);
        } catch (e) {
            console.log(e);
        }
    });
    client.giveawaysManager.on("giveawayReactionRemoved", (giveaway, member, reaction) => {
        try {
            member
                .send({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(ee.wrongcolor)
                            .setThumbnail(member.guild.iconURL({ dynamic: true }))
                            .setAuthor({ name: `Giveaway Left!`, iconURL: `https://cdn.discordapp.com/emojis/833101995723194437.gif?size=128` })
                            .setDescription(
                                `> **You left [this Giveaway](https://discord.com/channels/${giveaway.guildId}/${giveaway.channelId}/${giveaway.messageId}) and aren't participating anymore.**\n\n> Go back to the Channel: <#${giveaway.channelId}>`
                            )
                            .setFooter({ text: member.guild.name, iconURL: member.guild.iconURL({ dynamic: true }) }),
                    ],
                })
                .catch(() => {});
            console.log(`${member.user.tag} left giveaway #${giveaway.messageId} (${reaction.emoji?.name})`);
        } catch (e) {
            console.log(e);
        }
    });
    client.giveawaysManager.on("giveawayEnded", (giveaway, winners) => {
        for (const winner of winners) {
            winner
                .send({
                    contents: `Congratulations, **${winner.user.tag}**! You won the Giveaway.`,
                    embeds: [
                        new EmbedBuilder()
                            .setColor(ee.color)
                            .setThumbnail(winner.guild.iconURL({ dynamic: true }))
                            .setAuthor({ name: `Giveaway Won!`, iconURL: `https://cdn.discordapp.com/emojis/833101995723194437.gif?size=128` })
                            .setDescription(
                                `> **You won [this Giveaway](https://discord.com/channels/${giveaway.guildId}/${giveaway.channelId}/${giveaway.messageId}), congrats!**\n\n> Go to the Channel: <#${giveaway.channelId}>\n\n**Prize:**\n> ${giveaway.prize}`
                            )
                            .setFooter({ text: winner.guild.name, iconURL: winner.guild.iconURL({ dynamic: true }) }),
                    ],
                })
                .catch(() => {});
        }
        console.log(
            `Giveaway #${giveaway.messageId} ended! Winners: ${winners.map(member => member.user.username).join(", ")}`
        );
    });
    // This can be used to add features such as a congratulatory message per DM
    manager.on("giveawayRerolled", (giveaway, winners) => {
        for (const winner of winners) {
            winner
                .send({
                    contents: `Congratulations, **${winner.user.tag}**! You won the Giveaway through a \`reroll\`.`,
                    embeds: [
                        new EmbedBuilder()
                            .setColor(ee.wrongcolor)
                            .setThumbnail(winner.guild.iconURL({ dynamic: true }))
                            .setAuthor({ name: `Giveaway Won!`, iconURL: `https://cdn.discordapp.com/emojis/833101995723194437.gif?size=128` })
                            .setDescription(
                                `> **You won [this Giveaway](https://discord.com/channels/${giveaway.guildId}/${giveaway.channelId}/${giveaway.messageId}), congrats!**\n\n> Go to the Channel: <#${giveaway.channelId}>\n\n**Prize:**\n> ${giveaway.prize}`
                            )
                            .setFooter({ text: winner.guild.name, iconURL: winner.guild.iconURL({ dynamic: true }) }),
                    ],
                })
                .catch(() => {});
        }
    });
    console.log(
        `[x] :: `.magenta +
            `LOADED THE ${client.commands.size} COMMANDS after: `.brightGreen +
            `${Date.now() - dateNow}ms`.green
    );
};
/**
 * @INFO
 * Bot Coded by Tomato#6966 | https://discord.gg/milrato
 * @INFO
 * Work for Milrato Development | https://milrato.eu
 * @INFO
 * Please mention him / Milrato Development, when using this Code!
 * @INFO
 */
