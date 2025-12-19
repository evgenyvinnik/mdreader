import type { JSX } from 'react';

interface IconProps {
  readonly size?: number;
  readonly className?: string;
}

const DEFAULT_SIZE = 18;

function createSvgWrapper(
  size: number,
  className: string | undefined,
  children: JSX.Element | JSX.Element[]
): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  );
}

export function NewDocumentIcon({
  size = DEFAULT_SIZE,
  className,
}: IconProps): JSX.Element {
  return createSvgWrapper(
    size,
    className,
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="18" x2="12" y2="12" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </>
  );
}

export function FolderIcon({
  size = DEFAULT_SIZE,
  className,
}: IconProps): JSX.Element {
  return createSvgWrapper(
    size,
    className,
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  );
}

export function SaveIcon({
  size = DEFAULT_SIZE,
  className,
}: IconProps): JSX.Element {
  return createSvgWrapper(
    size,
    className,
    <>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </>
  );
}

export function LockIcon({
  size = DEFAULT_SIZE,
  className,
}: IconProps): JSX.Element {
  return createSvgWrapper(
    size,
    className,
    <>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </>
  );
}

export function UnlockIcon({
  size = DEFAULT_SIZE,
  className,
}: IconProps): JSX.Element {
  return createSvgWrapper(
    size,
    className,
    <>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </>
  );
}

export function EditIcon({
  size = DEFAULT_SIZE,
  className,
}: IconProps): JSX.Element {
  return createSvgWrapper(
    size,
    className,
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  );
}

export function SplitViewIcon({
  size = DEFAULT_SIZE,
  className,
}: IconProps): JSX.Element {
  return createSvgWrapper(
    size,
    className,
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="12" y1="3" x2="12" y2="21" />
    </>
  );
}

export function EyeIcon({
  size = DEFAULT_SIZE,
  className,
}: IconProps): JSX.Element {
  return createSvgWrapper(
    size,
    className,
    <>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </>
  );
}

export function SunIcon({
  size = DEFAULT_SIZE,
  className,
}: IconProps): JSX.Element {
  return createSvgWrapper(
    size,
    className,
    <>
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </>
  );
}

export function MoonIcon({
  size = DEFAULT_SIZE,
  className,
}: IconProps): JSX.Element {
  return createSvgWrapper(
    size,
    className,
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  );
}

export function DocumentIcon({
  size = DEFAULT_SIZE,
  className,
}: IconProps): JSX.Element {
  return createSvgWrapper(
    size,
    className,
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </>
  );
}

export function ChevronDownIcon({
  size = DEFAULT_SIZE,
  className,
}: IconProps): JSX.Element {
  return createSvgWrapper(
    size,
    className,
    <polyline points="6 9 12 15 18 9" />
  );
}

export function SearchIcon({
  size = DEFAULT_SIZE,
  className,
}: IconProps): JSX.Element {
  return createSvgWrapper(
    size,
    className,
    <>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </>
  );
}

export function TrashIcon({
  size = DEFAULT_SIZE,
  className,
}: IconProps): JSX.Element {
  return createSvgWrapper(
    size,
    className,
    <>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </>
  );
}

export function CutIcon({
  size = DEFAULT_SIZE,
  className,
}: IconProps): JSX.Element {
  return createSvgWrapper(
    size,
    className,
    <>
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <line x1="20" y1="4" x2="8.12" y2="15.88" />
      <line x1="14.47" y1="14.48" x2="20" y2="20" />
      <line x1="8.12" y1="8.12" x2="12" y2="12" />
    </>
  );
}

export function CopyIcon({
  size = DEFAULT_SIZE,
  className,
}: IconProps): JSX.Element {
  return createSvgWrapper(
    size,
    className,
    <>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </>
  );
}

export function PasteIcon({
  size = DEFAULT_SIZE,
  className,
}: IconProps): JSX.Element {
  return createSvgWrapper(
    size,
    className,
    <>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </>
  );
}
