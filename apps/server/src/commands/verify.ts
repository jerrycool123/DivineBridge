import {
  MembershipCollection,
  MembershipRoleCollection,
  MembershipRoleDoc,
  YouTubeChannelDoc,
} from '@divine-bridge/common';
import { Command } from '@sapphire/framework';
import { PermissionFlagsBits, RepliableInteraction } from 'discord.js';

import { ActionRows } from '../components/action-rows.js';
import { Embeds } from '../components/embeds.js';
import { OCRConstants } from '../services/ocr/constants.js';
import { OCRService } from '../services/ocr/index.js';
import { Database } from '../utils/database.js';
import { Utils } from '../utils/index.js';
import { Validators } from '../utils/validators.js';

export class VerifyCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, { ...options, preconditions: ['GuildOnly'] });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('verify')
        .setDescription('Provide a screenshot and verify your YouTube membership in this server.')
        .addAttachmentOption((option) =>
          option
            .setName('screenshot')
            .setDescription('Your YouTube membership proof screenshot')
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName('membership_role')
            .setDescription('The membership role you would like to apply for in this server')
            .setRequired(true)
            .setAutocomplete(true),
        )
        .addStringOption((option) =>
          option
            .setName('language')
            .setDescription('The language of the text in your picture')
            .addChoices(
              ...OCRConstants.supportedLanguages.map(({ name, code }) => ({
                name,
                value: code,
              })),
            )
            .setRequired(false),
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .setDMPermission(false),
    );
  }

  public async autocompleteRun(interaction: Command.AutocompleteInteraction) {
    const { guild } = interaction;
    if (guild === null) return;
    const focusedOption = interaction.options.getFocused(true);
    if (focusedOption.name === 'membership_role') {
      const keyword = focusedOption.value.toLocaleLowerCase();
      const membershipRoleDocs = await MembershipRoleCollection.find({ guild: guild.id }).populate<{
        youtube: YouTubeChannelDoc | null;
      }>('youtube');
      const filteredMembershipRoleDocs = membershipRoleDocs.filter(
        (
          membershipRoleDoc,
        ): membershipRoleDoc is Omit<MembershipRoleDoc, 'youtube'> & {
          youtube: YouTubeChannelDoc;
        } => membershipRoleDoc.youtube !== null,
      );

      const searchedMembershipRoleDocs = filteredMembershipRoleDocs.filter((membershipRoleDoc) => {
        const { title, customUrl } = membershipRoleDoc.youtube.profile;
        const { name } = membershipRoleDoc.profile;
        if (
          title.toLocaleLowerCase().includes(keyword) ||
          customUrl.toLocaleLowerCase().includes(keyword) ||
          name.toLocaleLowerCase().includes(keyword)
        ) {
          return true;
        }
      });

      await interaction.respond(
        (searchedMembershipRoleDocs.length > 0
          ? searchedMembershipRoleDocs
          : filteredMembershipRoleDocs
        ).map((membershipRoleDoc) => ({
          name: `${membershipRoleDoc.youtube.profile.title} (${membershipRoleDoc.youtube.profile.customUrl}) - @${membershipRoleDoc.profile.name}`,
          value: membershipRoleDoc._id,
        })),
      );
    }
  }

  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const { guild, user, options } = interaction;
    if (guild === null) return;

    await interaction.deferReply({ ephemeral: true });

    // Get user attachment
    const picture = options.getAttachment('screenshot', true);
    if (!(picture.contentType?.startsWith('image/') ?? false)) {
      return await interaction.editReply({
        content: 'Please provide an image file.',
      });
    }

    // Get membership role
    const membershipRoleId = options.getString('membership_role', true);
    const membershipRoleResult = await Validators.isGuildHasMembershipRole(
      guild.id,
      membershipRoleId,
    );
    if (!membershipRoleResult.success) {
      return await interaction.editReply({
        content: membershipRoleResult.error,
      });
    }
    const membershipRoleDoc = membershipRoleResult.data;

    // Upsert user config, check log channel
    const [userDoc, logChannelResult] = await Promise.all([
      Database.upsertUser({
        id: user.id,
        username: user.username,
        avatar: user.displayAvatarURL(),
      }),
      Validators.isGuildHasLogChannel(guild),
    ]);
    if (!logChannelResult.success) {
      return await interaction.editReply({
        content: logChannelResult.error,
      });
    }
    const logChannel = logChannelResult.data;

    // Get language
    const langCode = options.getString('language');
    let selectedLanguage: (typeof OCRConstants.supportedLanguages)[number];
    if (langCode === null) {
      selectedLanguage = OCRConstants.supportedLanguages.find(
        ({ code }) => code === userDoc.preference.language,
      ) ?? { name: 'English', code: 'eng' };
    } else {
      selectedLanguage = OCRConstants.supportedLanguages.find(({ code }) => code === langCode) ?? {
        name: 'English',
        code: 'eng',
      };
    }

    // Check if the user already has `auth` or `live_chat` membership
    const existingMembershipDoc = await MembershipCollection.findOne({
      user: user.id,
      membershipRole: membershipRoleId,
    });
    let activeInteraction: RepliableInteraction = interaction;
    if (
      existingMembershipDoc !== null &&
      (existingMembershipDoc.type === 'auth' || existingMembershipDoc.type === 'live_chat')
    ) {
      const confirmedResult = await Utils.awaitUserConfirm(
        activeInteraction,
        'verify-detected-oauth',
        {
          content:
            `You already have a membership with this membership role, which is periodically renewed with ${existingMembershipDoc.type === 'auth' ? 'your authorized YouTube channel credentials' : 'your message activity in the live chat room'}.\n` +
            'If your screenshot request is accepted, your current membership will be overwritten and no longer be renewed automatically. Do you want to continue?',
        },
      );
      if (!confirmedResult.confirmed) return;
      activeInteraction = confirmedResult.interaction;
      await activeInteraction.deferReply({ ephemeral: true });
    }

    // Save user config to DB
    userDoc.preference.language = selectedLanguage.code;
    await userDoc.save();

    // Send response to user
    const screenshotSubmission = Embeds.screenshotSubmission(
      user,
      membershipRoleDoc,
      selectedLanguage.name,
      guild.name,
      picture.url,
    );
    await activeInteraction.editReply({
      embeds: [screenshotSubmission],
    });

    // Send picture to membership service for OCR
    // ? Do not send error to user if OCR failed due to errors that are not related to the user
    try {
      const recognizedDate = await OCRService.recognizeBillingDate(
        picture.url,
        selectedLanguage.code,
      );

      const adminActionRow = ActionRows.adminVerificationButton();
      const membershipVerificationRequestEmbed = Embeds.membershipVerificationRequest(
        user,
        recognizedDate,
        membershipRoleDoc._id,
        selectedLanguage.name,
        picture.url,
      );

      await logChannel.send({
        components: [adminActionRow],
        embeds: [membershipVerificationRequestEmbed],
      });
    } catch (error) {
      console.error(error);
    }
  }
}
