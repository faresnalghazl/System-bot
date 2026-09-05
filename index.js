const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    PermissionFlagsBits, 
    Events, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    StringSelectMenuBuilder, 
    ChannelType, 
    MessageFlags, 
    AttachmentBuilder 
} = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// قاعدة بيانات التحذيرات المؤقتة
const warningsDB = new Map();

// دالة موحدة لإرسال السجلات (Logs)
async function sendLog(guild, embed, files = []) {
    const logChannelId = process.env.LOG_CHANNEL_ID;
    if (!logChannelId) return;
    const channel = guild.channels.cache.get(logChannelId);
    if (channel) channel.send({ embeds: [embed], files }).catch(() => {});
}

client.once(Events.ClientReady, c => {
    console.log(`========================================`);
    console.log(`🚀 تم تشغيل البوت بنجاح: ${c.user.tag}`);
    console.log(`💎 النظام الإداري ونظام التذاكر V2 جاهز!`);
    console.log(`========================================`);
});

// ----------------------------------------------------
// 1. الترحيب التلقائي والرتبة
// ----------------------------------------------------
client.on(Events.GuildMemberAdd, async member => {
    if (process.env.AUTO_ROLE_ID) {
        const role = member.guild.roles.cache.get(process.env.AUTO_ROLE_ID);
        if (role) await member.roles.add(role).catch(console.error);
    }

    const welcomeEmbed = new EmbedBuilder()
        .setColor(0x2ECC71)
        .setTitle('👋 انضمام عضو جديد')
        .setDescription(`أهلاً بك ${member} في **${member.guild.name}**!\nنتمنى لك قضاء وقت ممتع معنا.`)
        .addFields(
            { name: '🆔 الحساب', value: `${member.user.tag}`, inline: true },
            { name: '👥 عدد الأعضاء الحالي', value: `\`${member.guild.memberCount}\``, inline: true }
        )
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: `${member.guild.name} System`, iconURL: member.guild.iconURL({ dynamic: true }) })
        .setTimestamp();

    await sendLog(member.guild, welcomeEmbed);
});

