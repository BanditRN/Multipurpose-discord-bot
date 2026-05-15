const config = require(`${process.cwd()}/botconfig/config.json`);
const ms = require(`ms`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
const emoji = require(`${process.cwd()}/botconfig/emojis.json`);
const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    PermissionFlagsBits,
} = require("discord.js");
const { databasing } = require(`${process.cwd()}/handlers/functions`);
module.exports = {
    name: `deleterole`,
    category: `🚫 Administration`,
    aliases: [`roledelete`, "delete-role", "role-delete"],
    cooldown: 4,
    usage: `deleterole  @Role`,
    description: `Delets a Role from this Server`,
    type: "role",
    run: async (client, message, args, cmduser, text, prefix) => {
        if (!message.guild.members.me?.permissions.has([PermissionFlagsBits.ManageRoles]))
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.wrongcolor)
                        .setFooter(client.getFooter(es))
                        .setTitle(eval(client.la[ls]["cmds"]["administration"]["deleterole"]["variable1"])),
                ],
            });
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        try {
            let adminroles = client.settings.get(message.guild.id, "adminroles");
            let cmdroles = client.settings.get(message.guild.id, "cmdadminroles.deleterole");
            var cmdrole = [];
            if (cmdroles.length > 0) {
                for (const r of cmdroles) {
                    if (message.guild.roles.cache.get(r)) {
                        cmdrole.push(` | <@&${r}>`);
                    } else if (message.guild.members.cache.get(r)) {
                        cmdrole.push(` | <@${r}>`);
                    } else {
                        //console.log(r)
                        client.settings.remove(message.guild.id, r, `cmdadminroles.deleterole`);
                    }
                }
            }
            if (
                [...message.member.roles.cache.values()] &&
                !message.member.roles.cache.some(r => cmdroles.includes(r.id)) &&
                !cmdroles.includes(message.author.id) && [...message.member.roles.cache.values()] &&
                !message.member.roles.cache.some(r => adminroles.includes(r ? r.id : r)) &&
                ![message.guild.ownerId, config.ownerid].includes(message.author.id) &&
                !message.member.permissions.has([PermissionFlagsBits.Administrator])
            )
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setFooter(client.getFooter(es))
                            .setTitle(eval(client.la[ls]["cmds"]["administration"]["deleterole"]["variable2"]))
                            .setDescription(eval(client.la[ls]["cmds"]["administration"]["deleterole"]["variable3"])),
                    ],
                });
            let role =
                message.mentions.roles.filter(role => role.guild.id == message.guild.id).first() ||
                message.guild.roles.cache.get(args[0]);
            if (!role || role == null || role == undefined || role.name == null || role.name == undefined)
                return message.reply({ embeds: [] });
            let button_verify = new ButtonBuilder()
                .setStyle(ButtonStyle.Success)
                .setCustomId("deleterole_verify")
                .setLabel("Verify this Step")
                .setEmoji("833101995723194437");
            let msg = await message.channel.send({
                content: `<@${message.author.id}>`,
                embeds: [
                    new EmbedBuilder()
                        .setTitle(eval(client.la[ls]["cmds"]["administration"]["deleterole"]["variable6"]))
                        .setColor(es.color),
                ],
                components: [new ActionRowBuilder().addComponents(button_verify)],
            });
            let edited = false;
            const collector = msg.createMessageComponentCollector(bb => !bb?.user.bot, {
                time: 30000,
            }); //collector for 5 seconds
            collector.on("collect", async b => {
                if (b?.user.id !== message.author.id)
                    return b?.reply(
                        `<:no:833101993668771842> **Only the one who typed ${prefix}help is allowed to react!**`,
                        true
                    );

                edited = true;
                msg.edit({
                    content: `<@${message.author.id}>`,
                    embeds: [new EmbedBuilder().setTitle("Verified!").setColor(es.color)],
                    components: [new ActionRowBuilder().addComponents(button_verify.setDisabled(true))],
                }).catch(e => {
                    console.log(String(e).grey);
                });

                //page forward
                if (b?.customId == "deleterole_verify") {
                    let membersize = [...role.members.values()].length;
                    role.delete(`${message.author.tag} Requested a Role delete`)
                        .then(r => {
                            message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor(es.color)
                                        .setThumbnail(
                                            es.thumb
                                                ? es.footericon &&
                                                  (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                                    ? es.footericon
                                                    : client.user.displayAvatarURL()
                                                : null
                                        )
                                        .setFooter(client.getFooter(es))
                                        .setTitle(eval(client.la[ls]["cmds"]["administration"]["deleterole"]["variable8"])),
                                ],
                            });
                            if (client.settings.get(message.guild.id, `adminlog`) != "no") {
                                try {
                                    var channel = message.guild.channels.cache.get(
                                        client.settings.get(message.guild.id, `adminlog`)
                                    );
                                    if (!channel) return client.settings.set(message.guild.id, "no", `adminlog`);
                                    channel.send({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setColor(es.color)
                                                .setThumbnail(
                                                    es.thumb
                                                        ? es.footericon &&
                                                          (es.footericon.includes("http://") ||
                                                              es.footericon.includes("https://"))
                                                            ? es.footericon
                                                            : client.user.displayAvatarURL()
                                                        : null
                                                )
                                                .setFooter(client.getFooter(es))
                                                .setAuthor({ name: `${require("path").parse(__filename).name} | ${message.author.tag}`, iconURL: message.author.displayAvatarURL({
                                                        dynamic: true,
                                                    }) })
                                                .setDescription(
                                                    eval(client.la[ls]["cmds"]["administration"]["deleterole"]["variable9"])
                                                )
                                                .addFields({ name: eval(client.la[ls]["cmds"]["administration"]["ban"]["variablex_15"]), value: eval(client.la[ls]["cmds"]["administration"]["ban"]["variable15"]) })
                                                .addFields({ name: eval(client.la[ls]["cmds"]["administration"]["ban"]["variablex_16"]), value: eval(client.la[ls]["cmds"]["administration"]["ban"]["variable16"]) })
                                                .setTimestamp()
                                                .setFooter(
                                                    client.getFooter(
                                                        "ID: " + message.author.id,
                                                        message.author.displayAvatarURL({ dynamic: true })
                                                    )
                                                ),
                                        ],
                                    });
                                } catch (e) {
                                    console.log(e.stack ? String(e.stack).grey : String(e).grey);
                                }
                            }
                        })
                        .catch(() => {});
                } else {
                    return message.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(es.wrongcolor)
                                .setFooter(client.getFooter(es))
                                .setTitle(eval(client.la[ls]["cmds"]["administration"]["deleterole"]["variable12"]))
                                .setDescription(ge.message),
                        ],
                    });
                }
            });

            let endedembed = new EmbedBuilder().setTitle("Time ran out!").setColor(es.wrongcolor);
            collector.on("end", collected => {
                if (!edited) {
                    edited = true;
                    msg.edit({
                        content: `<@${message.author.id}>`,
                        embeds: [endedembed],
                        components: [
                            new ActionRowBuilder().addComponents(
                                button_verify
                                    .setDisabled(true)
                                    .setLabel("FAILED TO VERIFY")
                                    .setEmoji("833101993668771842")
                                    .setStyle(ButtonStyle.Danger)
                            ),
                        ],
                    }).catch(e => {
                        console.log(String(e).grey);
                    });
                }
            });
        } catch (e) {
            console.log(String(e.stack).grey.bgRed);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.wrongcolor)
                        .setFooter(client.getFooter(es))
                        .setTitle(client.la[ls].common.erroroccur)
                        .setDescription(eval(client.la[ls]["cmds"]["administration"]["deleterole"]["variable14"])),
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
