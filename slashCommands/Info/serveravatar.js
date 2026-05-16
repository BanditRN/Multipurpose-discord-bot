const Discord = require("discord.js");
const { handlemsg } = require(`${process.cwd()}/handlers/functions`);
module.exports = {
    name: "serveravatar",
    description: "Shows the ServerAvatar",
    run: async (client, interaction, cmduser, es, ls, prefix, player, message) => {
        //things u can directly access in an interaction!
        const {
            member,
            channelId,
            guildId,
            applicationId,
            commandName,
            deferred,
            replied,
            ephemeral,
            options,
            id,
            createdTimestamp,
        } = interaction;
        const { guild } = member;

        try {
            interaction?.reply({
                ephemeral: true,
                embeds: [
                    new Discord.EmbedBuilder()
                        .setAuthor({ name: handlemsg(client.la[ls].cmds.info.serveravatar.author, { servername: guild.name }), iconURL: guild.iconURL({ dynamic: true }) || undefined, url: "https://discord.gg/milrato" || undefined })
                        .setColor(es.color)
                        .setThumbnail(
                            es.thumb
                                ? es.footericon && (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                    ? es.footericon
                                    : client.user.displayAvatarURL()
                                : null
                        )
                        .addFields({ name: "<:arrow:832598861813776394> PNG", value: `[\`LINK\`](${guild.iconURL({ format: "png" })})`, inline: true })
                        .addFields({ name: "<:arrow:832598861813776394> JPEG", value: `[\`LINK\`](${guild.iconURL({ format: "jpg" })})`, inline: true })
                        .addFields({ name: "<:arrow:832598861813776394> WEBP", value: `[\`LINK\`](${guild.iconURL({ format: "webp" })})`, inline: true })
                        .setURL(
                            guild.iconURL({
                                dynamic: true,
                            })
                        )
                        .setFooter(client.getFooter(es))
                        .setImage(
                            guild.iconURL({
                                dynamic: true,
                                size: 256,
                            })
                        ),
                ],
            });
        } catch (e) {
            console.log(String(e.stack).grey.bgRed);
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
