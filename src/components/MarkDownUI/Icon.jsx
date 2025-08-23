import React, { useEffect, useRef, useState } from 'react';
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
  rounded, // boolean | 'sm'|'md'|'lg'|'xl'|'2xl'|'3xl'|'full' | undefined (si es imagen y undefined -> 'full')
  url,
  link, // alias of url
  linkTarget = '_blank',
  linkRel = 'noopener noreferrer',
  // Nuevos
  children,
  side, // 'left' | 'right' | 'center' (si hay children, default efectivo: 'center')
  containerClass = '',
  textClass = '',
  gap = 4, // gap-x-*
  // Multi-icono
  items,
  itemsDirection = 'row', // 'row' | 'col'
  itemsGap = 2, // gap-x-2 por defecto
  itemsContainerClass = '',
  // Filtros (inline CSS)
  invert,
  grayscale,
  brightness,
  contrast,
  saturate,
  sepia,
  hueRotate,
  blur,
  filter, // string custom
  ...rest
}) {
  // Si vienen múltiples íconos, renderizarlos (y permitir children)
  if (Array.isArray(items) && items.length > 0) {
    // Detect if any item uses percentage size
    const anyPercent = items.some(it => it && typeof it.size === 'string' && /%\s*$/.test(String(it.size)));
    const outerRef = useRef(null);
    const [basePx, setBasePx] = useState(undefined);

    useEffect(() => {
      if (!anyPercent) return;
      const el = outerRef.current;
      const parent = el?.parentElement;
      if (!parent) return;
      const update = () => setBasePx(parent.clientWidth || undefined);
      update();
      const ro = new ResizeObserver(update);
      ro.observe(parent);
      return () => ro.disconnect();
    }, [anyPercent]);
    const dirClass = itemsDirection === 'col' ? 'flex-col' : 'flex-row';
    const itemsGapClass = typeof itemsGap === 'number' ? `gap-${itemsGap}` : (itemsGap || 'gap-2');

    const itemsNode = (
      <span ref={outerRef} className={`mdx-inline-icons inline-flex ${dirClass} ${itemsGapClass} ${itemsContainerClass}`.trim()}>
        {items.map((it, idx) => {
          if (!it || typeof it !== 'object') return null;
          const { items: _ignoreNested, key, size: itSize, ...itProps } = it; // prevenir anidación recursiva
          const k = key ?? idx;
          let computedSize = itSize;
          if (anyPercent && basePx && typeof itSize === 'string' && /%\s*$/.test(itSize)) {
            const p = parseFloat(itSize);
            if (!isNaN(p)) computedSize = Math.round((p / 100) * basePx);
          }
          return <Icon key={k} {...rest} {...itProps} size={computedSize} />;
        })}
      </span>
    );

    const hasChildrenInItems = React.Children.count(children) > 0;
    if (!hasChildrenInItems) {
      const s = side; // sin default: inline por defecto
      if (!s) return itemsNode; // inline, fluye con el texto
      if (s === 'center') return <div ref={outerRef} className={`${containerClass}`.trim()} style={{ display: 'flex', justifyContent: 'center' }}>{itemsNode}</div>;
      if (s === 'right') return <div ref={outerRef} className={`${containerClass}`.trim()} style={{ display: 'flex', justifyContent: 'flex-end' }}>{itemsNode}</div>;
      // left
      return <div ref={outerRef} className={`${containerClass}`.trim()} style={{ display: 'inline-flex' }}>{itemsNode}</div>;
    }

    const s = side || 'center';
    const outerGapClass = typeof gap === 'number' ? `gap-${gap}` : (gap || 'gap-4');

    if (s === 'center') {
      return (
        <div ref={outerRef} className={`flex flex-col items-center ${outerGapClass} ${containerClass}`.trim()}>
          <div className="flex justify-center">{itemsNode}</div>
          <div className={`w-full text-center ${textClass}`.trim()}>{children}</div>
        </div>
      );
    }

    const row = s === 'right' ? (
      <>
        <div className={`min-w-0 ${textClass}`.trim()}>{children}</div>
        <div className="ml-auto">{itemsNode}</div>
      </>
    ) : (
      <>
        {itemsNode}
        <div className={`min-w-0 ${textClass}`.trim()}>{children}</div>
      </>
    );

    return (
      <div ref={outerRef} className={`flex items-center w-full ${outerGapClass} ${containerClass}`.trim()}>
        {row}
      </div>
    );
  }

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

  const toCssVal = (v, suffix) => {
    if (v == null || v === false) return undefined;
    if (typeof v === 'number') return suffix ? `${v}${suffix}` : String(v);
    const s = String(v).trim();
    return suffix && /^-?\d+(\.\d+)?$/.test(s) ? `${s}${suffix}` : s;
  };

  const filterStyle = (() => {
    const parts = [];
    if (invert != null) parts.push(`invert(${toCssVal(invert, typeof invert === 'number' && invert <= 1 ? '' : '%')})`);
    if (grayscale != null) parts.push(`grayscale(${toCssVal(grayscale, typeof grayscale === 'number' && grayscale <= 1 ? '' : '%')})`);
    if (brightness != null) parts.push(`brightness(${toCssVal(brightness, typeof brightness === 'number' && brightness <= 1 ? '' : '%')})`);
    if (contrast != null) parts.push(`contrast(${toCssVal(contrast, typeof contrast === 'number' && contrast <= 1 ? '' : '%')})`);
    if (saturate != null) parts.push(`saturate(${toCssVal(saturate, typeof saturate === 'number' && saturate <= 1 ? '' : '%')})`);
    if (sepia != null) parts.push(`sepia(${toCssVal(sepia, typeof sepia === 'number' && sepia <= 1 ? '' : '%')})`);
    if (hueRotate != null) parts.push(`hue-rotate(${toCssVal(hueRotate, 'deg')})`);
    if (blur != null) parts.push(`blur(${toCssVal(blur, typeof blur === 'number' ? 'px' : '')})`);
    if (filter) parts.push(String(filter));
    return parts.length ? parts.join(' ') : undefined;
  })();

  const roundedEff = (rounded === undefined) ? (image ? 'full' : false) : rounded;

  const roundedClass = (() => {
    if (roundedEff === true) return 'rounded-full';
    if (!roundedEff || roundedEff === false) return '';
    const map = new Set(['sm','md','lg','xl','2xl','3xl','full']);
    const key = String(roundedEff).trim();
    if (key === 'none') return '';
    return map.has(key) ? `rounded-${key === 'full' ? 'full' : key}` : '';
  })();

  const href = url || link;
  const isPercent = typeof size === 'string' && /%\s*$/.test(String(size));

  // Build the inner element first
  const element = isIconify ? (
    <Iconify
      icon={name}
      width={isPercent ? '100%' : size}
      height={aspectRatio ? '100%' : (isPercent ? undefined : size)}
      color={color ?? '#fff'}
      className={`inline-block align-middle invert-[.88] dark:invert-[.12] ${className}`.trim()}
      title={title}
      role={role}
      style={{ display: 'block', pointerEvents: href ? 'none' : undefined, filter: filterStyle }}
      {...rest}
    />
  ) : (
    <img
      src={name}
      width={isPercent ? '100%' : '100%'}
      height={aspectRatio ? '100%' : (isPercent ? 'auto' : '100%')}
      alt={title || ''}
      title={title}
      className={`inline-block align-middle ${roundedClass} ${className}`.trim()}
      style={{
        display: 'block',
        margin: 0,
        objectFit,
        width: '100%',
        height: aspectRatio ? '100%' : (isPercent ? 'auto' : '100%'),
        pointerEvents: href ? 'none' : undefined,
        filter: filterStyle,
        borderRadius: (() => {
          if (roundedEff === true) return '9999px';
          if (roundedEff === 'full') return '9999px';
          if (roundedEff === 'none' || roundedEff === false) return '0px';
          if (typeof roundedEff === 'string' && /^(sm|md|lg|xl|2xl|3xl)$/i.test(roundedEff)) return undefined; // lo maneja className
          // Si viene en className (compat)
          if (typeof className === 'string') {
            if (/(^|\s)rounded-none(\s|$)/i.test(className)) return '0px';
            if (/(^|\s)rounded-full(\s|$)/i.test(className)) return '9999px';
          }
          return undefined;
        })(),
      }}
      onClick={undefined}
      role={role}
      {...rest}
    />
  );

  // Wrapper único debe reflejar tamaño; funciona tanto para <a> como para <span>
  const wrapperStyle = (() => {
    const base = { display: 'inline-block', maxWidth: '100%', lineHeight: 0 };
    if (size == null) return base;
    if (isPercent) {
      return {
        ...base,
        width: size,
        // altura auto cuando size es %; si quieren cuadrado, usar aspectRatio
        height: undefined,
        ...(aspectRatio ? { aspectRatio: normalizeRatio(aspectRatio) || '1 / 1' } : {}),
      };
    }
    return { ...base, width: size, height: aspectRatio ? undefined : size, ...(aspectRatio ? { aspectRatio: normalizeRatio(aspectRatio) || '1 / 1' } : {}) };
  })();

  // Envolver el icono (con o sin link)
  const iconNode = href ? (
    <a href={href} target={linkTarget} rel={linkRel} aria-label={title || undefined} style={wrapperStyle}>
      {element}
    </a>
  ) : (
    <span style={wrapperStyle}>{element}</span>
  );

  const hasChildren = React.Children.count(children) > 0;

  // Layout cuando hay contenido (children)
  if (hasChildren) {
    const s = side || 'center';
    const gapClass = typeof gap === 'number' ? `gap-${gap}` : (gap || 'gap-4');

    if (s === 'center') {
      return (
        <div className={`flex flex-col items-center ${gapClass} ${containerClass}`.trim()}>
          {iconNode}
          <div className={`w-full text-center ${textClass}`.trim()}>{children}</div>
        </div>
      );
    }

    const content = s === 'right' ? (
      <>
        <div className={`flex-1 min-w-0 ${textClass}`.trim()}>{children}</div>
        {iconNode}
      </>
    ) : (
      <>
        {iconNode}
        <div className={`flex-1 min-w-0 ${textClass}`.trim()}>{children}</div>
      </>
    );

    return (
      <div className={`flex items-center ${gapClass} ${containerClass}`.trim()}>
        {content}
      </div>
    );
  }

  // Sin children: mantener comportamiento previo para uso inline, salvo que el usuario
  // especifique 'side' para alinear como las imágenes
  if (side === 'left' || side === 'right' || side === 'center') {
    let sideClass = 'flex justify-start w-full';
    if (side === 'right') sideClass = 'flex justify-end w-full';
    else if (side === 'left') sideClass = 'flex justify-start w-full';
    else sideClass = 'flex justify-center w-full';
    return <div className={`${sideClass} ${containerClass}`.trim()}>{iconNode}</div>;
  }

  // Default inline
  return iconNode;
}
