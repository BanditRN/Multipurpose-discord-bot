const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, Interaction } = require("discord.js");
const config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
const emoji = require(`${process.cwd()}/botconfig/emojis.json`);
const { duration, handlemsg } = require(`${process.cwd()}/handlers/functions`);
module.exports = {
    name: "help",
    description: "Returns all Commmands, or one specific command",
    options: [
        //{"Integer": { name: "ping_amount", description: "How many times do you want to ping?", required: true }}, //to use in the code: interacton.getInteger("ping_amount")
        {
            StringChoices: {
                name: "category",
                description: "See the Commands of a Category",
                required: true,
                choices: [
                    ["⌨️ Programming", "⌨️ Programming"],
                    ["⚙️ Settings", "⚙️ Settings"],
                    ["⚜️ Custom Queue(s) ", "⚜️ Custom Queue(s)"],
                    ["🎤 Voice", "🎤 Voice"],
                    ["🎮 MiniGames", "🎮 MiniGames"],
                    ["🎶 Music", "🎶 Music"],
                    ["🏫 School Commands", "🏫 School Commands"],
                    ["👀 Filter", "👀 Filter"],
                    ["👑 Owner", "👑 Owner"],
                    ["💪 Setup", "💪 Setup"],
                    ["💸 Economy", "💸 Economy"],
                    ["📈 Ranking", "📈 Ranking"],
                    ["🔊 Soundboard", "🔊 Soundboard"],
                    ["🔞 NSFW", "🔞 NSFW"],
                    ["🔰 Info", "🔰 Info"],
                    ["🕹️ Fun", "🕹️ Fun"],
                    ["🚫 Administration", "🚫 Administration"],
                ],
            },
        },
        {
            String: {
                name: "command",
                description: "Is there a specific Command you want to details from?",
                required: false,
            },
        }, //to use in the code: interacton.getString("ping_amount")

        //{"User": { name: "which_user", description: "From Which User do you want to get the Avatar?", required: false }}, //to use in the code: interacton.getUser("ping_a_user")
        //{"Channel": { name: "what_channel", description: "To Ping a Channel lol", required: false }}, //to use in the code: interacton.getChannel("what_channel")
        //{"Role": { name: "what_role", description: "To Ping a Role lol", required: false }}, //to use in the code: interacton.getRole("what_role")
        //{"IntChoices": { name: "what_ping", description: "What Ping do you want to get?", required: true, choices: [["Bot", 1], ["Discord Api", 2]] }, //here the second array input MUST BE A NUMBER // TO USE IN THE CODE: interacton.getInteger("what_ping")
        //{"StringChoices": { name: "what_ping", description: "What Ping do you want to get?", required: true, choices: [["Bot", "botping"], ["Discord Api", "api"]] }}, //here the second array input MUST BE A STRING // TO USE IN THE CODE: interacton.getString("what_ping")
    ],
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

        let CommandStr = options.getString("command");
        let Category = options.getString("category");
        if (!Category) return interaction?.reply({ content: "Please repeat but add a CATEGORY", ephemeral: true });
        Category = Category.replace("_", " ");
        try {
            let allembeds = [];
            if (Category) {
                const cat = client.categories.find(cat => cat.toLowerCase().includes(Category.toLowerCase()));
                if (cat) {
                    var category = cat;
                    const items = client.commands.filter(cmd => cmd.category === category).map(cmd => `\`${cmd.name}\``);
                    const embed = new EmbedBuilder()
                        .setColor(es.color)
                        .setThumbnail(
                            es.thumb
                                ? es.footericon && (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                    ? es.footericon
                                    : client.user.displayAvatarURL()
                                : null
                        )
                        .setThumbnail(client.user.displayAvatarURL())
                        .setTitle(eval(client.la[ls]["cmds"]["info"]["help"]["variable2"]))
                        .setFooter({ text: handlemsg(client.la[ls].cmds.info.help.nocustom, { prefix: prefix }), iconURL: client.user.displayAvatarURL() });

                    if (category.toLowerCase().includes("custom")) {
                        const cmd =
                            client.commands.get(items[0].split("`").join("").toLowerCase()) ||
                            client.commands.get(client.aliases.get(items[0].split("`").join("").toLowerCase()));
                        try {
                            embed.setDescription(eval(client.la[ls]["cmds"]["info"]["help"]["variable3"]));
                        } catch {}
                    } else {
                        embed.setDescription(eval(client.la[ls]["cmds"]["info"]["help"]["variable4"]));
                    }
                    allembeds.push(embed);
                }
            }
            if (CommandStr) {
                const embed = new EmbedBuilder()
                    .setColor(es.color)
                    .setThumbnail(
                        es.thumb
                            ? es.footericon && (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                ? es.footericon
                                : client.user.displayAvatarURL()
                            : null
                    );
                const cmd =
                    client.commands.get(CommandStr.toLowerCase()) ||
                    client.commands.get(client.aliases.get(CommandStr.toLowerCase()));
                var cat = false;
                if (CommandStr.toLowerCase().includes("cust")) {
                    let cuc = client.customcommands.get(guild.id, "commands");
                    if (cuc.length < 1) cuc = [handlemsg(client.la[ls].cmds.info.help.error1)];
                    else cuc = cuc.map(cmd => `\`${cmd.name}\``);
                    const items = cuc;

                    const embed = new EmbedBuilder()
                        .setColor(es.color)
                        .setThumbnail(
                            es.thumb
                                ? es.footericon && (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                    ? es.footericon
                                    : client.user.displayAvatarURL()
                                : null
                        )
                        .setThumbnail(client.user.displayAvatarURL())
                        .setTitle(eval(client.la[ls]["cmds"]["info"]["help"]["variable1"]))
                        .setDescription(items.join(", "))
                        .setFooter({ text: handlemsg(client.la[ls].cmds.info.help.nocustom), iconURL: client.user.displayAvatarURL() });

                    allembeds.push(embed);
                }
                var cat = false;
                if (!cmd) {
                    cat = client.categories.find(cat => cat.toLowerCase().includes(CommandStr.toLowerCase()));
                }
                if (!cmd && (!cat || cat == null)) {
                    allembeds.push(
                        embed
                            .setColor(es.wrongcolor)
                            .setDescription(
                                handlemsg(client.la[ls].cmds.info.help.noinfo, { command: CommandStr.toLowerCase() })
                            )
                    );
                } else if (!cmd && cat) {
                    var category = cat;
                    const items = client.commands.filter(cmd => cmd.category === category).map(cmd => `\`${cmd.name}\``);
                    const embed = new EmbedBuilder()
                        .setColor(es.color)
                        .setThumbnail(
                            es.thumb
                                ? es.footericon && (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                    ? es.footericon
                                    : client.user.displayAvatarURL()
                                : null
                        )
                        .setThumbnail(client.user.displayAvatarURL())
                        .setTitle(eval(client.la[ls]["cmds"]["info"]["help"]["variable2"]))
                        .setFooter({ text: handlemsg(client.la[ls].cmds.info.help.nocustom, { prefix: prefix }), iconURL: client.user.displayAvatarURL() });

                    if (category.toLowerCase().includes("custom")) {
                        const cmd =
                            client.commands.get(items[0].split("`").join("").toLowerCase()) ||
                            client.commands.get(client.aliases.get(items[0].split("`").join("").toLowerCase()));
                        try {
                            embed.setDescription(eval(client.la[ls]["cmds"]["info"]["help"]["variable3"]));
                        } catch {}
                    } else {
                        embed.setDescription(eval(client.la[ls]["cmds"]["info"]["help"]["variable4"]));
                    }
                    allembeds.push(embed);
                } else {
                    if (cmd.name) embed.addFields({ name: handlemsg(client.la[ls].cmds.info.help.detail.name), value: `\`${cmd.name}\`` });
                    if (cmd.name)
                        embed.setTitle(handlemsg(client.la[ls].cmds.info.help.detail.about, { cmdname: cmd.name }));
                    if (cmd.description)
                        embed.addFields({ name: handlemsg(client.la[ls].cmds.info.help.detail.desc), value: `\`\`\`${cmd.description}\`\`\`` });
                    if (cmd.aliases)
                        try {
                            embed.addFields({ name: handlemsg(client.la[ls].cmds.info.help.detail.aliases), value: `\`${cmd.aliases.map(a => `${a}`).join("`, inline: `")}\`` });
                        } catch {}
                    if (cmd.cooldown)
                        embed.addFields({ name: handlemsg(client.la[ls].cmds.info.help.detail.cooldown), value: `\`\`\`${cmd.cooldown} Seconds\`\`\`` });
                    else embed.addFields({ name: handlemsg(client.la[ls].cmds.info.help.detail.cooldown), value: `\`\`\`3 Seconds\`\`\`` });
                    if (cmd.usage) {
                        embed.addFields({ name: handlemsg(client.la[ls].cmds.info.help.detail.usage), value: `\`\`\`${prefix}${cmd.usage}\`\`\`` });
                        embed.setFooter({ text: handlemsg(client.la[ls].cmds.info.help.detail.syntax), iconURL: es.footericon && (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                ? es.footericon
                                : client.user.displayAvatarURL() });
                    }
                    allembeds.push(embed);
                }
                allembeds.push(embed);
            }
            interaction?.reply({ embeds: allembeds, ephemeral: true });
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
