const {
    EmbedBuilder,
} = require("discord.js");
const config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
const emoji = require(`${process.cwd()}/botconfig/emojis.json`);
const { getRandomInt, GetGlobalUser, GetUser, handlemsg } = require(`${process.cwd()}/handlers/functions`);
module.exports = {
    name: "modstats",
    category: "🔰 Info",
    aliases: ["adminstats"],
    usage: "modstats [@USER]",
    description: "Shows the Admin Stats of a Mod/Admin, how many cmds he has executed etc.",
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
                    if (!e) return message.reply(client.la[ls].common.usernotfound);
                    return message.reply({
                        content: String("```" + e.message ? String(e.message).substring(0, 1900) : String(e) + "```"),
                    });
                }
            } else {
                user = message.author;
            }
            if (!user || user == null || user.id == null || !user.id)
                return message.reply(client.la[ls].common.usernotfound);

            client.stats.ensure(message.guild.id + user.id, {
                ban: [],
                kick: [],
                mute: [],
                ticket: [],
                says: [],
                warn: [],
            });

            message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.color)
                        .setThumbnail(
                            es.thumb
                                ? es.footericon && (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                    ? es.footericon
                                    : client.user.displayAvatarURL()
                                : null
                        )
                        .setFooter(client.getFooter(es))
                        .addFields({ name: eval(client.la[ls]["cmds"]["info"]["modstats"]["variablex_1"]), value: eval(client.la[ls]["cmds"]["info"]["modstats"]["variable1"]), inline: true })
                        .addFields({ name: eval(client.la[ls]["cmds"]["info"]["modstats"]["variablex_2"]), value: eval(client.la[ls]["cmds"]["info"]["modstats"]["variable2"]), inline: true })
                        .addFields({ name: eval(client.la[ls]["cmds"]["info"]["modstats"]["variablex_3"]), value: eval(client.la[ls]["cmds"]["info"]["modstats"]["variable3"]), inline: true })

                        .addFields({ name: eval(client.la[ls]["cmds"]["info"]["modstats"]["variablex_4"]), value: eval(client.la[ls]["cmds"]["info"]["modstats"]["variable4"]), inline: true })
                        .addFields({ name: eval(client.la[ls]["cmds"]["info"]["modstats"]["variablex_5"]), value: eval(client.la[ls]["cmds"]["info"]["modstats"]["variable5"]), inline: true })
                        .addFields({ name: eval(client.la[ls]["cmds"]["info"]["modstats"]["variablex_6"]), value: eval(client.la[ls]["cmds"]["info"]["modstats"]["variable6"]), inline: true })

                        .addFields({ name: eval(client.la[ls]["cmds"]["info"]["modstats"]["variablex_7"]), value: eval(client.la[ls]["cmds"]["info"]["modstats"]["variable7"]), inline: true })
                        .addFields({ name: eval(client.la[ls]["cmds"]["info"]["modstats"]["variablex_8"]), value: eval(client.la[ls]["cmds"]["info"]["modstats"]["variable8"]), inline: true })
                        .addFields({ name: eval(client.la[ls]["cmds"]["info"]["modstats"]["variablex_9"]), value: eval(client.la[ls]["cmds"]["info"]["modstats"]["variable9"]), inline: true })

                        .addFields({ name: eval(client.la[ls]["cmds"]["info"]["modstats"]["variablex_10"]), value: eval(client.la[ls]["cmds"]["info"]["modstats"]["variable10"]), inline: true })
                        .addFields({ name: eval(client.la[ls]["cmds"]["info"]["modstats"]["variablex_11"]), value: eval(client.la[ls]["cmds"]["info"]["modstats"]["variable11"]), inline: true })
                        .addFields({ name: eval(client.la[ls]["cmds"]["info"]["modstats"]["variablex_12"]), value: eval(client.la[ls]["cmds"]["info"]["modstats"]["variable12"]), inline: true })

                        .addFields({ name: eval(client.la[ls]["cmds"]["info"]["modstats"]["variablex_13"]), value: eval(client.la[ls]["cmds"]["info"]["modstats"]["variable13"]), inline: true })
                        .addFields({ name: eval(client.la[ls]["cmds"]["info"]["modstats"]["variablex_14"]), value: eval(client.la[ls]["cmds"]["info"]["modstats"]["variable14"]), inline: true })
                        .addFields({ name: eval(client.la[ls]["cmds"]["info"]["modstats"]["variablex_15"]), value: eval(client.la[ls]["cmds"]["info"]["modstats"]["variable15"]), inline: true })

                        .addFields({ name: eval(client.la[ls]["cmds"]["info"]["modstats"]["variablex_16"]), value: eval(client.la[ls]["cmds"]["info"]["modstats"]["variable16"]), inline: true })
                        .addFields({ name: eval(client.la[ls]["cmds"]["info"]["modstats"]["variablex_17"]), value: eval(client.la[ls]["cmds"]["info"]["modstats"]["variable17"]), inline: true })
                        .addFields({ name: eval(client.la[ls]["cmds"]["info"]["modstats"]["variablex_18"]), value: eval(client.la[ls]["cmds"]["info"]["modstats"]["variable18"]), inline: true })
                        .addFields({ name: "\u200b", value: client.la[ls].cmds.info.modstats.desc })
                        .setAuthor({ name: `${client.la[ls].cmds.info.modstats.about} ${user.tag}`, iconURL: user.displayAvatarURL({ dynamic: true, size: 512 }) }),
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
