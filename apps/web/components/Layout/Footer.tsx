import GithubOutlined from '@ant-design/icons/GithubOutlined';
import Link from 'next/link';

import styles from './Footer.module.css';

export default function Footer() {
  return (
    <div className={`d-flex flex-column align-items-center text-white ${styles.footer}`}>
      <div className={`mt-4 mb-2 poppins fw-700 ${styles.brand}`}>Divine Bridge</div>
      <div className="mb-1 d-flex">
        <Link className="link" href="/terms">
          Terms of Use
        </Link>
        <span className="mx-2">|</span>
        <Link className="link" href="/privacy">
          Privacy Policy
        </Link>
      </div>
      <div className="mb-4 d-flex align-items-center">
        <GithubOutlined className="me-2" />
        <Link className="link fs-7" href="https://github.com/jerrycool123/DivineBridge">
          jerrycool123/DivineBridge
        </Link>
      </div>
    </div>
  );
}
