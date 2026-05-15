const {
    AttachmentBuilder,
    EmbedBuilder,
} = require("discord.js");
const config = require(`${process.cwd()}/botconfig/config.json`);
const ee = require(`${process.cwd()}/botconfig/embed.json`);
const emoji = require(`${process.cwd()}/botconfig/emojis.json`);
const { createBar, format } = require(`${process.cwd()}/handlers/functions`);
const { handlemsg } = require(`${process.cwd()}/handlers/functions`);
module.exports = {
    name: `nowplaying`,
    category: `🎶 Music`,
    aliases: [`np`, "trackinfo"],
    description: `Shows detailled information about the current Song`,
    usage: `nowplaying`,
    parameters: {
        type: "music",
        activeplayer: true,
        previoussong: false,
    },
    type: "song",
    run: async (client, message, args, cmduser, text, prefix, player) => {
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
        try {
            //if no current song return error
            if (!player.queue.current)
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setTitle(eval(client.la[ls]["cmds"]["music"]["nowplaying"]["variable1"])),
                    ],
                });
            const embed = new EmbedBuilder()
                .setAuthor({
                    name: `Current song playing:`,
                    iconURL: message.guild.iconURL({ dynamic: true }),
                })
                .setThumbnail(`https://img.youtube.com/vi/${player.queue.current.identifier}/mqdefault.jpg`)
                .setURL(player.queue.current.uri)
                .setColor(es.color)
                .setTitle(eval(client.la[ls]["cmds"]["music"]["nowplaying"]["variable2"]))
                .addFields({ name: `${emoji?.msg.time} Progress: `, value: createBar(player) })
                .addFields({ name: `${emoji?.msg.time} Duration: `, value: `\`${format(player.queue.current.duration).split(" | ")[0]}\` | \`${format(player.queue.current.duration).split(" | ")[1]}\``, inline: true })
                .addFields({ name: `${emoji?.msg.song_by} Song By: `, value: `\`${player.queue.current.author}\``, inline: true })
                .addFields({ name: `${emoji?.msg.repeat_mode} Queue length: `, value: `\`${player.queue.length} Songs\``, inline: true })
                .setFooter(
                    client.getFooter(
                        `Requested by: ${player.queue.current.requester.tag}`,
                        player.queue.current.requester.displayAvatarURL({
                            dynamic: true,
                        })
                    )
                );
            //Send Now playing Message
            return message.reply({ embeds: [embed] });
        } catch (e) {
            console.log(String(e.stack).dim.bgRed);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.wrongcolor)

                        .setTitle(client.la[ls].common.erroroccur)
                        .setDescription(eval(client.la[ls]["cmds"]["music"]["nowplaying"]["variable3"])),
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
