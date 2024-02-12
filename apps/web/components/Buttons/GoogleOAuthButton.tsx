import { HTMLAttributes } from 'react';

const GoogleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    width="46"
    height="46"
    viewBox="0 0 46 46"
  >
    <defs>
      <filter
        id="filter-1"
        width="200%"
        height="200%"
        x="-50%"
        y="-50%"
        filterUnits="objectBoundingBox"
      >
        <feOffset dy="1" in="SourceAlpha" result="shadowOffsetOuter1"></feOffset>
        <feGaussianBlur
          in="shadowOffsetOuter1"
          result="shadowBlurOuter1"
          stdDeviation="0.5"
        ></feGaussianBlur>
        <feColorMatrix
          in="shadowBlurOuter1"
          result="shadowMatrixOuter1"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.168 0"
        ></feColorMatrix>
        <feOffset in="SourceAlpha" result="shadowOffsetOuter2"></feOffset>
        <feGaussianBlur
          in="shadowOffsetOuter2"
          result="shadowBlurOuter2"
          stdDeviation="0.5"
        ></feGaussianBlur>
        <feColorMatrix
          in="shadowBlurOuter2"
          result="shadowMatrixOuter2"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.084 0"
        ></feColorMatrix>
        <feMerge>
          <feMergeNode in="shadowMatrixOuter1"></feMergeNode>
          <feMergeNode in="shadowMatrixOuter2"></feMergeNode>
          <feMergeNode in="SourceGraphic"></feMergeNode>
        </feMerge>
      </filter>
      <rect id="path-2" width="40" height="40" x="0" y="0" rx="2"></rect>
      <rect id="path-3" width="38" height="38" x="5" y="5" rx="1"></rect>
    </defs>
    <g fill="none" fillRule="evenodd" stroke="none" strokeWidth="1">
      <g transform="translate(-1 -1)">
        <g filter="url(#filter-1)" transform="translate(4 4)">
          <g>
            <use fill="#4285F4" xlinkHref="#path-2"></use>
            <use xlinkHref="#path-2"></use>
            <use xlinkHref="#path-2"></use>
            <use xlinkHref="#path-2"></use>
          </g>
        </g>
        <g>
          <use fill="#FFF" xlinkHref="#path-3"></use>
          <use xlinkHref="#path-3"></use>
          <use xlinkHref="#path-3"></use>
          <use xlinkHref="#path-3"></use>
        </g>
        <g transform="translate(15 15)">
          <path
            fill="#4285F4"
            d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
          ></path>
          <path
            fill="#34A853"
            d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
          ></path>
          <path
            fill="#FBBC05"
            d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
          ></path>
          <path
            fill="#EA4335"
            d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
          ></path>
          <path d="M0 0h18v18H0V0z"></path>
        </g>
      </g>
    </g>
  </svg>
);

const GoogleOAuthButton = ({ className, style, ...props }: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      role="button"
      className={`btn-custom user-select-none position-relative d-flex align-items-center text-white fs-7 ${
        className ?? ''
      }`}
      style={{
        borderRadius: '2px',
        height: '40px',
        maxWidth: '240px',
        backgroundColor: '#4285F4',
        fontFamily: "'Roboto', sans-serif",
        fontWeight: 500,
        ...style,
      }}
      {...props}
    >
      <div className="flex-shrink-0 position-relative start-0" style={{ width: '40px' }}>
        <div className="position-absolute top-50 start-50 translate-middle">
          <GoogleIcon />
        </div>
      </div>
      <div className="flex-grow-1 fs-7 d-flex justify-content-center align-items-center">
        Sign in with Google
      </div>
    </div>
  );
};

export default GoogleOAuthButton;
