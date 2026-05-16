const { EmbedBuilder } = require("discord.js");
const config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
const emoji = require(`${process.cwd()}/botconfig/emojis.json`);
const { getRandomInt, GetGlobalUser, GetUser, handlemsg } = require(`${process.cwd()}/handlers/functions`);
module.exports = {
    name: "modstats",
    description: "Shows the Admin Stats of a Mod/Admin, how many cmds he has executed etc.",
    options: [
        //{"Integer": { name: "ping_amount", description: "How many times do you want to ping?", required: true }}, //to use in the code: interacton.getInteger("ping_amount")
        //{"String": { name: "ping_amount", description: "How many times do you want to ping?", required: true }}, //to use in the code: interacton.getString("ping_amount")
        { User: { name: "which_user", description: "From Which User do you want to see the Stats?", required: false } }, //to use in the code: interacton.getUser("ping_a_user")
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
        let user = options.getUser("which_user");
        if (!user) user = member.user;
        try {
            client.stats.ensure(guild.id + user.id, {
                ban: [],
                kick: [],
                mute: [],
                ticket: [],
                says: [],
                warn: [],
            });

            interaction?.reply({
                ephemeral: true,
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.color)
                        .setThumbnail(
                            es.thumb
                                ? es.footericon && (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                    ? es.footericon
                                    : client.user.displayAvatarURL()
                                : null
                        )
                        .setFooter(client.getFooter(es))
                        .addFields({ name: eval(client.la[ls]["cmds"]["info"]["modstats"]["variablex_1"]), value: eval(client.la[ls]["cmds"]["info"]["modstats"]["variable1"]), inline: true })
                        .addFields({ name: eval(client.la[ls]["cmds"]["info"]["modstats"]["variablex_2"]), value: eval(client.la[ls]["cmds"]["info"]["modstats"]["variable2"]), inline: true })
                        .addFields({ name: eval(client.la[ls]["cmds"]["info"]["modstats"]["variablex_3"]), value: eval(client.la[ls]["cmds"]["info"]["modstats"]["variable3"]), inline: true })

                        .addFields({ name: eval(client.la[ls]["cmds"]["info"]["modstats"]["variablex_4"]), value: eval(client.la[ls]["cmds"]["info"]["modstats"]["variable4"]), inline: true })
                        .addFields({ name: eval(client.la[ls]["cmds"]["info"]["modstats"]["variablex_5"]), value: eval(client.la[ls]["cmds"]["info"]["modstats"]["variable5"]), inline: true })
                        .addFields({ name: eval(client.la[ls]["cmds"]["info"]["modstats"]["variablex_6"]), value: eval(client.la[ls]["cmds"]["info"]["modstats"]["variable6"]), inline: true })

                        .addFields({ name: eval(client.la[ls]["cmds"]["info"]["modstats"]["variablex_7"]), value: eval(client.la[ls]["cmds"]["info"]["modstats"]["variable7"]), inline: true })
                        .addFields({ name: eval(client.la[ls]["cmds"]["info"]["modstats"]["variablex_8"]), value: eval(client.la[ls]["cmds"]["info"]["modstats"]["variable8"]), inline: true })
                        .addFields({ name: eval(client.la[ls]["cmds"]["info"]["modstats"]["variablex_9"]), value: eval(client.la[ls]["cmds"]["info"]["modstats"]["variable9"]), inline: true })

                        .addFields({ name: eval(client.la[ls]["cmds"]["info"]["modstats"]["variablex_10"]), value: eval(client.la[ls]["cmds"]["info"]["modstats"]["variable10"]), inline: true })
                        .addFields({ name: eval(client.la[ls]["cmds"]["info"]["modstats"]["variablex_11"]), value: eval(client.la[ls]["cmds"]["info"]["modstats"]["variable11"]), inline: true })
                        .addFields({ name: eval(client.la[ls]["cmds"]["info"]["modstats"]["variablex_12"]), value: eval(client.la[ls]["cmds"]["info"]["modstats"]["variable12"]), inline: true })

                        .addFields({ name: eval(client.la[ls]["cmds"]["info"]["modstats"]["variablex_13"]), value: eval(client.la[ls]["cmds"]["info"]["modstats"]["variable13"]), inline: true })
                        .addFields({ name: eval(client.la[ls]["cmds"]["info"]["modstats"]["variablex_14"]), value: eval(client.la[ls]["cmds"]["info"]["modstats"]["variable14"]), inline: true })
                        .addFields({ name: eval(client.la[ls]["cmds"]["info"]["modstats"]["variablex_15"]), value: eval(client.la[ls]["cmds"]["info"]["modstats"]["variable15"]), inline: true })

                        .addFields({ name: eval(client.la[ls]["cmds"]["info"]["modstats"]["variablex_16"]), value: eval(client.la[ls]["cmds"]["info"]["modstats"]["variable16"]), inline: true })
                        .addFields({ name: eval(client.la[ls]["cmds"]["info"]["modstats"]["variablex_17"]), value: eval(client.la[ls]["cmds"]["info"]["modstats"]["variable17"]), inline: true })
                        .addFields({ name: eval(client.la[ls]["cmds"]["info"]["modstats"]["variablex_18"]), value: eval(client.la[ls]["cmds"]["info"]["modstats"]["variable18"]), inline: true })
                        .addFields({ name: "\u200b", value: client.la[ls].cmds.info.modstats.desc })
                        .setAuthor({ name: `${client.la[ls].cmds.info.modstats.about} ${user.tag}`, iconURL: user.displayAvatarURL({ dynamic: true, size: 512 }) || undefined }),
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
