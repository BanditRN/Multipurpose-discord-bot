const Discord = require("discord.js");
const {
    EmbedBuilder,
    PermissionFlagsBits,
} = require("discord.js");
const config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
const emoji = require(`${process.cwd()}/botconfig/emojis.json`);
const moment = require("moment");
const { GetUser, GetGlobalUser, handlemsg } = require(`${process.cwd()}/handlers/functions`);
const flags = {
    DISCORD_EMPLOYEE: "Discord Employee",
    DISCORD_PARTNER: "Discord Partner",
    BUGHUNTER_LEVEL_1: "Bug Hunter (Level 1)",
    BUGHUNTER_LEVEL_2: "Bug Hunter (Level 2)",
    HYPESQUAD_EVENTS: "HypeSquad Events",
    HOUSE_BRAVERY: "House of Bravery",
    HOUSE_BRILLIANCE: "House of Brilliance",
    HOUSE_BALANCE: "House of Balance",
    EARLY_SUPPORTER: "Early Supporter",
    TEAM_USER: "Team User",
    SYSTEM: "System",
    VERIFIED_BOT: "Verified Bot",
    VERIFIED_DEVELOPER: "Verified Bot Developer",
};
function trimArray(arr, maxLen = 25) {
    if ([...arr.values()].length > maxLen) {
        const len = [...arr.values()].length - maxLen;
        arr = [...arr.values()].sort((a, b) => b?.rawPosition - a.rawPosition).slice(0, maxLen);
        arr.map(role => `<@&${role.id}>`);
        arr.push(`${len} more...`);
    }
    return arr.join(", ");
}
const statuses = {
    online: "🟢",
    idle: "🟠",
    dnd: "🔴",
    offline: "⚫️",
};
module.exports = {
    name: "userinfo",
    aliases: ["uinfo"],
    category: "🔰 Info",
    description: "Get information about a user",
    usage: "userinfo [@USER] [global/guild]",
    type: "user",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        try {
            var user;
            if (args[0]) {
                try {
                    if (args[1] && args[1].toLowerCase() == "global") {
                        args.pop();
                        user = await GetGlobalUser(message, args);
                    } else {
                        user = await GetUser(message, args);
                    }
                } catch (e) {
                    console.log(e.stack ? String(e.stack).grey : String(e).grey);
                    return message.reply(client.la[ls].common.usernotfound);
                }
            } else {
                user = message.author;
            }
            let banner = false;
            let customavatar = false;
            if (!user || user == null || user.id == null || !user.id)
                return message.reply(client.la[ls].common.usernotfound);
            try {
                let member = message.guild.members.cache.get(user.id);
                if (!member) (await message.guild.members.fetch(user.id).catch(() => {})) || false;
                if (member && member.avatar) {
                    customavatar = member.displayAvatarURL({
                        dynamic: true,
                        size: 4096,
                    });
                }
            } catch (e) {
                console.log(String(e.stack).grey.bgRed);
            }
            try {
                await user
                    .fetch()
                    .then(user => {
                        if (user.banner) {
                            banner = user.bannerURL({
                                dynamic: true,
                                size: 4096,
                            });
                        }
                    })
                    .catch(() => {});
            } catch (e) {
                console.log(e.stack ? String(e.stack).grey : String(e).grey);
            }
            try {
                let member = message.guild.members.cache.get(user.id);
                if (!member) (await message.guild.members.fetch(user.id).catch(() => {})) || false;
                const roles = member.roles;
                const userFlags = member.user.flags.toArray();
                const activity = member.presence
                    ? member.presence.activities[0]
                    : {
                          type: "CUSTOM",
                          emoji: {
                              name: "❌",
                          },
                          state: "OFFLINE - No activity",
                      };
                //create the EMBED
                const embeduserinfo = new EmbedBuilder();
                embeduserinfo.setThumbnail(
                    customavatar ? customavatar : member.user.displayAvatarURL({ dynamic: true, size: 512 })
                );
                embeduserinfo.setAuthor({ name: handlemsg(client.la[ls].cmds.info.userinfo.author, { usertag: member.user.tag }), iconURL: member.user.displayAvatarURL({ dynamic: true }), url: "https://discord.gg/milrato" });
                embeduserinfo.addFields({ name: client.la[ls].cmds.info.userinfo.field1, value: `> <@${member.user.id}>\n\`${member.user.tag}\``, inline: true });
                embeduserinfo.addFields({ name: client.la[ls].cmds.info.userinfo.field2, value: `> \`${member.id}\``, inline: true });
                embeduserinfo.addFields({ name: client.la[ls].cmds.info.userinfo.field3, value: `> [\`Link to avatar\`](${member.user.displayAvatarURL({ format: "png" })})${customavatar ? `\n\n> [\`Link to Custom Avatar\`](${customavatar})` : ""}`, inline: true });
                embeduserinfo.addFields({ name: client.la[ls].cmds.info.userinfo.field4, value: "> `" +
                        moment(member.user.createdTimestamp).format("DD/MM/YYYY") +
                        "`\n" +
                        "`" +
                        moment(member.user.createdTimestamp).format("hh:mm:ss") +
                        "`", inline: true });
                embeduserinfo.addFields({ name: client.la[ls].cmds.info.userinfo.field5, value: "> `" +
                        moment(member.joinedTimestamp).format("DD/MM/YYYY") +
                        "`\n" +
                        "`" +
                        moment(member.joinedTimestamp).format("hh:mm:ss") +
                        "`", inline: true });
                embeduserinfo.addFields({ name: client.la[ls].cmds.info.userinfo.field6, value: `> \`${userFlags.length ? userFlags.map(flag => flags[flag]).join(", ") : "None"}\``, inline: true });
                embeduserinfo.addFields({ name: client.la[ls].cmds.info.userinfo.field7, value: `> \`${statuses[member.presence ? member.presence.status : "offline"]} ${member.presence ? member.presence.status : "offline"}\``, inline: true });
                embeduserinfo.addFields({ name: client.la[ls].cmds.info.userinfo.field8, value: `> ${roles.size == 0 ? client.la[ls].cmds.info.userinfo.noroles : member.roles.highest.id === message.guild.id ? client.la[ls].cmds.info.userinfo.noroles : member.roles.highest}`, inline: true });
                embeduserinfo.addFields({ name: client.la[ls].cmds.info.userinfo.field9, value: `> \`${member.user.bot ? "✔️" : "❌"}\``, inline: true });
                var userstatus = client.la[ls].cmds.info.userinfo.nostatus;
                if (activity) {
                    if (activity.type === Discord.ActivityType.Custom) {
                        let emoji = `${activity.emoji ? (activity.emoji?.id ? `<${activity.emoji?.animated ? "a" : ""}:${activity.emoji?.name}:${activity.emoji?.id}>` : activity.emoji?.name) : ""}`;
                        userstatus = `${emoji} \`${activity.state || client.la[ls].cmds.info.userinfo.nostatus}\``;
                    } else {
                        const actTypeNames = ["Playing", "Streaming", "Listening", "Watching", "Custom", "Competing"];
                        userstatus = `\`${actTypeNames[activity.type] || "Playing"} ${activity.name}\``;
                    }
                }
                embeduserinfo.addFields({ name: client.la[ls].cmds.info.userinfo.field10, value: `> ${userstatus}` });
                embeduserinfo.addFields({ name: client.la[ls].cmds.info.userinfo.field11, value: `> ${
                        member.permissions.toArray().includes(PermissionFlagsBits.Administrator)
                            ? "`ADMINISTRATOR`"
                            : member.permissions
                                  .toArray()
                                  .sort((a, b) => a.localeCompare(b))
                                  .map(p => `\`${p}\``)
                                  .join("︲")
                    }`.substring(0, 2048) });
                embeduserinfo.addFields({ name: handlemsg(client.la[ls].cmds.info.userinfo.field12, { rolesize: roles.cache.size }), value: roles.cache.size < 25
                        ? [...roles.cache.values()]
                              .sort((a, b) => b?.rawPosition - a.rawPosition)
                              .map(role => `<@&${role.id}>`)
                              .join(", ")
                        : roles.cache.size > 25
                          ? trimArray(roles.cache)
                          : client.la[ls].cmds.info.userinfo.noroles });
                embeduserinfo.setColor(es.color);
                embeduserinfo.setFooter(client.getFooter(es));
                if (banner) embeduserinfo.setImage(banner);
                //send the EMBED
                message.reply({ embeds: [embeduserinfo] });
            } catch (e) {
                console.log(e.stack ? String(e.stack).grey : String(e).grey);
                const userFlags = user.flags?.toArray();
                //create the EMBED
                const embeduserinfo = new EmbedBuilder();
                embeduserinfo.setThumbnail(
                    customavatar ? customavatar : user.displayAvatarURL({ dynamic: true, size: 512 })
                );
                embeduserinfo.setAuthor({ name: handlemsg(client.la[ls].cmds.info.userinfo.author, { usertag: user.tag }), iconURL: user.displayAvatarURL({ dynamic: true }), url: "https://discord.gg/milrato" });
                embeduserinfo.addFields({ name: client.la[ls].cmds.info.userinfo.field1, value: `<@${user.id}>\n\`${user.tag}\``, inline: true });
                embeduserinfo.addFields({ name: client.la[ls].cmds.info.userinfo.field2, value: `\`${user.id}\``, inline: true });
                embeduserinfo.addFields({ name: client.la[ls].cmds.info.userinfo.field3, value: `[\`Link to avatar\`](${user.displayAvatarURL({ format: "png" })})`, inline: true });
                embeduserinfo.addFields({ name: client.la[ls].cmds.info.userinfo.field4, value: "`" +
                        moment(user.createdTimestamp).format("DD/MM/YYYY") +
                        "`\n" +
                        "`" +
                        moment(user.createdTimestamp).format("hh:mm:ss") +
                        "`", inline: true });
                embeduserinfo.addFields({ name: client.la[ls].cmds.info.userinfo.field6, value: `\`${userFlags.length ? userFlags.map(flag => flags[flag]).join(", ") : "None"}\``, inline: true });
                embeduserinfo.addFields({ name: client.la[ls].cmds.info.userinfo.field9, value: `\`${user.bot ? "✔️" : "❌"}\``, inline: true });
                embeduserinfo.setColor(es.color);
                embeduserinfo.setFooter(client.getFooter(es));
                if (banner) embeduserinfo.setImage(banner);
                //send the EMBED
                message.reply({ embeds: [embeduserinfo] });
            }
        } catch (e) {
            console.log(String(e.stack).grey.bgRed);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.wrongcolor)
                        .setFooter(client.getFooter(es))
                        .setTitle(client.la[ls].common.erroroccur)
                        .setDescription(eval(client.la[ls]["cmds"]["info"]["color"]["variable2"])),
                ],
            });
        }
    },
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
