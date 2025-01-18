import Image from 'next/image';
import Link from 'next/link';

import styles from './Home.module.css';

import DiscordLoginButton from '../../../components/Buttons/DiscordLoginButton';
import { getDiscordBotInviteLink } from '../../../libs/common/discord';
import { getServerTranslation } from '../../../libs/server/i18n';
import { WithI18nParams } from '../../../types/common';

export default async function HomePage(props: WithI18nParams) {
  const params = await props.params;
  const { t } = await getServerTranslation(params.lng);

  return (
    <main className="text-white">
      <section className={styles.heroSection}>
        <div className="container h-100">
          <div className="row h-100">
            <div className="col-xl-8 col-lg-9 h-100 d-flex flex-column justify-content-center">
              <h1 className={`mb-4 fw-700 poppins ${styles.heroText}`}>Divine Bridge</h1>
              <h2 className={`mb-4 fs-5 ${styles.subText}`}>
                <span className="d-inline-block">{t('web.headline_1')}&nbsp;</span>
                <span className={`d-inline-block fw-600 ${styles.youtube}`}>
                  {t('web.YouTube Channel Membership')}
                </span>
                <span className="d-inline-block">&nbsp;{t('web.and')}&nbsp;</span>
                <span className={`d-inline-block fw-600 ${styles.discord}`}>
                  {t('web.Discord Role')}
                </span>
                <span className="d-inline-block">&nbsp;{t('web.headline_2')}</span>
              </h2>
              <div>
                <DiscordLoginButton lng={params.lng} />
              </div>
            </div>
            <div
              className={`col-xl-4 col-lg-3 h-100 flex-column justify-content-center align-items-center ${styles.heroImage}`}
            >
              <Image src="/certification.svg" alt="" width={200} height={200} />
            </div>
          </div>
        </div>
      </section>

      <section className={styles.featuresSection}>
        <div className="container">
          <div className="row mb-3">
            <div>
              <h2 className="text-center poppins">{t('web.What is Divine Bridge')}</h2>
            </div>
          </div>
          <div className="row d-flex justify-content-center mb-5">
            <div className={`col-lg-8 ${styles.introduction}`}>
              <p className="mb-2 fs-5">
                {t(
                  'web.Divine Bridge is a Discord bot verifying YouTube channel memberships and link them with Discord server roles',
                )}{' '}
                {t('web.It currently supports')}{' '}
                <span className="text-white fw-500">{t('common.Screenshot Mode')}</span>{' '}
                {t('web.and')} <span className="text-white fw-500">{t('common.Auth Mode')}</span>.
              </p>
            </div>
          </div>
          <div className="row mb-5 d-flex justify-content-center">
            <div className="col-lg-5 d-flex flex-column align-items-center">
              <h2 className="poppins mb-4">{t('common.Screenshot Mode')}</h2>
              <div className={styles.modeIntro}>
                <p className={`mb-2 ${styles.introduction}`}>
                  {t('common.You need to verify your membership every month')}
                </p>
                <p className={styles.introduction}>
                  {t('web.Provide a screenshot of your')}{' '}
                  <Link
                    className="link fw-500"
                    href="https://www.youtube.com/paid_memberships"
                    target="_blank"
                  >
                    {t('web.Memberships')}
                  </Link>{' '}
                  {t('web.page on YouTube')} {t('web.Divine Bridge use OCR')}
                  <Link
                    className="link fw-500"
                    href="https://wikipedia.org/wiki/Optical_character_recognition"
                    target="_blank"
                  >
                    {t('web.Optical Character Recognition')}
                  </Link>
                  {t('web.to recognize the next billing date')}{' '}
                  {t(
                    'web.and send your screenshot with the recognized date to the server moderators to manually approve it',
                  )}
                </p>
              </div>
              <Image
                className="object-fit-contain"
                src="/ocr.png"
                width={240}
                height={240}
                alt=""
              />
            </div>
            <div className="col-lg-5 d-flex flex-column align-items-center">
              <h2 className="poppins mb-4">{t('common.Auth Mode')}</h2>
              <div className={styles.modeIntro}>
                <p className={`mb-2 ${styles.introduction}`}>
                  {t('common.You need to sign in with YouTube and verify your membership once')}
                </p>
                <p className={styles.introduction}>
                  {t(
                    'web.Divine Bridge will securely store your authorized OAuth credentials and automatically check your membership via YouTube API periodically',
                  )}
                </p>
              </div>
              <Image
                className="object-fit-contain"
                src="/oauth.png"
                width={240}
                height={240}
                alt=""
              />
            </div>
          </div>
          <div className="row mb-3">
            <div>
              <h2 className="text-center poppins">{t('web.Why Divine Bridge')}</h2>
            </div>
          </div>
          <div className="row d-flex justify-content-center">
            <div className={`col-lg-8 ${styles.introduction}`}>
              <p>
                {t('web.The idea of the')}{' '}
                <span className="text-white fw-500">{t('common.Screenshot Mode')}</span>{' '}
                {t('web.came from')}{' '}
                <Link
                  className="link fw-500"
                  href="https://github.com/nonJerry/VeraBot"
                  target="_blank"
                >
                  nonJerry/VeraBot
                </Link>
                .
              </p>
              <p>
                {t('web.The idea of the')}{' '}
                <span className="text-white fw-500">{t('common.Auth Mode')}</span>{' '}
                {t('web.came from')}{' '}
                <Link
                  className="link fw-500"
                  href="https://github.com/member-gentei/member-gentei"
                  target="_blank"
                >
                  member-gentei/member-gentei
                </Link>
                .
              </p>
              <p>{t('web.Both verification methods have pros and cons')}</p>
              <p>
                {t('web.The')}{' '}
                <span className="text-white fw-500">{t('common.Screenshot Mode')}</span>{' '}
                {t('web.screenshot_mode_pros_and_cons')}
              </p>
              <p>
                {t('web.The')} <span className="text-white fw-500">{t('common.Auth Mode')}</span>{' '}
                {t('web.auth_mode_pros_and_cons_1')}{' '}
                <span className="text-danger fw-bold">
                  {t('web.google_oauth_youtube_force_ssl_permissions')}
                </span>
                {t('web.auth_mode_pros_and_cons_2')}
              </p>
              <p>
                {t(
                  'web.Considering the issues above Divine Bridge implements both modes You can choose the one you prefer',
                )}
              </p>
              <p>
                {t('web.When you use')}{' '}
                <span className="text-white fw-500">{t('common.Screenshot Mode')}</span>
                {t(
                  'web.we do not store or backup your screenshots you sent to the bot We only sent them to the channel in your server and let the moderators manually verify your membership',
                )}
              </p>
              <p>
                {t('web.If you choose to use the')}{' '}
                <span className="text-white fw-500">{t('common.Auth Mode')}</span>
                {t(
                  'web.we will store your OAuth credentials in our database with proper encryption and we will never use them for any other purpose',
                )}{' '}
                {t('web.You can also')}{' '}
                <span className="text-warning fw-500">{t('web.revoke your authorization')}</span>{' '}
                {t('web.at any time on our dashboard or your')}{' '}
                <Link
                  className="link fw-500"
                  href="https://support.google.com/accounts/answer/13533235"
                  target="_blank"
                >
                  {t('web.Google Account Settings page')}
                </Link>
                {t('web.revoke_end_text')}
              </p>
              <p>
                {t(
                  'web.Divine Bridge is open-sourced and has MIT License We also host a public Discord bot',
                )}{' '}
                <Link className="link fw-500" href={getDiscordBotInviteLink()} target="_blank">
                  Divine Bridge
                </Link>
                {t(
                  'web.Any bug reports and pull requests are welcome If you have any questions or suggestions feel free to open an issue on our Github repository',
                )}{' '}
                <Link className="link fw-500" href="https://github.com/jerrycool123/DivineBridge">
                  jerrycool123/DivineBridge
                </Link>
                {t('web.or join our')}{' '}
                <Link className="link fw-500" href="https://discord.gg/ZSfxRnzFNy">
                  {t('web.Discord Support Server')}
                </Link>{' '}
                {t('web.ask_for_help_end')}
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
