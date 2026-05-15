const Discord = require("discord.js");
const {
    EmbedBuilder,
} = require("discord.js");
const config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
const emoji = require(`${process.cwd()}/botconfig/emojis.json`);
const moment = require("moment");
const { swap_pages, handlemsg } = require(`${process.cwd()}/handlers/functions`);
module.exports = {
    name: "serveravatar",
    aliases: ["savatar", "guildavatar", "gavatar"],
    category: "🔰 Info",
    description: "Shows the ServerAvatar",
    usage: "serveravatar",
    type: "server",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        try {
            message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setAuthor({ name: handlemsg(client.la[ls].cmds.info.serveravatar.author, { servername: message.guild.name }), iconURL: message.guild.iconURL({ dynamic: true }), url: "https://discord.gg/milrato" })
                        .setColor(es.color)
                        .setThumbnail(
                            es.thumb
                                ? es.footericon && (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                    ? es.footericon
                                    : client.user.displayAvatarURL()
                                : null
                        )
                        .addFields({ name: "<:arrow:832598861813776394> PNG", value: `[\`LINK\`](${message.guild.iconURL({ format: "png" })})`, inline: true })
                        .addFields({ name: "<:arrow:832598861813776394> JPEG", value: `[\`LINK\`](${message.guild.iconURL({ format: "jpg" })})`, inline: true })
                        .addFields({ name: "<:arrow:832598861813776394> WEBP", value: `[\`LINK\`](${message.guild.iconURL({ format: "webp" })})`, inline: true })
                        .setURL(
                            message.guild.iconURL({
                                dynamic: true,
                            })
                        )
                        .setFooter(client.getFooter(es))
                        .setImage(
                            message.guild.iconURL({
                                dynamic: true,
                                size: 256,
                            })
                        ),
                ],
            });
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
