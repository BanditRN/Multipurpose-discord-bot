const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    PermissionFlagsBits,
} = require("discord.js");
const config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
const { databasing } = require(`${process.cwd()}/handlers/functions`);
module.exports = {
    name: "embedbuilder",
    category: "🚫 Administration",
    aliases: ["embedb"],
    cooldown: 2,
    usage: "embedbuilder --> follow Steps",
    description:
        "Resends a message from u as an Embed\n\n To have forexample no title do that:  embed ++ This is what an Embed without Image Looks like",
    type: "server",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        try {
            let adminroles = client.settings.get(message.guild.id, "adminroles");
            let cmdroles = client.settings.get(message.guild.id, "cmdadminroles.embedbuilder");
            var cmdrole = [];
            if (cmdroles.length > 0) {
                for (const r of cmdroles) {
                    if (message.guild.roles.cache.get(r)) {
                        cmdrole.push(` | <@&${r}>`);
                    } else if (message.guild.members.cache.get(r)) {
                        cmdrole.push(` | <@${r}>`);
                    } else {
                        //console.log(r)
                        client.settings.remove(message.guild.id, r, `cmdadminroles.embedbuilder`);
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
                            .setTitle(eval(client.la[ls]["cmds"]["administration"]["embedbuilder"]["variable1"]))
                            .setDescription(eval(client.la[ls]["cmds"]["administration"]["embedbuilder"]["variable2"])),
                    ],
                });
            let embedToBuild = new EmbedBuilder().setAuthor({ name: message.member.user.tag, iconURL: message.member.user.avatarURL({ dynamic: true }) });

            let title = new ButtonBuilder().setLabel("Title").setStyle(ButtonStyle.Primary).setCustomId(`buildEmbed_builder_title`);

            let description = new ButtonBuilder()
                .setLabel("Description")
                .setStyle(ButtonStyle.Primary)
                .setCustomId(`buildEmbed_builder_desc`);

            let footer = new ButtonBuilder().setLabel("Footer").setStyle(ButtonStyle.Primary).setCustomId(`buildEmbed_builder_footer`);

            let footerImage = new ButtonBuilder()
                .setLabel("Footer Image")
                .setStyle(ButtonStyle.Primary)
                .setCustomId(`buildEmbed_builder_footerimg`);

            let image = new ButtonBuilder().setLabel("Image").setStyle(ButtonStyle.Primary).setCustomId(`buildEmbed_builder_img`);

            let thumbnail = new ButtonBuilder()
                .setLabel("Thumbnail")
                .setStyle(ButtonStyle.Primary)
                .setCustomId(`buildEmbed_builder_thumb`);

            let timestamp = new ButtonBuilder()
                .setLabel("Timestamp")
                .setStyle(ButtonStyle.Primary)
                .setCustomId(`buildEmbed_builder_timestamp`);

            let color = new ButtonBuilder().setLabel("Color").setStyle(ButtonStyle.Primary).setCustomId(`buildEmbed_builder_color`);

            let save = new ButtonBuilder().setLabel("📨 Send").setStyle(ButtonStyle.Danger).setCustomId(`buildEmbed_save`);

            let cancel = new ButtonBuilder().setLabel("❌ Cancel").setStyle(ButtonStyle.Danger).setCustomId(`buildEmbed_cancel`);

            let channel = new ButtonBuilder()
                .setLabel("💬 Select Channel")
                .setStyle(ButtonStyle.Primary)
                .setCustomId(`buildEmbed_builder_channel`);

            let buttonRow = new ActionRowBuilder().addComponents([title, description]);
            let buttonRow1 = new ActionRowBuilder().addComponents([footer, color, timestamp]);
            let buttonRow2 = new ActionRowBuilder().addComponents([footerImage, image, thumbnail]);
            let buttonRow3 = new ActionRowBuilder().addComponents([save, cancel, channel]);

            let msg = await message.reply({
                embeds: [embedToBuild],
                components: [buttonRow, buttonRow1, buttonRow2, buttonRow3],
            });
            let buttonEvent = async interaction => {
                if (!interaction || !interaction?.isButton()) return;
                if (interaction?.message.id === msg.id) {
                    if (interaction?.user.id === message.member.id) {
                        embedEditing(interaction);
                    } else {
                        await interaction?.reply({
                            content: `<:no:833101993668771842> You are not allowed to do that! Only: <@${message.author.id}>`,
                            ephemeral: true,
                        }); //ephemeral message
                    }
                }
            };
            let channel2send = false;
            client.on("interactionCreate", buttonEvent);

            let embedEditing = async button => {
                if (!button?.customId.startsWith(`buildEmbed`) && button?.message.id == msg.id) return;
                await button?.deferUpdate();

                let id = button?.customId.split(`buildEmbed_`)[1];
                if (id.startsWith(`builder`)) {
                    let builderId = id.split(`builder_`)[1];
                    let noInput = ["timestamp"];
                    let noInputFinal = !noInput.some(a => a == builderId);
                    let ifUrl = new RegExp(
                        "^(https?:\\/\\/)?" +
                            "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|" +
                            "((\\d{1,3}\\.){3}\\d{1,3}))" +
                            "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" +
                            "(\\?[;&a-z\\d%_.~+=-]*)?" +
                            "(\\#[-a-z\\d_]*)?$",
                        "i"
                    );

                    button?.message.edit({
                        content: `<a:Loading:833101350623117342> **Please send me Your Input now!**`,
                        components: [
                            new ActionRowBuilder().addComponents([
                                new ButtonBuilder().setLabel("Cancel").setStyle(ButtonStyle.Danger).setCustomId(`buildEmbed_cancel`),
                            ]),
                        ],
                    });

                    let input;
                    if (noInputFinal) {
                        let filter = async message => button?.user.id == message.author.id;
                        input = await button?.channel
                            .awaitMessages({ filter, max: 1, time: 30000, errors: ["time"] })
                            .catch(e => {
                                return client.emit(`interactionCreate`, {
                                    id: `buildEmbed_cancel`,
                                    message: button?.message,
                                    channel: button?.channel,
                                });
                            });
                    }

                    let finalInput = input && input.size > 0 ? input.first() : "";
                    if (builderId == "channel") channel2send = finalInput.mentions.channels.first() || false;
                    if (builderId == "title") embedToBuild.setTitle(finalInput.content);
                    if (builderId == "desc") embedToBuild.setDescription(finalInput.content);
                    if (builderId == "footer") embedToBuild.setFooter({ text: finalInput.content });

                    if (builderId == "color") {
                        if (!/^#[0-9A-F]{6}$/i?.test(finalInput.content)) embedToBuild.setColor("RANDOM");
                        else embedToBuild.setColor(finalInput.content);
                    }
                    if (builderId == "footerimg") {
                        if (ifUrl.test(finalInput)) {
                            embedToBuild.setFooter(
                                client.getFooter(
                                    `${embedToBuild.footer ? embedToBuild.footer.text : "\u200B"}`,
                                    finalInput.content
                                )
                            );
                        }
                    }
                    if (builderId == "img") {
                        if (ifUrl.test(finalInput)) {
                            embedToBuild.setImage(finalInput.content);
                        }
                    }
                    if (builderId == "thumb") {
                        if (ifUrl.test(finalInput)) {
                            embedToBuild.setThumbnail(finalInput.content);
                        }
                    }

                    if (builderId == "timestamp") {
                        embedToBuild.setTimestamp();
                    }
                    button?.message.edit({
                        embeds: [embedToBuild],
                        components: [buttonRow, buttonRow1, buttonRow2, buttonRow3],
                    });
                    if (finalInput) finalInput.delete().catch(e => {});
                }

                if (id == `cancel`) {
                    button?.message.edit({ content: `Canceling...`, components: null });

                    setTimeout(async () => {
                        const fetched = await button?.channel?.messages.fetch(button?.message.id).catch(() => {});
                        fetched?.delete().catch(() => {});
                    }, 3000);

                    await client.removeListener("interactionCreate", buttonEvent);
                }

                if (id == `save`) {
                    let messageToDelete = await button?.channel.messages.fetch(button?.message.id).catch(() => {});

                    messageToDelete.delete();
                    embedToBuild = Object.keys(embedToBuild).reduce((object, key) => {
                        if (key !== "author") {
                            object[key] = embedToBuild[key];
                        }
                        return object;
                    }, {});

                    if (channel2send) channel2send.send({ embeds: [embedToBuild], components: null });
                    else button?.channel.send({ embeds: [embedToBuild], components: null });
                    await client.removeListener("interactionCreate", buttonEvent);
                }

                setTimeout(() => {
                    button?.message.edit({ embeds: [embedToBuild], components: [] }).catch(() => {});
                    client.removeListener("interactionCreate", buttonEvent);
                }, 300000);
            };

            if (client.settings.get(message.guild.id, `adminlog`) != "no") {
                try {
                    var channel2 = message.guild.channels.cache.get(client.settings.get(message.guild.id, `adminlog`));
                    if (!channel2) return client.settings.set(message.guild.id, "no", `adminlog`);
                    channel2.send({
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
                                .setAuthor({ name: `${require("path").parse(__filename).name} | ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
                                .setDescription(eval(client.la[ls]["cmds"]["administration"]["embedbuilder"]["variable3"]))
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
        } catch (e) {
            console.log(String(e.stack).grey.bgRed);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.wrongcolor)
                        .setFooter(client.getFooter(es))
                        .setTitle(client.la[ls].common.erroroccur)
                        .setDescription(eval(client.la[ls]["cmds"]["administration"]["embedbuilder"]["variable6"])),
                ],
            });
        }
    },
};
/**
 * @INFO
 * Bot Coded by Tomato#6966 | https://github?.com/Tomato6966/Discord-Js-Handler-Template
 * @INFO
 * Work for Milrato Development | https://milrato.eu
 * @INFO
 * Please mention him / Milrato Development, when using this Code!
 * @INFO
 */
