const Discord = require("discord.js");
const {
    EmbedBuilder,
} = require("discord.js");
const config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
const emoji = require(`${process.cwd()}/botconfig/emojis.json`);
const { GetUser, GetGlobalUser, handlemsg } = require(`${process.cwd()}/handlers/functions`);
module.exports = {
    name: "customavatar",
    aliases: ["cav", "cavatar", "memberavatar", "mavatar"],
    category: "🔰 Info",
    description: "Get the Avatar of an user",
    usage: "avatar [@USER]",
    type: "user",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        try {
            //"HELLO"
            var user;
            let customavatar = false;
            try {
                user = await GetUser(message, args);
            } catch (e) {
                return message.reply({
                    content: String("```" + e.message ? String(e.message).substring(0, 1900) : String(e) + "```"),
                });
            }
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
            if (customavatar) {
                let embed = new EmbedBuilder()
                    .setAuthor({ name: handlemsg(client.la[ls].cmds.info.avatar.author, {
                            usertag: user.tag,
                        }), iconURL: customavatar, url: "https://discord.gg/milrato" })
                    .setColor(es.color)
                    .setThumbnail(
                        es.thumb
                            ? es.footericon && (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                ? es.footericon
                                : client.user.displayAvatarURL()
                            : null
                    )
                    .addFields({ name: "<:arrow:832598861813776394> PNG", value: `[\`LINK\`](${customavatar})`, inline: true })
                    .addFields({ name: "<:arrow:832598861813776394> JPEG", value: `[\`LINK\`](${customavatar.replace("png", "jpg").replace("gif", "jpg")})`, inline: true })
                    .addFields({ name: "<:arrow:832598861813776394> WEBP", value: `[\`LINK\`](${customavatar.replace("png", "webp").replace("gif", "webp")})`, inline: true })
                    .setURL(customavatar)
                    .setFooter(client.getFooter(es))
                    .setImage(customavatar);
                message.reply({
                    embeds: [embed],
                });
            } else {
                let embed = new EmbedBuilder()
                    .setAuthor({ name: handlemsg(client.la[ls].cmds.info.avatar.author, {
                            usertag: user.tag,
                        }), iconURL: user.displayAvatarURL({
                            dynamic: true,
                        }), url: "https://discord.gg/milrato" })
                    .setColor(es.color)
                    .setThumbnail(
                        es.thumb
                            ? es.footericon && (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                ? es.footericon
                                : client.user.displayAvatarURL()
                            : null
                    )
                    .addFields({ name: "<:arrow:832598861813776394> PNG", value: `[\`LINK\`](${user.displayAvatarURL({ format: "png" })})`, inline: true })
                    .addFields({ name: "<:arrow:832598861813776394> JPEG", value: `[\`LINK\`](${user.displayAvatarURL({ format: "jpg" })})`, inline: true })
                    .addFields({ name: "<:arrow:832598861813776394> WEBP", value: `[\`LINK\`](${user.displayAvatarURL({ format: "webp" })})`, inline: true })
                    .setURL(
                        user.displayAvatarURL({
                            dynamic: true,
                        })
                    )
                    .setFooter(client.getFooter(es))
                    .setImage(
                        user.displayAvatarURL({
                            dynamic: true,
                            size: 512,
                        })
                    )
                    .setDescription(
                        `**Member has no Custom Avatar / unable to find the Member, in this Server**\n> *I am displaying, his normal AVATAR!*`
                    );
                message.reply({
                    embeds: [embed],
                });
            }
        } catch (e) {
            console.log(String(e.stack).grey.bgRed);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.wrongcolor)
                        .setFooter(client.getFooter(es))
                        .setTitle(client.la[ls].common.erroroccur)
                        .setDescription(eval(client.la[ls]["cmds"]["info"]["avatar"]["variable1"])),
                ],
            });
        }
    },
};
/*
 * @INFO
 * Bot Coded by Tomato#6966 | https://discord.gg/milrato
 * @INFO
 * Work for Milrato Development | https://milrato.eu
 * @INFO
 * Please mention him / Milrato Development, when using this Code!
 * @INFO
 */
