const { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
require('dotenv').config();

const commands = [
    // 1. نظام التذاكر
    new SlashCommandBuilder()
        .setName('ticket-setup')
        .setDescription('إرسال لوحة التذاكر التفاعلية الحديثة')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    // 2. الإدارة الأساسية
    new SlashCommandBuilder()
        .setName('ban')
        .setDescription('حظر عضو من السيرفر')
        .addUserOption(opt => opt.setName('target').setDescription('العضو').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('سبب الحظر'))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    new SlashCommandBuilder()
        .setName('kick')
        .setDescription('طرد عضو من السيرفر')
        .addUserOption(opt => opt.setName('target').setDescription('العضو').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('سبب الطرد'))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('إسكات مؤقت لعضو')
        .addUserOption(opt => opt.setName('target').setDescription('العضو').setRequired(true))
        .addIntegerOption(opt => opt.setName('duration').setDescription('المدة بالدقائق').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('السبب'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    new SlashCommandBuilder()
        .setName('clear')
        .setDescription('مسح الرسائل من الروم')
        .addIntegerOption(opt => opt.setName('amount').setDescription('العدد (1-100)').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    new SlashCommandBuilder()
        .setName('slowmode')
        .setDescription('تحديد وقت البطء في الروم (Slowmode)')
        .addIntegerOption(opt => opt.setName('seconds').setDescription('المدة بالثواني (0 للتعطيل)').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    new SlashCommandBuilder()
        .setName('lock')
        .setDescription('قفل الروم الحالي')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    new SlashCommandBuilder()
        .setName('unlock')
        .setDescription('فتح الروم الحالي')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    // 3. نظام التحذيرات
    new SlashCommandBuilder()
        .setName('warn')
        .setDescription('إعطاء تحذير لعضو')
        .addUserOption(opt => opt.setName('target').setDescription('العضو').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('السبب').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('عرض سجل تحذيرات العضو')
        .addUserOption(opt => opt.setName('target').setDescription('العضو').setRequired(true)),

    // 4. أدوات ومعلومات
    new SlashCommandBuilder()
        .setName('announce')
        .setDescription('إرسال إعلان إداري بتنسيق احترافي')
        .addStringOption(opt => opt.setName('title').setDescription('عنوان الإعلان').setRequired(true))
        .addStringOption(opt => opt.setName('message').setDescription('نص الإعلان').setRequired(true))
        .addBooleanOption(opt => opt.setName('ping').setDescription('عمل منشن للجميع (@everyone)؟'))
        .setDefaultMemberPermissions(PermissionFlagsBits.MentionEveryone),

    new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('عرض بطاقة معلومات شاملة عن عضو')
        .addUserOption(opt => opt.setName('target').setDescription('العضو (اتركه فارغاً لعرض حسابك)')),

    new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('عرض إحصائيات السيرفر')
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('🔄 جاري تحديث الأوامر في السيرفر...');
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands }
        );
        console.log('✅ تم تسجيل وتحديث الأوامر بنجاح!');
    } catch (err) {
        console.error('❌ حدث خطأ أثناء التسجيل:', err);
    }
})();