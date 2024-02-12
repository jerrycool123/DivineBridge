import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { type ButtonInteraction, EmbedBuilder } from 'discord.js';

import { ActionRows } from '../components/action-rows.js';
import { Embeds } from '../components/embeds.js';
import { Constants } from '../constants.js';
import { MembershipService } from '../services/membership.js';
import { Fetchers } from '../utils/fetchers.js';
import { Validators } from '../utils/validators.js';

export class MembershipAcceptButtonHandler extends InteractionHandler {
  public constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.Button,
    });
  }

  public override parse(interaction: ButtonInteraction) {
    const { guild } = interaction;
    if (
      guild === null ||
      interaction.message.author.id !== this.container.client.id ||
      interaction.customId !== Constants.membership.accept
    ) {
      return this.none();
    }

    return this.some({ guild });
  }

  public async run(
    interaction: ButtonInteraction,
    parsedData: InteractionHandler.ParseResult<this>,
  ) {
    const { user: moderator } = interaction;
    const { guild } = parsedData;

    await interaction.deferUpdate();

    // Parse embed
    if (interaction.message.embeds.length === 0) {
      return await interaction.followUp({
        content: 'Failed to parse the request embed.',
      });
    }
    const parsedResult = await Embeds.parseMembershipVerificationRequestEmbed(interaction);
    if (!parsedResult.success) {
      return await interaction.followUp({
        content: parsedResult.error,
      });
    }
    const { embed, userId, beginDate, endDate, endDateIndex, roleId } = parsedResult;

    // Check if the guild has the membership role and the role is manageable
    const [membershipRoleResult, manageableResult] = await Promise.all([
      Validators.isGuildHasMembershipRole(guild.id, roleId),
      Validators.isManageableRole(guild, roleId),
    ]);
    if (!membershipRoleResult.success) {
      return await interaction.followUp({
        content: membershipRoleResult.error,
      });
    } else if (!manageableResult.success) {
      return await interaction.followUp({
        content: manageableResult.error,
      });
    }
    const membershipRoleDoc = membershipRoleResult.data;

    // Check if the end date is too far in the future
    if (endDate === null) {
      return await interaction.followUp({
        content:
          'Failed to recognize the end date of the membership.\n' +
          'Please click the `Modify` button to set the correct date manually.',
        ephemeral: true,
      });
    }
    const validDateResult = Validators.isValidDateInterval(endDate, beginDate);
    if (!validDateResult.success) {
      return await interaction.followUp({
        content: validDateResult.error,
        ephemeral: true,
      });
    }

    // Get guild member
    const member = await Fetchers.fetchGuildMember(guild, userId);
    if (member === null) {
      return await interaction.followUp({
        content: `The user <@${userId}> is not a member of this server.`,
      });
    }

    // Add membership to user
    const addMembershipResult = await MembershipService.addMembership({
      guild,
      membershipRoleDoc,
      member,
      type: 'screenshot',
      begin: beginDate,
      end: endDate,
    });
    if (!addMembershipResult.success) {
      return await interaction.followUp({
        content: addMembershipResult.error,
      });
    }
    const { notified } = addMembershipResult;

    // Mark the request as accepted
    const acceptedActionRow = ActionRows.disabledAcceptedButton();
    await interaction.message.edit({
      content: notified
        ? ''
        : "**[NOTE]** Due to the user's __Privacy Settings__ of this server, **I cannot send DM to notify them.**\nYou might need to notify them yourself.",
      embeds: [
        EmbedBuilder.from(embed)
          .setTitle('✅ [Accepted] ' + (embed.title ?? ''))
          .setFields([
            ...embed.fields.slice(0, endDateIndex),
            {
              name: 'Begin Date',
              value: beginDate.format('YYYY-MM-DD'),
              inline: true,
            },
            {
              name: 'End Date',
              value: endDate.format('YYYY-MM-DD'),
              inline: true,
            },
            ...embed.fields.slice(endDateIndex + 1, embed.fields.length),
            {
              name: 'Verified By',
              value: `<@${moderator.id}>`,
              inline: true,
            },
          ])
          .setImage(null)
          .setColor(Constants.colors.success),
      ],
      components: [acceptedActionRow],
    });
  }
}
