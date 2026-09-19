'use client';

import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';

// This catalog mixes two very different kinds of source photos: real product
// photography (portrait, ~3:4) and AI-generated mockups (landscape, ~4:3).
// A single fixed `object-fit` can't handle both — `cover` crops a landscape
// photo into a portrait card down to a narrow, often badly-framed vertical
// sliver, while `contain` leaves a big empty gap around every close-to-square
// photo. This measures the actual loaded image once and only lets `cover`
// crop it when the image's own aspect ratio is already close to the card's —
// anything further off falls back to `contain` so nothing gets crops out.
const ASPECT_MISMATCH_TOLERANCE = 0.35;

type SmartFitImageProps = Omit<ImageProps, 'fill' | 'objectFit' | 'className'> & {
  /** width / height of the box this image fills, e.g. 3/4 for aspect-[3/4]. */
  boxAspect: number;
  className?: string;
  /** Told whenever the chosen fit changes — e.g. so a caller can disable a
   * hover-zoom magnifier that assumes the photo fills the box edge-to-edge,
   * which isn't true once this falls back to `contain`. */
  onFitChange?: (fit: 'cover' | 'contain') => void;
};

export default function SmartFitImage({ boxAspect, className, onLoad, onFitChange, ...imageProps }: SmartFitImageProps) {
  const [fit, setFit] = useState<'cover' | 'contain'>('cover');

  return (
    // eslint-disable-next-line jsx-a11y/alt-text -- alt comes through ...imageProps and is a required, typed prop on ImageProps
    <Image
      {...imageProps}
      fill
      onLoad={(e) => {
        const img = e.currentTarget;
        if (img.naturalWidth && img.naturalHeight) {
          const imageAspect = img.naturalWidth / img.naturalHeight;
          const relativeDiff = Math.abs(imageAspect - boxAspect) / boxAspect;
          const nextFit = relativeDiff > ASPECT_MISMATCH_TOLERANCE ? 'contain' : 'cover';
          setFit(nextFit);
          onFitChange?.(nextFit);
        }
        onLoad?.(e);
      }}
      className={`${fit === 'cover' ? 'object-cover' : 'object-contain'} ${className || ''}`}
    />
  );
}
