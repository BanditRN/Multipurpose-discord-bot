const Discord = require("discord.js");
const { EmbedBuilder, MessageAttachment } = require("discord.js");
const config = require(`${process.cwd()}/botconfig/config.json`);
const canvacord = require("canvacord");
var ee = require(`${process.cwd()}/botconfig/embed.json`);
const request = require("request");
const emoji = require(`${process.cwd()}/botconfig/emojis.json`);
module.exports = {
    name: "wasted",
    aliases: [""],
    category: "🕹️ Fun",
    description: "IMAGE CMD",
    usage: "wasted @User",
    type: "user",
    options: [
        { User: { name: "which_user", description: "From Which User do you want to get ... ?", required: false } }, //to use in the code: interacton.getUser("ping_a_user")
    ],
    run: async (client, interaction, cmduser, es, ls, prefix, player, message) => {
        if (!client.settings.get(message.guild.id, "FUN")) {
            return interaction?.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.wrongcolor)
                        .setFooter(client.getFooter(es))
                        .setTitle(client.la[ls].common.disabled.title)
                        .setDescription(
                            require(`${process.cwd()}/handlers/functions`).handlemsg(
                                client.la[ls].common.disabled.description,
                                { prefix: prefix }
                            )
                        ),
                ],
                ephemeral: true,
            });
        }
        await interaction?.deferReply({ ephemeral: false });
        //find the USER
        let user = interaction?.options.getUser("which_user");
        if (!user) user = interaction?.member.user;
        let avatar = user.displayAvatarURL({
            dynamic: false,
            format: "png",
        });
        let image = await canvacord.Canvas.wasted(avatar);
        let attachment = await new MessageAttachment(image, "wasted.png");
        interaction
            ?.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.color)
                        .setFooter(client.getFooter(es))
                        .setAuthor({ name: `Meme for: ${user.tag}`, iconURL: avatar || undefined })
                        .setImage("attachment://wasted.png"),
                ],
                files: [attachment],
                ephemeral: true,
            })
            .catch(() => {});
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
