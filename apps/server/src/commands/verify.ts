import {
  ActionRows,
  Database,
  Embeds,
  GuildDoc,
  MembershipCollection,
  MembershipRoleCollection,
  MembershipRoleDocWithValidYouTubeChannel,
  YouTubeChannelDoc,
} from '@divine-bridge/common';
import { TFunc, defaultLocale, supportedLocales, t } from '@divine-bridge/i18n';
import { OCRService, RecognizedDate, supportedOCRLanguages } from '@divine-bridge/ocr-service';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import dedent from 'dedent';
import {
  Attachment,
  AutocompleteInteraction,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  ComponentType,
  Guild,
  InteractionContextType,
  MessageFlags,
  RepliableInteraction,
  SlashCommandBuilder,
} from 'discord.js';

import { Constants } from '../constants.js';
import { ChatInputCommand } from '../structures/chat-input-command.js';
import { Env } from '../utils/env.js';
import { Utils } from '../utils/index.js';
import { logger } from '../utils/logger.js';
import { Validators } from '../utils/validators.js';

dayjs.extend(utc);

export class VerifyCommand extends ChatInputCommand {
  public readonly command = this.commandFactory({ alias: false });
  public readonly devTeamOnly = false;
  public readonly guildOnly = true;
  public readonly moderatorOnly = false;

  public commandFactory(
    args:
      | {
          alias: false;
        }
      | {
          alias: true;
          name: string;
          youtubeChannelTitle: string;
        },
  ) {
    const command = new SlashCommandBuilder().setName(
      args.alias ? args.name : t('verify_command.name', defaultLocale),
    );
    if (!args.alias) {
      command.setNameLocalizations(
        supportedLocales.reduce(
          (acc, locale) =>
            locale === defaultLocale ? acc : { ...acc, [locale]: t('verify_command.name', locale) },
          {},
        ),
      );
    }
    command
      .setDescription(
        `${t('verify_command.description_1', defaultLocale)} ${args.alias ? args.youtubeChannelTitle : 'YouTube'} ${t('verify_command.description_2', defaultLocale)}`,
      )
      .setDescriptionLocalizations(
        supportedLocales.reduce(
          (acc, locale) =>
            locale === defaultLocale
              ? acc
              : {
                  ...acc,
                  [locale]: `${t('verify_command.description_1', locale)} ${
                    args.alias ? args.youtubeChannelTitle : 'YouTube'
                  } ${t('verify_command.description_2', locale)}`,
                },
          {},
        ),
      )
      .addAttachmentOption((option) =>
        option
          .setI18nName('verify_command.screenshot_option_name')
          .setI18nDescription('verify_command.screenshot_option_description')
          .setRequired(true),
      );
    if (!args.alias) {
      // Global command
      command
        .addStringOption((option) =>
          option
            .setI18nName('verify_command.membership_role_option_name')
            .setI18nDescription('verify_command.membership_role_option_description')
            .setRequired(true)
            .setAutocomplete(true),
        )
        .setContexts(InteractionContextType.Guild);
    }
    command.addStringOption((option) =>
      option
        .setI18nName('verify_command.language_option_name')
        .setI18nDescription('verify_command.language_option_description')
        .addChoices(
          ...supportedOCRLanguages.map(({ language, code }) => ({
            name: language,
            value: code,
          })),
        )
        .setRequired(false),
    );

    return command;
  }

