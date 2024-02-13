'use client';

import { signIn } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { DiscordLoginButton } from 'react-social-login-buttons';

import styles from '../../styles/Home.module.css';

export default function Home() {
  return (
    <main className="text-white">
      <section className={styles.heroSection}>
        <div className="container h-100">
          <div className="row h-100">
            <div className="col-xl-8 col-lg-9 h-100 d-flex flex-column justify-content-center">
              <h1 className={`mb-4 fw-700 poppins ${styles.heroText}`}>Divine Bridge</h1>
              <h2 className={`mb-4 fs-5 ${styles.subText}`}>
                <span className="d-inline-block">A bridge between&nbsp;</span>
                <span className={`d-inline-block fw-600 ${styles.youtube}`}>
                  YouTube Channel Membership
                </span>
                <span className="d-inline-block">&nbsp;and&nbsp;</span>
                <span className={`d-inline-block fw-600 ${styles.discord}`}>Discord Role</span>.
              </h2>
              <div>
                <DiscordLoginButton
                  text="Sign in with Discord"
                  className={`${styles.C2AButton} text-nowrap`}
                  onClick={() => signIn('discord', { callbackUrl: '/dashboard' })}
                />
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
              <h2 className="text-center poppins">What is Divine Bridge</h2>
            </div>
          </div>
          <div className="row d-flex justify-content-center mb-5">
            <div className={`col-lg-8 ${styles.introduction}`}>
              <p className="mb-2 fs-5">
                Divine Bridge is a Discord bot verifying YouTube channel memberships and link them
                with Discord server roles. It currently supports{' '}
                <span className="text-white fw-500">Screenshot Mode</span> and{' '}
                <span className="text-white fw-500">Auth Mode</span>.
              </p>
            </div>
          </div>
          <div className="row mb-5 d-flex justify-content-center">
            <div className="col-lg-5 d-flex flex-column align-items-center">
              <h2 className="poppins mb-4">Screenshot Mode</h2>
              <div className={styles.modeIntro}>
                <p className={`mb-2 ${styles.introduction}`}>
                  You need to verify your membership every month.
                </p>
                <p className={styles.introduction}>
                  Provide a screenshot of your{' '}
                  <Link
                    className="link fw-500"
                    href="https://www.youtube.com/paid_memberships"
                    target="_blank"
                  >
                    Memberships
                  </Link>{' '}
                  page on YouTube. Divine Bridge use OCR(
                  <Link
                    className="link fw-500"
                    href="https://wikipedia.org/wiki/Optical_character_recognition"
                    target="_blank"
                  >
                    Optical Character Recognition
                  </Link>
                  ) to recognize the next billing date, and send your screenshot with the recognized
                  date to the server moderators to manually approve it.
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
              <h2 className="poppins mb-4">Auth Mode</h2>
              <div className={styles.modeIntro}>
                <p className={`mb-2 ${styles.introduction}`}>
                  You need to sign in with YouTube and verify your membership once.
                </p>
                <p className={styles.introduction}>
                  Divine Bridge will securely store your authorized OAuth credentials, and
                  automatically check your membership via YouTube API periodically.
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
              <h2 className="text-center poppins">Why Divine Bridge</h2>
            </div>
          </div>
          <div className="row d-flex justify-content-center">
            <div className={`col-lg-8 ${styles.introduction}`}>
              <p>
                The idea of the <span className="text-white fw-500">Screenshot Mode</span> came from{' '}
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
                The idea of the <span className="text-white fw-500">Auth Mode</span> came from{' '}
                <Link
                  className="link fw-500"
                  href="https://github.com/member-gentei/member-gentei"
                  target="_blank"
                >
                  member-gentei/member-gentei
                </Link>
                .
              </p>
              <p>Both verification methods have pros and cons.</p>
              <p>
                The <span className="text-white fw-500">Screenshot</span> one is not automated, and
                you need to provide your proof every month. The screenshot might contains sensitive
                information, like your personal information or your payment details. Besides, the
                server moderators need to verify everyone&apos;s request, which could still be a
                heavy burden in long-term point of view.
              </p>
              <p>
                The <span className="text-white fw-500">Auth</span> one is automated, but it
                requires you to authorize the App to{' '}
                <span className="text-danger fw-500">
                  See, edit, and permanently delete your YouTube videos, ratings, comments and
                  captions
                </span>
                . While the App just needs to check if you could read comments from a members-only
                video on your behalf in order to verify your membership, it still needs to be
                authorized with this permission since YouTube API does not provide any other
                permission scope that is more flexible than this. That&apos;s why some users are
                reluctant to use this method.
              </p>
              <p>
                Considering the issues above, Divine Bridge implements both modes. You can choose
                the one you prefer.
              </p>
              <p>
                When you use <span className="text-white fw-500">Screenshot Mode</span>, we do not
                store or backup your screenshots you sent to the bot. We only sent them to the log
                channel in your server, and we will delete them after the server moderators approve
                or reject them.
              </p>
              <p>
                If you choose to use the <span className="text-white fw-500">Auth Mode</span>, we
                will store your OAuth credentials in our database with proper encryption, and we
                will never use them for any other purpose. You can also{' '}
                <span className="text-warning fw-500">revoke your authorization</span> at any time
                on our dashboard or your{' '}
                <Link
                  className="link fw-500"
                  href="https://support.google.com/accounts/answer/13533235"
                  target="_blank"
                >
                  Google Account Settings page
                </Link>
                .
              </p>
              <p>
                Divine Bridge is open-sourced and has MIT License. We also host a public Discord bot{' '}
                <Link
                  className="link fw-500"
                  href="https://discord.com/api/oauth2/authorize?client_id=1091609534310645810&permissions=268435456&scope=bot"
                >
                  Divine Bridge
                </Link>
                . Any bug reports and pull requests are welcome. If you have any questions or
                suggestions, feel free to open an issue on our Github repository{' '}
                <Link className="link fw-500" href="https://github.com/jerrycool123/DivineBridge">
                  jerrycool123/DivineBridge
                </Link>
                , or join our{' '}
                <Link className="link fw-500" href="https://discord.gg/u4HXTH5wKV">
                  Discord Support Server
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
