import React from 'react';
import { Icon as Iconify } from '@iconify/react';
export default function Icon({
  name,
  image = false, // force image rendering even if name is an Iconify id
  set = 'auto',
  size = 20,
  color,
  className = '',
  title,
  role = 'img',
  aspectRatio, // e.g., '1:1', '16:9', 1.5
  objectFit = 'contain', // contain | cover | fill | none | scale-down
  rounded = false, // boolean | 'sm'|'md'|'lg'|'xl'|'2xl'|'3xl'|'full'
  ...rest
}) {
  if (!name || typeof name !== 'string') {
    return null;
  }

  const normalizeRatio = (val) => {
    if (val == null || val === '') return undefined;
    if (typeof val === 'number') return String(val);
    const s = String(val).trim();
    const parts = s.replace(/\s+/g, '').split(/[:/]/);
    if (parts.length === 2 && parts[0] && parts[1]) {
      return `${parts[0]} / ${parts[1]}`;
    }
    return undefined;
  };

  const isIconify = !image && (set === 'iconify' || (set === 'auto' && name.includes(':')));

  if (isIconify) {
    return (
      <Iconify
        icon={name}
        width={size}
        height={size}
        color={color}
        className={className}
        title={title}
        role={role}
        {...rest}
      />
    );
  }

  const roundedClass = (() => {
    if (rounded === true) return 'rounded-full';
    if (!rounded || rounded === false) return '';
    const map = new Set(['sm','md','lg','xl','2xl','3xl','full']);
    const key = String(rounded).trim();
    if (key === 'none') return '';
    return map.has(key) ? `rounded-${key === 'full' ? 'full' : key}` : '';
  })();

  // Non-Iconify or forced image: render as image using `name` as src
  return (
    <img
      src={name}
      width={size}
      height={aspectRatio ? undefined : size}
      alt={title || ''}
      title={title}
      className={`inline-block align-middle ${roundedClass} ${className}`.trim()}
      style={{
        objectFit,
        aspectRatio: normalizeRatio(aspectRatio),
      }}
      role={role}
      {...rest}
    />
  );
}
