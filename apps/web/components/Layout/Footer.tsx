'use client';

import GithubOutlined from '@ant-design/icons/GithubOutlined';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import styles from './Footer.module.css';

import { useClientTranslation } from '../../libs/client/i18n';

export default function Footer() {
  const { lng } = useParams();
  const { t } = useClientTranslation(lng);

  return (
    <div className={`d-flex flex-column align-items-center text-white ${styles.footer}`}>
      <div className={`mt-4 mb-2 poppins fw-700 ${styles.brand}`}>Divine Bridge</div>
      <div className="mb-1 d-flex">
        <Link className="link" href="/terms">
          {t('web.Terms of Use')}
        </Link>
        <span className="mx-2">|</span>
        <Link className="link" href="/privacy">
          {t('web.Privacy Policy')}
        </Link>
      </div>
      <div className="mb-2 d-flex align-items-center">
        <GithubOutlined className="me-2" />
        <Link className="link fs-7" href="https://github.com/jerrycool123/DivineBridge">
          jerrycool123/DivineBridge
        </Link>
      </div>
      <div className={`mb-4 fs-7 ${styles.source}`}>
        {t('web.The website used some images provided by')}{' '}
        <Link className="link fs-7" href="https://www.irasutoya.com/" target="_blank">
          いらすとや
        </Link>
      </div>
    </div>
  );
}
