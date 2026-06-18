export function BallIcon({ size = 24, ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 2C12 2 9 6 9 12C9 18 12 22 12 22" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 2C12 2 15 6 15 12C15 18 12 22 12 22" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 12H22" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.5 7H20.5" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.6" />
      <path d="M3.5 17H20.5" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.6" />
    </svg>
  )
}

export function TrophyIcon({ size = 24, ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M8 21H16M12 17V21M5 3H3C3 3 3 8 6 10M19 3H21C21 3 21 8 18 10M7 3H17V11C17 14.3137 14.7614 17 12 17C9.23858 17 7 14.3137 7 11V3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ChipIcon({ size = 24, ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 3V7M12 17V21M3 12H7M17 12H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5.636 5.636L8.464 8.464M15.536 15.536L18.364 18.364M18.364 5.636L15.536 8.464M8.464 15.536L5.636 18.364" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

export function BankIcon({ size = 24, ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M3 21H21M3 10H21M5 10V21M19 10V21M12 3L21 10H3L12 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="9" y="14" width="6" height="7" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export function UserIcon({ size = 24, ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export function ShieldIcon({ size = 24, ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M12 3L4 6V12C4 16.4183 7.58172 20 12 21C16.4183 20 20 16.4183 20 12V6L12 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function StadiumIcon({ size = 24, ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...p}>
      <ellipse cx="12" cy="12" rx="9" ry="5" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="12" cy="12" rx="5" ry="2.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M3 12V16C3 18.7614 7.02944 21 12 21C16.9706 21 21 18.7614 21 16V12" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export function ClockIcon({ size = 24, ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 7V12L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ArrowUpIcon({ size = 24, ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M12 19V5M5 12L12 5L19 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ArrowDownIcon({ size = 24, ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M12 5V19M19 12L12 19L5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function CheckIcon({ size = 24, ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M5 12L10 17L19 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function XIcon({ size = 24, ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function PlusIcon({ size = 24, ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function MenuIcon({ size = 24, ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function LogoutIcon({ size = 24, ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 17L21 12L16 7M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function SettingsIcon({ size = 24, ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function WorldIcon({ size = 24, ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 2C12 2 8 7 8 12C8 17 12 22 12 22C12 22 16 17 16 12C16 7 12 2 12 2Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 12H22" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export function FilterIcon({ size = 24, ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M3 6H21M7 12H17M11 18H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function LoanIcon({ size = 24, ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 5V9M10 7H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4 20C4 17.2386 7.58172 15 12 15C14.0736 15 15.9712 15.4832 17.4321 16.2692" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M17 19L19 21L23 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function AlertIcon({ size = 24, ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M10.2898 3.86L1.81978 18C1.64514 18.3024 1.55268 18.6453 1.55177 18.9945C1.55086 19.3437 1.64153 19.6871 1.81456 19.9905C1.98758 20.2939 2.23683 20.5468 2.53773 20.7239C2.83863 20.901 3.18058 20.9962 3.52978 21H20.4698C20.819 20.9962 21.1609 20.901 21.4618 20.7239C21.7627 20.5468 22.012 20.2939 22.185 19.9905C22.358 19.6871 22.4487 19.3437 22.4478 18.9945C22.4469 18.6453 22.3544 18.3024 22.1798 18L13.7098 3.86C13.5315 3.56631 13.2805 3.32332 12.981 3.15469C12.6814 2.98605 12.3435 2.89726 11.9998 2.89726C11.6561 2.89726 11.3182 2.98605 11.0186 3.15469C10.7191 3.32332 10.4681 3.56631 10.2898 3.86Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 9V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="17" r="0.5" fill="currentColor" stroke="currentColor" strokeWidth="1" />
    </svg>
  )
}
