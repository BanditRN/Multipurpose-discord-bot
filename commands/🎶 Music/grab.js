const {
    EmbedBuilder,
} = require("discord.js");
const config = require(`${process.cwd()}/botconfig/config.json`);
const ee = require(`${process.cwd()}/botconfig/embed.json`);
const emoji = require(`${process.cwd()}/botconfig/emojis.json`);
const { createBar, format } = require(`${process.cwd()}/handlers/functions`);
const { handlemsg } = require(`${process.cwd()}/handlers/functions`);
module.exports = {
    name: `grab`,
    category: `🎶 Music`,
    aliases: [`save`, `yoink`],
    description: `Saves the current playing song to your Direct Messages`,
    usage: `grab`,
    parameters: {
        type: "music",
        activeplayer: true,
        previoussong: false,
    },
    type: "song",
    run: async (client, message, args, cmduser, text, prefix, player) => {
        try {
            let es = client.settings.get(message.guild.id, "embed");
            let ls = client.settings.get(message.guild.id, "language");
            if (!client.settings.get(message.guild.id, "MUSIC")) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setFooter(client.getFooter(es))
                            .setTitle(client.la[ls].common.disabled.title)
                            .setDescription(handlemsg(client.la[ls].common.disabled.description, { prefix: prefix })),
                    ],
                });
            }
            message.author
                .send({
                    embeds: [
                        new EmbedBuilder()
                            .setAuthor({
                                name: client.la[ls].cmds.music.grab?.author || "Now Grabbing",
                                iconURL: message.author.displayAvatarURL({ dynamic: true }),
                            })
                            .setThumbnail(`https://img.youtube.com/vi/${player.queue.current.identifier}/mqdefault.jpg`)
                            .setURL(player.queue.current.uri)
                            .setColor(es.color)
                            .setTitle(eval(client.la[ls]["cmds"]["music"]["grab"]["variable1"]))
                            .addFields({ name: client.la[ls].cmds.music.grab?.field1, value: `\`${format(player.queue.current.duration)}\``, inline: true })
                            .addFields({ name: client.la[ls].cmds.music.grab?.field2, value: `\`${player.queue.current.author}\``, inline: true })
                            .addFields({ name: client.la[ls].cmds.music.grab?.field3, value: `\`${player.queue.length} Songs\``, inline: true })
                            .addFields({ name: client.la[ls].cmds.music.grab?.field4, value: `\`${prefix}play ${player.queue.current.uri}\`` })
                            .addFields({ name: client.la[ls].cmds.music.grab?.field5, value: `<#${message.channel.id}>` })
                            .setFooter({
                                text: handlemsg(client.la[ls].cmds.music.grab?.footer, {
                                    usertag: player.queue.current.requester.tag,
                                    guild: message.guild.name + " | " + message.guild.id,
                                }),
                                iconURL: player.queue.current.requester.displayAvatarURL({
                                    dynamic: true,
                                }),
                            }),
                    ],
                })
                .catch(e => {
                    return message.reply({ content: client.la[ls].common.dms_disabled });
                });
            message.react(emoji?.react.SUCCESS).catch(e => console.log("Could not react"));
        } catch (e) {
            console.log(String(e.stack).dim.bgRed);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.wrongcolor)
                        .setTitle(client.la[ls].common.erroroccur)
                        .setDescription(eval(client.la[ls]["cmds"]["music"]["grab"]["variable2"])),
                ],
            });
        }
    },
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
