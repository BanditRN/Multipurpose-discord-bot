const Discord = require("discord.js");
const {
    EmbedBuilder,
} = require("discord.js");
const config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
const emoji = require(`${process.cwd()}/botconfig/emojis.json`);
const { GetUser, GetGlobalUser, handlemsg } = require(`${process.cwd()}/handlers/functions`);
const fetch = require("node-fetch");
module.exports = {
    name: "color",
    aliases: ["hexcolor"],
    category: "🔰 Info",
    description: "Get Hex Color Information",
    usage: "color <HEX CODE> | Example: color #ee33ff",
    type: "util",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");

        try {
            let userinfo = false;
            if (!args[0]) {
                userinfo = true;
                args[0] = message.member.roles.highest.hexColor || "#000000";
            }
            const url = `https://api.popcat.xyz/color/${args[0].includes("#") ? args[0].split("#")[1] : args[0]}`;
            let json;
            try {
                json = await fetch(url).then(res => res.json());
                console.log(json);
            } catch (e) {
                return message.reply({ content: `${e.message ? e.message : e}`, codeBlock: "js" });
            }
            if (json.error)
                return message.reply({
                    content: client.la[ls].cmds.info.color.invalid + `\n${json.error}`,
                    codeBlock: "js",
                });
            const embed = new EmbedBuilder()
                .setTitle(eval(client.la[ls]["cmds"]["info"]["color"]["variable1"]))
                .addFields({ name: "<:arrow:832598861813776394> **Name**", value: "```" + json.name + "```", inline: true })
                .addFields({ name: "<:arrow:832598861813776394> **Hex**", value: "```" + json.hex + "```", inline: true })
                .addFields({ name: "<:arrow:832598861813776394> **RGB**", value: "```" + json.rgb + "```", inline: true })
                .addFields({ name: `<:arrow:832598861813776394> **${client.la[ls].cmds.info.color.brightershade}**`, value: "```" + json.brightened + "```", inline: true })
                .setThumbnail(json.color_image)
                .setColor(json.hex);
            if (userinfo) embed.addFields({ name: "Color ==  your Highest Role!", value: `> Usage: \`${prefix}color ${args[0]}\`` });
            message.reply({
                embeds: [embed],
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
