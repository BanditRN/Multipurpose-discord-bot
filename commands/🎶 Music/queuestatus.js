const Discord = require(`discord.js`);
const {
    EmbedBuilder,
} = require("discord.js");
const config = require(`${process.cwd()}/botconfig/config.json`);
const ee = require(`${process.cwd()}/botconfig/embed.json`);
const emoji = require(`${process.cwd()}/botconfig/emojis.json`);
const playermanager = require(`../../handlers/playermanager`);
const { createBar } = require(`${process.cwd()}/handlers/functions`);
const { handlemsg } = require(`${process.cwd()}/handlers/functions`);
module.exports = {
    name: `queuestatus`,
    category: `🎶 Music`,
    aliases: [`qs`, `queueinfo`, `status`, `queuestat`, `queuestats`, `qus`],
    description: `Shows the current Queuestatus`,
    usage: `queuestatus`,
    parameters: {
        type: "music",
        activeplayer: true,
        previoussong: false,
    },
    type: "queue",
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
            client.settings.ensure(message.guild.id, {
                playmsg: true,
            });
            //toggle autoplay
            let embed = new EmbedBuilder();
            embed.setTitle(eval(client.la[ls]["cmds"]["music"]["queuestatus"]["variable1"]));
            embed.setDescription(eval(client.la[ls]["cmds"]["music"]["queuestatus"]["variable2"]));
            embed.addFields({ name: `${emoji?.msg.raise_volume} Volume`, value: `\`\`\`${player.volume}%\`\`\``, inline: true });
            embed.addFields({ name: `${emoji?.msg.repeat_mode} Queue Length: `, value: `\`\`\`${player.queue.length} Songs\`\`\``, inline: true });
            embed.addFields({ name: `📨 Pruning: `, value: `\`\`\`${client.settings.get(message.guild.id, "playmsg") ? `✅ Enabled` : `❌ Disabled`}\`\`\``, inline: true });

            embed.addFields({ name: `${emoji?.msg.autoplay_mode} Song Loop: `, value: `\`\`\`${player.trackRepeat ? `✅ Enabled` : `❌ Disabled`}\`\`\``, inline: true });
            embed.addFields({ name: `${emoji?.msg.autoplay_mode} Queue Loop: `, value: `\`\`\`${player.queueRepeat ? `✅ Enabled` : `❌ Disabled`}\`\`\``, inline: true });
            embed.addFields({ name: eval(client.la[ls]["cmds"]["music"]["queuestatus"]["variablex_3"]), value: eval(client.la[ls]["cmds"]["music"]["queuestatus"]["variable3"]), inline: true });

            embed.addFields({ name: `${emoji?.msg.equalizer} Equalizer: `, value: `\`\`\`${player.get("eq")}\`\`\``, inline: true });
            embed.addFields({ name: `🎛 Filter: `, value: `\`\`\`${player.get("filter")}\`\`\``, inline: true });
            embed.addFields({ name: `:clock1: AFK Mode`, value: `\`\`\`PLAYER: ${player.get("afk") ? `✅ Enabled` : `❌ Disabled`}\`\`\``, inline: true });

            embed.setColor(es.color);

            embed.addFields({ name: eval(client.la[ls]["cmds"]["music"]["queuestatus"]["variablex_4"]), value: eval(client.la[ls]["cmds"]["music"]["queuestatus"]["variable4"]) });
            if (player.queue && player.queue.current) {
                embed.addFields({ name: eval(client.la[ls]["cmds"]["music"]["queuestatus"]["variablex_5"]), value: eval(client.la[ls]["cmds"]["music"]["queuestatus"]["variable5"]) });
            }
            message.reply({ embeds: [embed] });
        } catch (e) {
            console.log(String(e.stack).dim.bgRed);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.wrongcolor)

                        .setTitle(client.la[ls].common.erroroccur)
                        .setDescription(eval(client.la[ls]["cmds"]["music"]["queuestatus"]["variable6"])),
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
