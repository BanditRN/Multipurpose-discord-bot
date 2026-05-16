const Discord = require("discord.js");
const { EmbedBuilder, MessageAttachment } = require("discord.js");
const config = require(`${process.cwd()}/botconfig/config.json`);
const canvacord = require("canvacord");
var ee = require(`${process.cwd()}/botconfig/embed.json`);
const request = require("request");
const emoji = require(`${process.cwd()}/botconfig/emojis.json`);
module.exports = {
    name: "note",
    aliases: [""],
    category: "🕹️ Fun",
    description: "IMAGE CMD",
    usage: "note <TEXT>",
    type: "text",
    options: [
        { String: { name: "text", description: "What should I send? [ +n+ = Newline ]", required: true } }, //to use in the code: interacton.getString("title")
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
        //get the additional text
        const text = interaction?.options.getString("text"); //same as in StringChoices //RETURNS STRING
        //If no text added, return error
        if (!text)
            return interaction
                ?.editReply({
                    ephemeral: false,
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setFooter(client.getFooter(es))
                            .setTitle(eval(client.la[ls]["cmds"]["fun"]["note"]["variable2"]))
                            .setDescription(eval(client.la[ls]["cmds"]["fun"]["note"]["variable3"])),
                    ],
                })
                .catch(() => {});

        //get the memer image
        client.memer.note(text).then(image => {
            //make an attachment
            var attachment = new MessageAttachment(image, "note.png");
            //send new Message
            interaction
                ?.editReply({
                    ephemeral: false,
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.color)
                            .setFooter(client.getFooter(es))
                            .setAuthor({ name: `Meme for: ${message.author.tag}`, iconURL: message.author.displayAvatarURL() || undefined })
                            .setImage("attachment://note.png"),
                    ],
                    files: [attachment],
                })
                .catch(() => {});
        });
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
