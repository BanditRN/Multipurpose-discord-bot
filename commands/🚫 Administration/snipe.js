const {
    EmbedBuilder,
    PermissionFlagsBits,
} = require("discord.js");
const config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
const { databasing } = require(`${process.cwd()}/handlers/functions`);
const moment = require("moment");
module.exports = {
    name: "snipe",
    category: "🚫 Administration",
    cooldown: 2,
    usage: "snipe [#Channel]",
    description: "Get the last Deleted Message from a Channel",
    type: "server",
    run: async (client, message, args, cmduser, text, prefix) => {
        console.log("TEST");
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        try {
            let adminroles = client.settings.get(message.guild.id, "adminroles");
            let cmdroles = client.settings.get(message.guild.id, "cmdadminroles.snipe");
            var cmdrole = [];
            if (cmdroles.length > 0) {
                for (const r of cmdroles) {
                    if (message.guild.roles.cache.get(r)) {
                        cmdrole.push(` | <@&${r}>`);
                    } else if (message.guild.members.cache.get(r)) {
                        cmdrole.push(` | <@${r}>`);
                    } else {
                        client.settings.remove(message.guild.id, r, `cmdadminroles.snipe`);
                    }
                }
            }
            if (
                [...message.member.roles.cache.values()] &&
                !message.member.roles.cache.some(r => cmdroles.includes(r.id)) &&
                !cmdroles.includes(message.author.id) && [...message.member.roles.cache.values()] &&
                !message.member.roles.cache.some(r => adminroles.includes(r ? r.id : r)) &&
                ![message.guild.ownerId, config.ownerid].includes(message.author.id) &&
                !message.member.permissions.has([PermissionFlagsBits.Administrator])
            )
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setFooter(client.getFooter(es))
                            .setTitle(eval(client.la[ls]["cmds"]["administration"]["say"]["variable1"]))
                            .setDescription(eval(client.la[ls]["cmds"]["administration"]["say"]["variable2"])),
                    ],
                });
            var channel = message.mentions.channels.first() || message.channel;

            const snipes = client.snipes.get(channel.id);
            if (!snipes) return message.reply("❌ There is no Deleted Message");
            const snipe = args[0] && !isNaN(args[0]) ? Number(args[0]) - 1 : 0;
            const targetSnipe = snipes[snipe];
            if (!targetSnipe) return message.reply("❌ There is no Deleted Message");
            const { tag, id, avatar, content, time, image } = targetSnipe;

            message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.color)
                        .setDescription(content.substring(0, 2048))
                        .setAuthor({ name: tag, iconURL: avatar })
                        .setImage(image)
                        .setFooter(
                            client.getFooter(
                                `${moment(time).fromNow()} - Snipe ${snipe + 1} / ${snipes.length}\nUser-ID: ${id}`,
                                avatar
                            )
                        ),
                ],
            });

            if (client.settings.get(message.guild.id, `adminlog`) != "no") {
                try {
                    var channel = message.guild.channels.cache.get(client.settings.get(message.guild.id, `adminlog`));
                    if (!channel) return client.settings.set(message.guild.id, "no", `adminlog`);
                    channel.send({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(es.color)
                                .setThumbnail(
                                    es.thumb
                                        ? es.footericon &&
                                          (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                            ? es.footericon
                                            : client.user.displayAvatarURL()
                                        : null
                                )
                                .setFooter(client.getFooter(es))
                                .setAuthor({ name: `${require("path").parse(__filename).name} | ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
                                .setDescription(eval(client.la[ls]["cmds"]["administration"]["say"]["variable5"]))
                                .addFields({ name: eval(client.la[ls]["cmds"]["administration"]["ban"]["variablex_15"]), value: eval(client.la[ls]["cmds"]["administration"]["ban"]["variable15"]) })
                                .addFields({ name: eval(client.la[ls]["cmds"]["administration"]["ban"]["variablex_16"]), value: eval(client.la[ls]["cmds"]["administration"]["ban"]["variable16"]) })
                                .setTimestamp()
                                .setFooter(
                                    client.getFooter(
                                        "ID: " + message.author.id,
                                        message.author.displayAvatarURL({ dynamic: true })
                                    )
                                ),
                        ],
                    });
                } catch (e) {
                    console.log(e.stack ? String(e.stack).grey : String(e).grey);
                }
            }
        } catch (e) {
            console.log(String(e.stack).grey.bgRed);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.wrongcolor)
                        .setFooter(client.getFooter(es))
                        .setTitle(client.la[ls].common.erroroccur)
                        .setDescription(eval(client.la[ls]["cmds"]["administration"]["say"]["variable8"])),
                ],
            });
        }
    },
};
/**
 * @INFO
 * Bot Coded by Tomato#6966 | https://github?.com/Tomato6966/Discord-Js-Handler-Template
 * @INFO
 * Work for Milrato Development | https://milrato.eu
 * @INFO
 * Please mention him / Milrato Development, when using this Code!
 * @INFO
 */
