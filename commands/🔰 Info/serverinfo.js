const Discord = require("discord.js");
const {
    ChannelType,
    EmbedBuilder,
} = require("discord.js");
const config = require(`../../botconfig/config.json`);
var ee = require(`../../botconfig/embed.json`);
const emoji = require(`../../botconfig/emojis.json`);
const moment = require("moment");
const { swap_pages2, handlemsg } = require(`../../handlers/functions`);
module.exports = {
    name: "serverinfo",
    aliases: ["sinfo"],
    category: "🔰 Info",
    description: "Shows info about a server",
    usage: "serverinfo",
    type: "server",
    run: async (client, message, args, cmduser, text, prefix, player) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        try {
            function trimArray(arr, maxLen = 40) {
                if ([...arr.values()].length > maxLen) {
                    const len = [...arr.values()].length - maxLen;
                    arr = [...arr.values()].sort((a, b) => b?.rawPosition - a.rawPosition).slice(0, maxLen);
                    arr.map(role => `<@&${role.id}>`);
                    arr.push(`${len} more...`);
                }
                return arr.join(", ");
            }
            message.guild.owner = await message.guild
                .fetchOwner()
                .then(m => m.user)
                .catch(() => {});
            await message.guild.members.fetch().catch(() => {});
            function emojitrimarray(arr, maxLen = 35) {
                if (arr.length > maxLen) {
                    const len = arr.length - maxLen;
                    arr = arr.slice(0, maxLen);
                    arr.push(`${len} more...`);
                }
                return arr.join(", ");
            }
            let boosts = message.guild.premiumSubscriptionCount;
            var boostlevel = 0;
            if (boosts >= 2) boostlevel = "1";
            if (boosts >= 7) boostlevel = "2";
            if (boosts >= 14) boostlevel = "3 / ∞";
            let maxbitrate = 96000;
            if (boosts >= 2) maxbitrate = 128000;
            if (boosts >= 7) maxbitrate = 256000;
            if (boosts >= 14) maxbitrate = 384000;
            let embed = new EmbedBuilder()
                .setAuthor({ name: client.getAuthor(
                        client.la[ls].cmds.info.serverinfo.author + " " + message.guild.name,
                        message.guild.iconURL({
                            dynamic: true,
                        }),
                        "https://discord.com/api/oauth2/authorize?client_id=734513783338434591&permissions=8&scope=bot%20applications.commands"
                    ) })
                .setThumbnail(
                    es.thumb
                        ? es.footericon && (es.footericon.includes("http://") || es.footericon.includes("https://"))
                            ? es.footericon
                            : client.user.displayAvatarURL()
                        : null
                );
            embed.addFields({ name: client.la[ls].cmds.info.serverinfo.field1, value: `${message.guild.owner}\n\`${message.guild.owner.tag}\``, inline: true });
            embed.addFields({ name: client.la[ls].cmds.info.serverinfo.field2, value: "`" +
                    moment(message.guild.createdTimestamp).format("DD/MM/YYYY") +
                    "`\n" +
                    "`" +
                    moment(message.guild.createdTimestamp).format("hh:mm:ss") +
                    "`", inline: true });
            embed.addFields({ name: client.la[ls].cmds.info.serverinfo.field3, value: "`" +
                    moment(message.member.joinedTimestamp).format("DD/MM/YYYY") +
                    "`\n" +
                    "`" +
                    moment(message.member.joinedTimestamp).format("hh:mm:ss") +
                    "`", inline: true });

            embed.addFields({ name: client.la[ls].cmds.info.serverinfo.field4, value: "👁‍🗨 `" + message.guild.channels.cache.size + "`", inline: true });
            embed.addFields({ name: client.la[ls].cmds.info.serverinfo.field5, value: "💬 `" + message.guild.channels.cache.filter(channel => channel.type === ChannelType.GuildText).size + "`", inline: true });
            embed.addFields({ name: client.la[ls].cmds.info.serverinfo.field6, value: "🔈 `" + message.guild.channels.cache.filter(channel => channel.type === ChannelType.GuildVoice).size + "`", inline: true });

            embed.addFields({ name: client.la[ls].cmds.info.serverinfo.field7, value: `😀 \`${message.guild.memberCount}\`/${message.guild.maximumMembers ? "100.000" : message.guild.maximumMembers}`, inline: true });
            embed.addFields({ name: client.la[ls].cmds.info.serverinfo.field8, value: "👤 `" + message.guild.members.cache.filter(member => !member.user.bot).size + "`", inline: true });
            embed.addFields({ name: client.la[ls].cmds.info.serverinfo.field9, value: "🤖 `" + message.guild.members.cache.filter(member => member.user.bot).size + "`", inline: true });

            embed.addFields({ name: "**<:arrow:832598861813776394> Rules Channel:**", value: `${message.guild.rulesChannel ? `<#${message.guild.rulesChannelId}>` : "<:no:833101993668771842> `No Channel`"}`, inline: true });
            embed.addFields({ name: "**<:arrow:832598861813776394> Public Updates Channel:**", value: `${message.guild.publicUpdatesChannel ? `<#${message.guild.publicUpdatesChannelId}>` : "<:no:833101993668771842> `No Channel`"}`, inline: true });
            embed.addFields({ name: "**<:arrow:832598861813776394> AFK Channel:**", value: `${message.guild.afkChannel ? `<#${message.guild.afkChannelId}>` : "<:no:833101993668771842> `No Channel`"}`, inline: true });

            embed.addFields({ name: "**<:arrow:832598861813776394> NSFW Level:**", value: `\`${message.guild.nsfwLevel}\``, inline: true });
            embed.addFields({ name: "**<:arrow:832598861813776394> Verifcation Level:**", value: `\`${message.guild.verificationLevel}\``, inline: true });
            embed.addFields({ name: "**<:arrow:832598861813776394> Explicit Content Filter:**", value: `\`${message.guild.explicitContentFilter}\``, inline: true });

            embed.addFields({ name: client.la[ls].cmds.info.serverinfo.field10, value: "🟢 `" +
                    message.guild.members.cache.filter(
                        member => member.presence && member.presence && member.presence.status != "offline"
                    ).size +
                    "`", inline: true });
            embed.addFields({ name: client.la[ls].cmds.info.serverinfo.field11, value: ":black_circle:`" +
                    message.guild.members.cache.filter(
                        member => !member.presence || (member.presence && member.presence.status == "offline")
                    ).size +
                    "`", inline: true });
            embed.addFields({ name: client.la[ls].cmds.info.serverinfo.field12, value: "<a:nitro_logo:833402717950836806> `" + message.guild.premiumSubscriptionCount + "`", inline: true });

            embed.addFields({ name: client.la[ls].cmds.info.serverinfo.field13, value: `<a:nitro:833402717506502707> \`${boostlevel}\``, inline: true });
            embed.addFields({ name: client.la[ls].cmds.info.serverinfo.field14, value: "👾 `" + maxbitrate + " kbps`", inline: true });
            if (boosts >= 14) {
                embed.addFields({ name: `**<:arrow:832598861813776394> Vanity:**`, value: `${message.guild.vanityURLCode ? `https://discord.gg/${message.guild.vanityURLCode}` : "<:no:833101993668771842> No Vanity-Invite"}` });
            }

            let embeds = [];
            embeds.push(embed);
            let embed_emojis = new EmbedBuilder();
            let embed_roles = new EmbedBuilder();

            //emoji
            embed_emojis.setTitle(eval(client.la[ls]["cmds"]["info"]["serverinfo"]["variablex_1"]));
            embed_emojis.setDescription(eval(client.la[ls]["cmds"]["info"]["serverinfo"]["variable1"]));
            embeds.push(embed_emojis);
            //Roles
            embed_roles.setTitle(eval(client.la[ls]["cmds"]["info"]["serverinfo"]["variablex_2"]));
            embed_roles.setDescription(
                `>>> ${
                    message.guild.roles.cache.size <= 40
                        ? [...message.guild.roles.cache.values()]
                              .sort((a, b) => b.rawPosition - a.rawPosition)
                              .map(role => `<@&${role.id}>`)
                              .join(", ")
                        : message.guild.roles.cache.size > 40
                          ? trimArray(message.guild.roles.cache)
                          : "None"
                }`
            );
            embeds.push(embed_roles);

            if (message.guild.banner) {
                let embed2 = new EmbedBuilder()
                    .setTitle(`**<:arrow:832598861813776394> SERVER BANNER:**`)
                    .setDescription(
                        `[Download Link](${message.guild.bannerURL({ size: 1024 })})${message.guild.discoverySplash ? ` | [Link of Discovery Splash Image](${message.guild.discoverySplashURL({ size: 4096 })})` : ""}\n> This is the Image which is shown on the Top left Corner of this Server, where you see the Channels!`
                    )
                    .setImage(message.guild.bannerURL({ size: 4096 }));
                embeds.push(embed2);
            } else if (message.guild.discoverySplash) {
                let embed2 = new EmbedBuilder()
                    .setTitle(`**<:arrow:832598861813776394> SERVER DISCOVERY SPLASH:**`)
                    .setDescription(
                        `[Download Link](${message.guild.discoverySplashURL({ size: 1024 })})${message.guild.banner ? ` | [Link of Discovery Splash Image](${message.guild.bannerURL({ size: 4096 })})` : ""}\nThis is the Image you see when you get invited to this Server on the official Discord Website!`
                    )
                    .setImage(message.guild.discoverySplashURL({ size: 4096 }));
                embeds.push(embed2);
            }
            //add the footer to the end
            embeds.forEach((embed, index) => {
                if (index < embeds.length - 1) {
                    embed.setThumbnail(
                        message.guild.iconURL({
                            dynamic: true,
                        })
                    );
                }
                embed.setColor(es.color);
                embed.setFooter(
                    client.getFooter(
                        "ID: " + message.guild.id,
                        message.guild.iconURL({
                            dynamic: true,
                        })
                    )
                );
            });
            if (embeds.length == 1) return message.reply({ embeds });
            return swap_pages2(client, message, embeds);
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
