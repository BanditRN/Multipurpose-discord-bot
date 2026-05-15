const Discord = require("discord.js");
const {
    EmbedBuilder,
    PermissionFlagsBits,
} = require("discord.js");
const config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
const emoji = require(`${process.cwd()}/botconfig/emojis.json`);
const moment = require("moment");
const { GetRole } = require(`${process.cwd()}/handlers/functions`);
const { swap_pages, handlemsg } = require(`${process.cwd()}/handlers/functions`);
module.exports = {
    name: "roleinfo",
    aliases: ["rinfo"],
    category: "🔰 Info",
    description: "Get information about a role",
    usage: "roleinfo [@Role/Id/Name]",
    type: "server",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        try {
            var role;
            if (args[0]) {
                try {
                    role = await GetRole(message, args);
                } catch (e) {
                    if (!e) return message.reply(client.la[ls].common.rolenotfound);
                    return message.reply({
                        content: String("```" + e.message ? String(e.message).substring(0, 1900) : String(e) + "```"),
                    });
                }
            } else {
                role = message.member.roles.highest;
            }
            if (!role || role == null || role.id == null || !role.id)
                return message.reply(client.la[ls].common.rolenotfound);
            //create the EMBED
            const embeduserinfo = new EmbedBuilder();
            embeduserinfo.setThumbnail(message.guild.iconURL({ dynamic: true, size: 512 }));
            embeduserinfo.setAuthor({ name: client.la[ls].cmds.info.roleinfo.author + " " + role.name, iconURL: message.guild.iconURL({ dynamic: true }), url: "https://discord.gg/milrato" });
            embeduserinfo.addFields({ name: client.la[ls].cmds.info.roleinfo.field1, value: `\`${role.name}\``, inline: true });
            embeduserinfo.addFields({ name: client.la[ls].cmds.info.roleinfo.field2, value: `\`${role.id}\``, inline: true });
            embeduserinfo.addFields({ name: client.la[ls].cmds.info.roleinfo.field3, value: `\`${role.hexColor}\``, inline: true });
            embeduserinfo.addFields({ name: client.la[ls].cmds.info.roleinfo.field4, value: "`" +
                    moment(role.createdAt).format("DD/MM/YYYY") +
                    "`\n" +
                    "`" +
                    moment(role.createdAt).format("hh:mm:ss") +
                    "`", inline: true });
            embeduserinfo.addFields({ name: client.la[ls].cmds.info.roleinfo.field5, value: `\`${role.rawPosition}\` / \`${message.guild.roles.highest.rawPosition}\``, inline: true });
            embeduserinfo.addFields({ name: client.la[ls].cmds.info.roleinfo.field6, value: `\`${role.members.size} Members have it\``, inline: true });
            embeduserinfo.addFields({ name: client.la[ls].cmds.info.roleinfo.field7, value: `\`${role.hoist ? "✔️" : "❌"}\``, inline: true });
            embeduserinfo.addFields({ name: client.la[ls].cmds.info.roleinfo.field8, value: `\`${role.mentionable ? "✔️" : "❌"}\``, inline: true });
            embeduserinfo.addFields({ name: client.la[ls].cmds.info.roleinfo.field9, value: `${role.permissions
                    .toArray()
                    .map(p => `\`${p}\``)
                    .join(", ")}` });
            embeduserinfo.setColor(role.hexColor);
            embeduserinfo.setFooter(client.getFooter(es));
            //send the EMBED
            message.reply({ embeds: [embeduserinfo] });
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
