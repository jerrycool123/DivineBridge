import { defaultLocale } from '@divine-bridge/i18n';
import { NextRequest, NextResponse } from 'next/server';

import { discordBotApi } from '../../../../libs/server/discord';
import { getServerTranslation } from '../../../../libs/server/i18n';
import { privateEnv } from '../../../../libs/server/private-env';

export const GET = async (_req: NextRequest, { params }: { params: { language: string } }) => {
  const { language = defaultLocale } = params;
  const { t } = await getServerTranslation(language);
  const result = await discordBotApi.fetchGlobalApplicationCommands(privateEnv.AUTH_DISCORD_ID);
  if (!result.success) {
    // throw new Error(result.error);
    return new Response(JSON.stringify({ error: result.error }), { status: 500 });
  }

  let markdown = `# ${t('docs.title_command-list')}\n\n`;

  const userCommands: typeof result.commands = [];
  const moderatorCommands: typeof result.commands = [];
  for (const command of result.commands) {
    if (command.default_member_permissions === null) {
      userCommands.push(command);
    } else {
      moderatorCommands.push(command);
    }
  }

  for (const { groupName, groupCommands } of [
    { groupName: t('common.User Commands'), groupCommands: userCommands },
    { groupName: t('common.Moderator Commands'), groupCommands: moderatorCommands },
  ]) {
    markdown += `### ${groupName}\n\n<br/>\n\n`;

    for (const command of groupCommands) {
      const commandName =
        command.name_localizations?.[language as keyof typeof command.name_localizations] ??
        command.name;
      const commandDescription =
        command.description_localizations?.[
          language as keyof typeof command.description_localizations
        ] ?? command.description;

      markdown += `##### \`/${commandName}\`\n`;
      markdown += `${commandDescription}\n\n`;

      if (command.options !== undefined && command.options.length > 0) {
        markdown += `<u>${t('web.Command Options')}</u>\n`;
        command.options.forEach((option) => {
          const optionName =
            option.name_localizations?.[language as keyof typeof option.name_localizations] ??
            option.name;
          const optionDescription =
            option.description_localizations?.[
              language as keyof typeof option.description_localizations
            ] ?? option.description;

          markdown += `- ${option.required === true ? '<span class="text-danger">*</span>' : ''}\`${optionName}\`: ${optionDescription}\n`;
          if (
            'autocomplete' in option &&
            option.autocomplete === false &&
            option.choices !== undefined &&
            option.choices.length > 0
          ) {
            markdown += `  - Choices:\n`;
            option.choices.forEach((choice) => {
              const choiceName =
                choice.name_localizations?.[language as keyof typeof choice.name_localizations] ??
                choice.name;

              markdown += `    - ${choiceName}\n`;
            });
          }
        });
      }
      markdown += '\n<br />\n\n';
    }
  }

  return new NextResponse(markdown, { status: 200 });
};