// ----------------------------------------------------
// 2. التفاعلات (Select Menus, Buttons, Slash Commands)
// ----------------------------------------------------
client.on(Events.InteractionCreate, async interaction => {

    // ========== أولاً: معالجة قائمة اختيار نوع التذكرة (Select Menu) ==========
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_category_select') {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const selectedType = interaction.values[0];
        const supportRoleId = process.env.SUPPORT_ROLE_ID;
        const safeUsername = interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '');
        const channelName = `ticket-${safeUsername || interaction.user.id}`;

        const existing = interaction.guild.channels.cache.find(c => c.name === channelName);
        if (existing) {
            return interaction.editReply({ content: `❌ لديك تذكرة مفتوحة مسبقاً: ${existing}` });
        }

        const ticketTypesData = {
            support: { title: '🛠️ الدعم الفني والشكاوى', color: 0x3498DB },
            shop: { title: '🛒 المبيعات والمتجر', color: 0x2ECC71 },
            inquiry: { title: '❓ الاستفسارات العامة', color: 0xF1C40F }
        };

        const typeInfo = ticketTypesData[selectedType] || { title: '🎫 تذكرة دعم عامة', color: 0x5865F2 };

        try {
            const permissionOverwrites = [
                { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { 
                    id: interaction.user.id, 
                    allow: [
                        PermissionFlagsBits.ViewChannel, 
                        PermissionFlagsBits.SendMessages, 
                        PermissionFlagsBits.AttachFiles, 
                        PermissionFlagsBits.ReadMessageHistory
                    ] 
                },
                { 
                    id: client.user.id, 
                    allow: [
                        PermissionFlagsBits.ViewChannel, 
                        PermissionFlagsBits.SendMessages, 
                        PermissionFlagsBits.ManageChannels
                    ] 
                }
            ];

            if (supportRoleId) {
                permissionOverwrites.push({
                    id: supportRoleId,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.AttachFiles,
                        PermissionFlagsBits.ReadMessageHistory
                    ]
                });
            }

            const ticketChannel = await interaction.guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: process.env.TICKET_CATEGORY_ID || null,
                permissionOverwrites
            });

            // تصميم الرسالة الداخلية للتذكرة
            const ticketInsideEmbed = new EmbedBuilder()
                .setColor(typeInfo.color)
                .setTitle(`${typeInfo.title}`)
                .setDescription(
                    `مرحباً بك ${interaction.user}!\n\n` +
                    `يرجى كتابة تفاصيل موضوعك واستفسارك بوضوح لتسهيل مساعدتك.\n` +
                    `سيتواجد أحد مسؤولي القسم معك بأقرب فرصة ممكنة.\n\n` +
                    `> ⚠️ **تنبيه:** يرجى عدم تكرار المنشن حفاظاً على سرعة المعالجة.`
                )
                .addFields(
                    { name: '👤 صاحب التذكرة', value: `${interaction.user}`, inline: true },
                    { name: '📂 نوع التذكرة', value: `\`${typeInfo.title}\``, inline: true },
                    { name: '🛡️ المشرف المستلم', value: '`في انتظار الاستلام...`', inline: true },
                    { name: '🕒 وقت الفتح', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
                )
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: `${interaction.guild.name} • Ticket System V2`, iconURL: interaction.guild.iconURL({ dynamic: true }) });

            const buttonsRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('claim_ticket')
                    .setLabel('استلام التذكرة')
                    .setEmoji('✋')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('إغلاق وحفظ السجل')
                    .setEmoji('🔒')
                    .setStyle(ButtonStyle.Danger)
            );

            const mentionText = supportRoleId ? `${interaction.user} | <@&${supportRoleId}>` : `${interaction.user}`;
            await ticketChannel.send({ content: mentionText, embeds: [ticketInsideEmbed], components: [buttonsRow] });

            await interaction.editReply({ content: `✅ تم إنشاء تذكرتك بنجاح: ${ticketChannel}` });

            // لوق الفتح
            const logOpen = new EmbedBuilder()
                .setColor(typeInfo.color)
                .setTitle('📩 تم فتح تذكرة جديدة')
                .addFields(
                    { name: '👤 العضو', value: `${interaction.user.tag} (\`${interaction.user.id}\`)`, inline: true },
                    { name: '📂 القسم', value: typeInfo.title, inline: true },
                    { name: '💬 الروم', value: `${ticketChannel}`, inline: true }
                )
                .setTimestamp();
            await sendLog(interaction.guild, logOpen);

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: '❌ حدث خطأ أثناء إنشاء التذكرة، تأكد من صلاحيات البوت.' });
        }
    }

    // ========== ثانياً: معالجة أزرار التذاكر ==========
    if (interaction.isButton()) {
        const supportRoleId = process.env.SUPPORT_ROLE_ID;

        // [زر الاستلام - Claim]
        if (interaction.customId === 'claim_ticket') {
            const hasSupportRole = supportRoleId ? interaction.member.roles.cache.has(supportRoleId) : false;
            const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.ManageMessages);

            if (!hasSupportRole && !isAdmin) {
                return interaction.reply({ content: '❌ هذا الإجراء مخصص لطاقم إدارة التذاكر فقط.', flags: MessageFlags.Ephemeral });
            }

            const currentEmbed = interaction.message.embeds[0];
            const updatedEmbed = EmbedBuilder.from(currentEmbed)
                .setColor(0x2ECC71)
                .spliceFields(2, 1, { name: '🛡️ المشرف المستلم', value: `${interaction.user}`, inline: true });

            const updatedRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('claimed_btn')
                    .setLabel(`مستلمة من: ${interaction.user.username}`)
                    .setEmoji('✅')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('إغلاق وحفظ السجل')
                    .setEmoji('🔒')
                    .setStyle(ButtonStyle.Danger)
            );

            await interaction.update({ embeds: [updatedEmbed], components: [updatedRow] });
            await interaction.channel.send({ content: `🔔 تم استلام التذكرة من قبل: ${interaction.user}` });
        }

        // [زر الإغلاق وحفظ السجل - Close & Transcript]
        if (interaction.customId === 'close_ticket') {
            const hasSupportRole = supportRoleId ? interaction.member.roles.cache.has(supportRoleId) : false;
            const isManager = interaction.member.permissions.has(PermissionFlagsBits.ManageMessages);
            const isOwner = interaction.channel.name.includes(interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, ''));

            if (!hasSupportRole && !isManager && !isOwner) {
                return interaction.reply({ content: '❌ لا تملك صلاحية إغلاق هذه التذكرة.', flags: MessageFlags.Ephemeral });
            }

            await interaction.reply({ content: '🔒 **جارٍ سحب سجل المحادثة وإغلاق التذكرة خلال 5 ثوانٍ...**' });

            try {
                // سحب الرسائل وحفظها Transcript
                const fetchedMessages = await interaction.channel.messages.fetch({ limit: 100 });
                const transcriptData = fetchedMessages.reverse().map(m => 
                    `[${new Date(m.createdTimestamp).toLocaleString('ar-SA')}] ${m.author.tag}: ${m.cleanContent}`
                ).join('\n');

                const buffer = Buffer.from(transcriptData || 'لا توجد رسائل', 'utf-8');
                const attachment = new AttachmentBuilder(buffer, { name: `${interaction.channel.name}-transcript.txt` });

                const logClose = new EmbedBuilder()
                    .setColor(0xED4245)
                    .setTitle('🗑️ تم إغلاق تذكرة وحفظ سجلها')
                    .addFields(
                        { name: '💬 الروم', value: `\`${interaction.channel.name}\``, inline: true },
                        { name: '🔒 أُغلقت بواسطة', value: `${interaction.user.tag}`, inline: true }
                    )
                    .setTimestamp();

                await sendLog(interaction.guild, logClose, [attachment]);
            } catch (err) {
                console.error('Error generating transcript:', err);
            }

            setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
        }
        return;
    }

    // ========== ثالثاً: معالجة الأوامر التفاعلية (Slash Commands) ==========
    if (!interaction.isChatInputCommand()) return;
    const { commandName, options, guild, channel } = interaction;

    // 1. أمر إعداد التذاكر V2
    if (commandName === 'ticket-setup') {
        const setupEmbed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(`مركز خدمة العملاء والدعم الفني | ${guild.name}`)
            .setDescription(
                `مرحباً بكم في قسم المساعدة والتذاكر الخاص بـ **${guild.name}**.\n\n` +
                `📌 **يرجى اختيار القسم المناسب لاستفسارك من القائمة أدناه:**\n\n` +
                `🛠️ **الدعم الفني والشكاوى:** للمشاكل التقنية، التبليغات، والاقتراحات.\n` +
                `🛒 **المبيعات والمتجر:** للاستفسار عن الرتب، المنتجات، والخدمات المدفوعة.\n` +
                `❓ **الاستفسارات العامة:** لأي سؤال عام يخص السيرفر والفعاليات.\n\n` +
                `> 💡 *سيتم توجيهك مباشرة إلى فريق العمل المختص فور اختيار القسم.*`
            )
            .setImage('https://dummyimage.com/650x140/2b2d31/5865f2&text=Support+Tickets+System+V2')
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .setFooter({ text: `${guild.name} Support System`, iconURL: guild.iconURL({ dynamic: true }) });

        const selectMenu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('ticket_category_select')
                .setPlaceholder('🔽 اضغط هنا لاختيار قسم التذكرة...')
                .addOptions([
                    {
                        label: 'الدعم الفني والشكاوى',
                        description: 'للمشاكل، الشكاوى، والمساعدة التقنية',
                        value: 'support',
                        emoji: '🛠️'
                    },
                    {
                        label: 'المبيعات والمتجر',
                        description: 'شراء المنتجات، الرتب، والاستفسارات المالية',
                        value: 'shop',
                        emoji: '🛒'
                    },
                    {
                        label: 'الاستفسارات العامة',
                        description: 'أي استفسار أو سؤال عام عن السيرفر',
                        value: 'inquiry',
                        emoji: '❓'
                    }
                ])
        );

        await channel.send({ embeds: [setupEmbed], components: [selectMenu] });
        await interaction.reply({ content: '✅ تم إرسال لوحة التذاكر المحدثة بنجاح.', flags: MessageFlags.Ephemeral });
    }

    // 2. أمر الإعلان الإداري الفخم (Announce)
    if (commandName === 'announce') {
        const title = options.getString('title');
        const message = options.getString('message');
        const ping = options.getBoolean('ping');

        const announceEmbed = new EmbedBuilder()
            .setColor(0xFEE75C)
            .setTitle(`📢 ${title}`)
            .setDescription(message)
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .setFooter({ text: `إعلان رسمي صادر عن: ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
            .setTimestamp();

        await channel.send({ 
            content: ping ? '@everyone' : null, 
            embeds: [announceEmbed] 
        });

        await interaction.reply({ content: '✅ تم نشر الإعلان بنجاح!', flags: MessageFlags.Ephemeral });
    }

    // 3. أمر بطاقة معلومات المستخدم (UserInfo)
    if (commandName === 'userinfo') {
        const targetUser = options.getUser('target') || interaction.user;
        const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);

        const rolesList = targetMember?.roles.cache
            .filter(r => r.id !== guild.id)
            .map(r => `${r}`)
            .join(' ') || 'لا توجد رتب';

        const userEmbed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(`👤 معلومات الحساب: ${targetUser.username}`)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: '🆔 المعرّف (ID)', value: `\`${targetUser.id}\``, inline: true },
                { name: '🏷️ الاسم', value: `${targetUser.tag}`, inline: true },
                { name: '📅 تاريخ إنشاء الحساب', value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:D> (<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>)`, inline: false },
                { name: '📥 تاريخ دخول السيرفر', value: targetMember ? `<t:${Math.floor(targetMember.joinedTimestamp / 1000)}:D> (<t:${Math.floor(targetMember.joinedTimestamp / 1000)}:R>)` : 'غير متوفر', inline: false },
                { name: '👑 الرتب', value: rolesList.length > 1024 ? `${rolesList.substring(0, 1000)}...` : rolesList }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [userEmbed] });
    }

    // 4. أمر وضع البطء في الشات (Slowmode)
    if (commandName === 'slowmode') {
        const seconds = options.getInteger('seconds');
        await channel.setRateLimitPerUser(seconds);

        if (seconds === 0) {
            await interaction.reply({ content: '⚡ تم تعطيل نظام البطء في هذا الروم.' });
        } else {
            await interaction.reply({ content: `⏱️ تم ضبط نظام البطء في هذا الروم على **${seconds}** ثانية.` });
        }
    }

    // 5. أوامر التحكم بالشات (Lock / Unlock)
    if (commandName === 'lock') {
        await channel.permissionOverwrites.edit(guild.id, { SendMessages: false });
        await interaction.reply({ content: '🔒 تم قفل الروم بنجاح.' });
    }
    if (commandName === 'unlock') {
        await channel.permissionOverwrites.edit(guild.id, { SendMessages: true });
        await interaction.reply({ content: '🔓 تم فتح الروم بنجاح.' });
    }

    // 6. أوامر التحذيرات (Warn / Warnings)
    if (commandName === 'warn') {
        const target = options.getUser('target');
        const reason = options.getString('reason');

        const userWarnings = warningsDB.get(target.id) || [];
        userWarnings.push({ reason, moderator: interaction.user.tag, date: new Date().toLocaleDateString('ar-SA') });
        warningsDB.set(target.id, userWarnings);

        await interaction.reply({ content: `⚠️ تم إعطاء تحذير لـ ${target}. السبب: **${reason}**` });

        const log = new EmbedBuilder()
            .setColor(0xF1C40F)
            .setTitle('⚠️ تحذير إداري جديد')
            .addFields(
                { name: '👤 العضو', value: `${target.tag} (\`${target.id}\`)`, inline: true },
                { name: '🛡️ الإداري', value: `${interaction.user.tag}`, inline: true },
                { name: '🔢 عدد التحذيرات', value: `\`${userWarnings.length}\``, inline: true },
                { name: '📝 السبب', value: reason }
            )
            .setTimestamp();
        await sendLog(guild, log);
    }
    if (commandName === 'warnings') {
        const target = options.getUser('target');
        const warns = warningsDB.get(target.id) || [];

        if (warns.length === 0) return interaction.reply({ content: `✅ العضو ${target.tag} لا يملك أي تحذيرات سابقة.`, flags: MessageFlags.Ephemeral });

        const warnList = warns.map((w, i) => `**[#${i + 1}]** بواسطة: \`${w.moderator}\` في ${w.date}\n السبب: *${w.reason}*`).join('\n\n');
        const warnEmbed = new EmbedBuilder()
            .setColor(0xE67E22)
            .setTitle(`📋 سجل تحذيرات: ${target.tag} (الإجمالي: ${warns.length})`)
            .setDescription(warnList)
            .setTimestamp();

        await interaction.reply({ embeds: [warnEmbed] });
    }

    // 7. أوامر العقوبات (Clear, Timeout, Ban, Kick)
    if (commandName === 'clear') {
        const amount = options.getInteger('amount');
        const deleted = await channel.bulkDelete(amount, true);
        await interaction.reply({ content: `🧹 تم مسح **${deleted.size}** رسالة بنجاح.`, flags: MessageFlags.Ephemeral });
    }
    if (commandName === 'timeout') {
        const target = options.getMember('target');
        const duration = options.getInteger('duration');
        const reason = options.getString('reason') || 'بدون سبب';
        if (!target || !target.moderatable) return interaction.reply({ content: '❌ لا يمكن إسكات هذا العضو.', flags: MessageFlags.Ephemeral });

        await target.timeout(duration * 60 * 1000, reason);
        await interaction.reply({ content: `⏳ تم إسكات ${target.user.tag} لمدة **${duration}** دقيقة.` });
    }
    if (commandName === 'ban') {
        const target = options.getMember('target');
        const reason = options.getString('reason') || 'بدون سبب';
        if (!target || !target.bannable) return interaction.reply({ content: '❌ لا يمكن حظر هذا العضو.', flags: MessageFlags.Ephemeral });

        await target.ban({ reason });
        await interaction.reply({ content: `🔨 تم حظر ${target.user.tag} من السيرفر.` });
    }
    if (commandName === 'kick') {
        const target = options.getMember('target');
        const reason = options.getString('reason') || 'بدون سبب';
        if (!target || !target.kickable) return interaction.reply({ content: '❌ لا يمكن طرد هذا العضو.', flags: MessageFlags.Ephemeral });

        await target.kick(reason);
        await interaction.reply({ content: `👢 تم طرد ${target.user.tag} من السيرفر.` });
    }

    // 8. معلومات السيرفر
    if (commandName === 'serverinfo') {
        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(`📊 إحصائيات ومعلومات: ${guild.name}`)
            .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: '👑 مالك السيرفر', value: `<@${guild.ownerId}>`, inline: true },
                { name: '👥 عدد الأعضاء', value: `\`${guild.memberCount}\``, inline: true },
                { name: '📁 عدد الرومات', value: `\`${guild.channels.cache.size}\``, inline: true },
                { name: '🏷️ عدد الرتب', value: `\`${guild.roles.cache.size}\``, inline: true },
                { name: '🚀 مستوى البوست', value: `\`Tier ${guild.premiumTier}\` (${guild.premiumSubscriptionCount} بوست)`, inline: true },
                { name: '📅 تاريخ التأسيس', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true }
            )
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
    }
});

// تفادي انهيار البوت عند أي خطأ مفاجئ
process.on('unhandledRejection', error => console.error('Unhandled Promise Rejection:', error));
process.on('uncaughtException', error => console.error('Uncaught Exception:', error));

client.login(process.env.DISCORD_TOKEN);