  public override async autocomplete(
    interaction: AutocompleteInteraction,
    { guild }: ChatInputCommand.ExecuteContext,
  ) {
    const focusedOption = interaction.options.getFocused(true);
    if (focusedOption.name === 'membership_role') {
      const keyword = focusedOption.value.toLocaleLowerCase();
      const membershipRoleDocs = await MembershipRoleCollection.find({ guild: guild.id })
        .limit(25)
        .populate<{
          youtube: YouTubeChannelDoc | null;
        }>('youtube');
      const filteredMembershipRoleDocs = membershipRoleDocs.filter(
        (membershipRoleDoc) => membershipRoleDoc.youtube !== null,
      ) as MembershipRoleDocWithValidYouTubeChannel[];

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

  public override async execute(
    interaction: ChatInputCommandInteraction,
    context: ChatInputCommand.ExecuteContext,
  ) {
    const { options } = interaction;

    const picture = options.getAttachment('screenshot', true);
    const membershipRoleId = options.getString('membership_role', true);
    const langCode = options.getString('language');

    await this._execute(interaction, { ...context, picture, membershipRoleId, langCode });
  }

  public async executeAlias(
    interaction: ChatInputCommandInteraction,
    args: { membershipRoleId: string },
    context: ChatInputCommand.ExecuteContext,
  ) {
    const { options } = interaction;
    const { membershipRoleId } = args;

    const picture = options.getAttachment('screenshot', true);
    const langCode = options.getString('language');

    await this._execute(interaction, { ...context, picture, membershipRoleId, langCode });
  }

  private async _execute(
    interaction: ChatInputCommandInteraction,
    args: {
      guild: Guild;
      guildDoc: GuildDoc;
      guildLocale: string;
      guild_t: TFunc;
      authorLocale: string;
      author_t: TFunc;
      picture: Attachment;
      membershipRoleId: string;
      langCode: string | null;
    },
  ) {
    const { user } = interaction;
    const { guild, guild_t, author_t, picture, membershipRoleId } = args;
    let langCode = args.langCode;

    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    // Get user attachment
    if (!(picture.contentType?.startsWith('image/') ?? false)) {
      return await interaction.editReply({
        content: author_t('server.Please provide an image file'),
      });
    }

    // Get membership role
    const membershipRoleResult = await Validators.isGuildHasMembershipRole(
      author_t,
      guild.id,
      membershipRoleId,
    );
    if (!membershipRoleResult.success) {
      return await interaction.editReply({
        content: membershipRoleResult.error,
      });
    }
    const membershipRoleDoc = membershipRoleResult.data;

    // Upsert user config, and check log channel
    const [userDoc, logChannelResult] = await Promise.all([
      Database.upsertUser(Utils.convertUser(user)),
      Validators.isGuildHasLogChannel(author_t, guild),
    ]);
    if (!logChannelResult.success) {
      return await interaction.editReply({
        content: logChannelResult.error,
      });
    }
    const logChannel = logChannelResult.data;

    // Language tutorial
    let activeInteraction: RepliableInteraction = interaction;
    if (!userDoc.flags.tutorial && langCode === null) {
      // Ask user to select language and confirm
      const languageActionRow = ActionRows.languageSelect(author_t, userDoc.preference.language);
      const [confirmCustomId, cancelCustomId] = [
        `language-tutorial-confirm-button`,
        `language-tutorial-cancel-button`,
      ];
      const confirmActionRow = ActionRows.confirmButton(author_t, confirmCustomId, cancelCustomId, [
        new ButtonBuilder()
          .setLabel(author_t('server.Use Auth Mode'))
          .setURL(
            `${Constants.webUrl}/login?callbackUrl=${encodeURIComponent(`/dashboard?roleId=${membershipRoleId}`)}`,
          )
          .setStyle(ButtonStyle.Link),
      ]);
      const response = await activeInteraction.editReply({
        content: `${author_t('server.Welcome to Divine Bridge You have selected the')} __${author_t('common.Screenshot Mode')}__${author_t('common.period')}${author_t('server.Please select the language in your screenshot for better recognition accuracy I will remember your preference for the next time If you want to change the language you can specify the')} \`${author_t('verify_command.language_option_name')}\` ${author_t('server.option the next time you use this command')}`,
        components: [languageActionRow, confirmActionRow],
      });

      // Wait for user's language selection
      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        filter: (selectMenuInteraction) =>
          activeInteraction.user.id === selectMenuInteraction.user.id &&
          selectMenuInteraction.customId === 'language-select',
        time: 60 * 1000,
      });
      const handleEndTutorial = async (content: 'timeout' | 'cancel' | 'ok') => {
        try {
          languageActionRow.components.forEach((component) => component.setDisabled(true));
          confirmActionRow.components.forEach((component) => component.setDisabled(true));
          if (!collector.ended) {
            collector.stop();
          }
          await activeInteraction.editReply({
            ...(content === 'timeout' && {
              content: author_t('server.Timed out Please try again'),
            }),
            ...(content === 'cancel' && { content: author_t('server.Cancelled') }),
            components: [languageActionRow, confirmActionRow],
          });
        } catch (error) {
          logger.error(error);
        }
      };
      let finished = false;
      collector.on('collect', async (selectMenuInteraction) => {
        try {
          const selectedValue = (selectMenuInteraction.values[0] ?? null) as string | null;
          if (selectedValue === null) return;

          const selectedOption =
            languageActionRow.components[0].options.find(
              (option) => option.data.value === selectedValue,
            ) ?? null;
          if (selectedOption === null) return;

          langCode = selectedValue;

          languageActionRow.components[0].options.forEach((option) =>
            option.setDefault(option.data.value === selectedOption.data.value),
          );

          await selectMenuInteraction.update({
            components: [languageActionRow, confirmActionRow],
          });
        } catch (error) {
          logger.error(error);
        }
      });
      collector.on('end', async () => {
        if (finished) return;
        try {
          await handleEndTutorial('timeout');
        } catch (error) {
          logger.error(error);
        }
      });

      // Wait for user's confirmation
      let buttonInteraction: ButtonInteraction;
      try {
        buttonInteraction = await response.awaitMessageComponent({
          componentType: ComponentType.Button,
          filter: (buttonInteraction) =>
            buttonInteraction.user.id === activeInteraction.user.id &&
            [confirmCustomId, cancelCustomId].includes(buttonInteraction.customId),
          time: 60 * 1000,
        });
      } catch (_error) {
        // Timeout
        await handleEndTutorial('timeout');
        return;
      }

      // Handle user's confirmation
      finished = true;
      if (buttonInteraction.customId === confirmCustomId) {
        await handleEndTutorial('ok');
        activeInteraction = buttonInteraction;
        await activeInteraction.deferReply({ flags: [MessageFlags.Ephemeral] });
      } else {
        await buttonInteraction.update({});
        await handleEndTutorial('cancel');
        return;
      }
    }

    // Get language
    let selectedLanguage: (typeof supportedOCRLanguages)[number];
    if (langCode === null) {
      selectedLanguage = supportedOCRLanguages.find(
        ({ code }) => code === userDoc.preference.language,
      ) ?? { language: 'English', code: 'eng' };
    } else {
      selectedLanguage = supportedOCRLanguages.find(({ code }) => code === langCode) ?? {
        language: 'English',
        code: 'eng',
      };
    }

    // Check if the user already has `auth` or `live_chat` membership
    const existingMembershipDoc = await MembershipCollection.findOne({
      user: user.id,
      membershipRole: membershipRoleId,
    });
    if (
      existingMembershipDoc !== null &&
      (existingMembershipDoc.type === 'auth' || existingMembershipDoc.type === 'live_chat')
    ) {
      const confirmedResult = await Utils.awaitUserConfirm(
        author_t,
        activeInteraction,
        'verify-detected-oauth',
        {
          content: dedent`
            ${author_t('server.You already have a membership with this membership role which is periodically renewed with')} ${existingMembershipDoc.type === 'auth' ? author_t('server.your authorized YouTube channel credentials') : author_t('server.your message activity in the live chat room')}
            ${author_t(
              'server.If your screenshot request is accepted your current membership will be overwritten and no longer be renewed automatically Do you want to continue',
            )}
          `,
        },
      );
      if (!confirmedResult.confirmed) return;
      activeInteraction = confirmedResult.interaction;
      await activeInteraction.deferReply({ flags: [MessageFlags.Ephemeral] });
    }

    // Save user config to DB
    userDoc.flags.tutorial = true;
    userDoc.preference.language = selectedLanguage.code;
    await userDoc.save();

    // Send response to user
    const screenshotSubmission = Embeds.screenshotSubmission(
      author_t,
      Utils.convertUser(user),
      membershipRoleDoc,
      selectedLanguage.language,
      guild.name,
      picture.url,
    );
    await activeInteraction.editReply({
      embeds: [screenshotSubmission],
    });

    // Send picture to membership service for OCR
    // ? Do not send error to user if OCR failed due to errors that are not related to the user
    const ocrService = new OCRService(Env.OCR_API_ENDPOINT, Env.OCR_API_KEY);
    const recognizedResult = await ocrService.recognizeBillingDate(
      picture.url,
      selectedLanguage.code,
    );
    if (!recognizedResult.success) {
      this.context.logger.error(recognizedResult.error);
    }

    let recognizedDate: RecognizedDate & { year: number | null } = {
      year: null,
      month: null,
      day: null,
    };

    const { month, day } = recognizedResult.success
      ? recognizedResult.date
      : { month: null, day: null };
    if (month !== null) {
      const currentDate = dayjs.utc().startOf('day');
      const currentYear = currentDate.year();
      const recognizedDateWithYear = dayjs
        .utc()
        .set('year', currentYear)
        .set('month', month - 1)
        .set('date', day)
        .startOf('day');
      const year = recognizedDateWithYear.isBefore(currentDate) ? currentYear + 1 : currentYear;
      recognizedDate = { year, month, day };
    }

    const adminActionRow = ActionRows.adminVerificationButton(guild_t);
    const membershipVerificationRequestEmbed = Embeds.membershipVerificationRequest(
      guild_t,
      Utils.convertUser(user),
      recognizedDate,
      membershipRoleDoc._id,
      selectedLanguage.language,
      picture.url,
    );

    await logChannel.send({
      components: [adminActionRow],
      embeds: [membershipVerificationRequestEmbed],
    });
  }
}
