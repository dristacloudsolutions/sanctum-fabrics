'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ZoomIn, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import type { ProductImage, ProductVideo, ProductVariant } from '@/lib/dristaService';
import SmartFitImage from '../../components/SmartFitImage';

const LENS_SIZE = 160; // px — the magnifier's visible diameter
const ZOOM_FACTOR = 2.5;

// Images and videos share one strip/lightbox so a shopper browses them as a
// single set, in the order the admin uploaded them — video thumbnails don't
// have a poster frame available, so they get a fixed dark "Play" tile instead.
type MediaItem =
  | { kind: 'image'; url: string; alt?: string }
  | { kind: 'video'; url: string; title?: string };

// A short "Teal Green, Free Size" style label from a variant's attributes,
// skipping the paired "<Key> Hex" companion values a color picker writes
// alongside the name — used as this thumbnail's alt text.
function variantLabel(variant: ProductVariant): string | undefined {
  const values = Object.entries(variant.attributes || {})
    .filter(([k]) => !k.toLowerCase().trim().endsWith('hex'))
    .map(([, v]) => v)
    .filter(Boolean);
  return values.length ? values.join(', ') : undefined;
}

export default function ProductGallery({
  images,
  videos = [],
  variants = [],
  productName,
  overrideImageUrl,
}: {
  images: ProductImage[];
  videos?: ProductVideo[];
  variants?: ProductVariant[];
  productName: string;
  overrideImageUrl?: string;
}) {
  const productImages = images.filter((img) => img.url);
  const seenUrls = new Set(productImages.map((img) => img.url));
  // Every active variant's own photo joins the strip alongside the product's
  // general photos — a shopper browsing colors/sizes can see every option's
  // look without having to pick each one from the panel first. Skips a
  // variant photo that's identical to one already in the product gallery.
  const variantImages = variants
    .filter((v) => v.is_active && v.image_url)
    .filter((v) => {
      // Also dedupes two variants that happen to share the exact same photo,
      // not just against the product's own images.
      if (seenUrls.has(v.image_url!)) return false;
      seenUrls.add(v.image_url!);
      return true;
    })
    .map((v): MediaItem => ({ kind: 'image', url: v.image_url!, alt: variantLabel(v) || productName }));

  const media: MediaItem[] = [
    ...productImages.map((img): MediaItem => ({ kind: 'image', url: img.url!, alt: img.alt_text })),
    ...variantImages,
    ...videos.filter((vid) => vid.url).map((vid): MediaItem => ({ kind: 'video', url: vid.url!, title: vid.title })),
  ];

  const findMediaIndex = (url?: string) => (url ? media.findIndex((m) => m.kind === 'image' && m.url === url) : -1);

  // Land on whichever variant's photo was selected on the way in (see
  // productUrl's `variant` query param), falling back to the image flagged
  // `is_primary` (matching what the product card shows) rather than just
  // array index 0 — the admin doesn't necessarily upload the primary photo
  // first, so this kept opening on a different picture than the one the
  // shopper clicked from the card.
  const initialIndex = (() => {
    const overrideIdx = findMediaIndex(overrideImageUrl);
    if (overrideIdx !== -1) return overrideIdx;
    return Math.max(0, productImages.findIndex((img) => img.is_primary));
  })();
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  // A shopper picking a different color/size in the panel afterwards should
  // still jump the gallery to that variant's photo — but once here, thumbnail
  // clicks browse freely instead of the override permanently pinning one photo
  // (that used to make every other variant's photo unclickable while any
  // variant was selected).
  useEffect(() => {
    const idx = findMediaIndex(overrideImageUrl);
    if (idx !== -1) setActiveIndex(idx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overrideImageUrl]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  // Portaling to document.body needs a client-side check (SSR has no DOM) —
  // this also sidesteps whatever ancestor was turning our `fixed` lightbox
  // into something scroll-bound, clipping the right-side Next button.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [isMagnifying, setIsMagnifying] = useState(false);
  // The magnifier lens maps cursor position straight onto the container's own
  // rect, which only lines up with the photo when it fills the box
  // edge-to-edge (`cover`) — once SmartFitImage falls back to `contain` for a
  // badly-mismatched aspect ratio, the photo no longer fills that rect, so
  // the lens is disabled for that image instead of magnifying empty padding.
  const [activeImageFit, setActiveImageFit] = useState<'cover' | 'contain'>('cover');
  const canMagnify = activeImageFit === 'cover';
  // bgW/bgH are the container's own rendered size × ZOOM_FACTOR — background-size
  // must be expressed in px against that, not a lens-relative %, otherwise the
  // "zoomed" image renders smaller than the real photo (an accidental zoom OUT).
  const [lens, setLens] = useState({ px: 0, py: 0, bgW: 0, bgH: 0 });
  const mainImageRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = mainImageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    setLens({
      px: Math.max(0, Math.min(rect.width, px)),
      py: Math.max(0, Math.min(rect.height, py)),
      bgW: rect.width * ZOOM_FACTOR,
      bgH: rect.height * ZOOM_FACTOR,
    });
  };

  const activeMedia = media[activeIndex];
  const activeUrl = activeMedia?.kind === 'image' ? activeMedia.url : undefined;
  const activeIsVideo = activeMedia?.kind === 'video';
  // Keys the crossfade transition — changes whenever the displayed image does,
  // regardless of whether that came from the thumbnail strip or a variant swap.
  const activeKey = `idx-${activeIndex}`;

  const lightboxMedia = media.length > 0 ? media[activeIndex] : undefined;
  const canNavigate = media.length > 1;
  const goNext = useCallback(() => setActiveIndex((i) => (i + 1) % media.length), [media.length]);
  const goPrev = useCallback(() => setActiveIndex((i) => (i - 1 + media.length) % media.length), [media.length]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      else if (e.key === 'ArrowRight' && canNavigate) goNext();
      else if (e.key === 'ArrowLeft' && canNavigate) goPrev();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxOpen, canNavigate, goNext, goPrev]);

  if (!activeUrl && !activeIsVideo && media.length === 0) {
    return (
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-[color:var(--cream)]">
        <div className="flex h-full items-center justify-center text-sm text-[color:var(--ink)]/40">
          No image yet
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Mobile: swipeable carousel — a fixed-width vertical thumbnail rail
          eats too much horizontal space on narrow screens, and there's no
          hover for the magnifier lens anyway, so swipe is the native pattern here. */}
      <div className="md:hidden">
        <MobileMediaGrid
          media={media}
          productName={productName}
          onOpenLightbox={(i) => { setActiveIndex(i); setLightboxOpen(true); }}
        />
      </div>

      <div className="hidden gap-3 md:flex">
        {media.length > 1 && (
          <div className="flex max-h-[560px] w-16 shrink-0 flex-col gap-2 overflow-y-auto">
            {media.map((item, i) => {
              const isActive = activeIndex === i;
              return (
                <motion.button
                  key={item.url || i}
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative h-20 w-full shrink-0 overflow-hidden rounded-lg bg-[color:var(--ink)]/80"
                >
                  {item.kind === 'image' ? (
                    <Image src={item.url} alt={item.alt || productName} fill unoptimized className="object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center">
                      <Play size={20} className="text-white" fill="white" />
                    </span>
                  )}
                  {isActive && (
                    <motion.span
                      layoutId="gallery-thumb-active"
                      className="absolute inset-0 rounded-lg border-2 border-[color:var(--accent)]"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        )}

        <div
          ref={mainImageRef}
          className="group relative aspect-[4/5] flex-1 overflow-hidden rounded-2xl bg-[color:var(--cream)]"
          onMouseEnter={() => !activeIsVideo && canMagnify && setIsMagnifying(true)}
          onMouseLeave={() => setIsMagnifying(false)}
          onMouseMove={activeIsVideo ? undefined : handleMouseMove}
        >
          {activeIsVideo && activeMedia?.kind === 'video' ? (
            <video
              key={activeMedia.url}
              src={activeMedia.url}
              controls
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <>
              <AnimatePresence mode="wait">
                {activeUrl && (
                  <motion.div
                    key={activeKey}
                    initial={{ opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="absolute inset-0"
                  >
                    {/* This catalog mixes portrait product photography with
                        landscape AI-generated mockups — a fixed object-fit
                        either crops the landscape ones to an unrecognizable
                        sliver (`cover`) or leaves a big empty gap (`contain`).
                        SmartFitImage measures each photo and picks per-image. */}
                    <SmartFitImage
                      src={activeUrl}
                      alt={productName}
                      boxAspect={4 / 5}
                      unoptimized
                      onFitChange={setActiveImageFit}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Magnifier lens — follows the cursor on desktop hover, showing a
                  zoomed-in crop of the exact point under it. Hidden on touch
                  devices (no hover), where tap-to-open the lightbox still works,
                  and on any photo SmartFitImage had to letterbox (see above). */}
              {isMagnifying && canMagnify && activeUrl && (
                <div
                  className="pointer-events-none absolute z-10 hidden rounded-full border-2 border-white shadow-[0_4px_24px_rgba(0,0,0,0.35)] lg:block"
                  style={{
                    width: LENS_SIZE,
                    height: LENS_SIZE,
                    left: lens.px - LENS_SIZE / 2,
                    top: lens.py - LENS_SIZE / 2,
                    backgroundImage: `url(${activeUrl})`,
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: `${lens.bgW}px ${lens.bgH}px`,
                    backgroundPosition: `${-(lens.px * ZOOM_FACTOR - LENS_SIZE / 2)}px ${-(lens.py * ZOOM_FACTOR - LENS_SIZE / 2)}px`,
                  }}
                />
              )}

              <button
                type="button"
                onClick={() => activeUrl && setLightboxOpen(true)}
                className="absolute inset-0 z-0"
                aria-label="Open full-screen image"
              />
              <span className="pointer-events-none absolute bottom-3 right-3 z-10 flex items-center gap-1 rounded-full bg-black/50 px-3 py-1.5 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                <ZoomIn size={13} /> Zoom
              </span>
            </>
          )}
        </div>
      </div>

      {mounted && createPortal(
        <AnimatePresence>
          {lightboxOpen && lightboxMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setLightboxOpen(false)}
          >
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute right-4 top-4 text-white/70 transition-colors hover:text-white"
              aria-label="Close"
            >
              <X size={24} />
            </button>

            {canNavigate && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); goPrev(); }}
                  className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white shadow-lg transition-colors hover:bg-black/70 sm:left-4"
                  aria-label="Previous item"
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); goNext(); }}
                  className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white shadow-lg transition-colors hover:bg-black/70 sm:right-4"
                  aria-label="Next item"
                >
                  <ChevronRight size={22} />
                </button>
                <span className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white">
                  {activeIndex + 1} / {media.length}
                </span>
              </>
            )}

            <motion.div
              key={lightboxMedia.url}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative h-full max-h-[85vh] w-full max-w-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              {lightboxMedia.kind === 'video' ? (
                <video src={lightboxMedia.url} controls autoPlay className="h-full w-full object-contain" />
              ) : (
                <Image src={lightboxMedia.url} alt={productName} fill unoptimized className="object-contain" />
              )}
            </motion.div>
          </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

// Static 2-column grid showing every product photo (and video tile) at once,
// instead of a one-at-a-time swipe carousel — the shopper sees the full set
// on scroll without having to swipe through each one, and taps any tile to
// open the same full-screen lightbox (already index-aware) at that item.
function MobileMediaGrid({
  media,
  productName,
  onOpenLightbox,
}: {
  media: MediaItem[];
  productName: string;
  onOpenLightbox: (index: number) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-1 overflow-hidden rounded-2xl">
      {media.map((item, i) => (
        <button
          key={item.url || i}
          type="button"
          onClick={() => onOpenLightbox(i)}
          className="relative aspect-[3/4] w-full overflow-hidden bg-[color:var(--cream)]"
          aria-label={item.kind === 'video' ? `Play video ${i + 1}` : `View image ${i + 1} of ${media.length}`}
        >
          {item.kind === 'image' ? (
            <SmartFitImage src={item.url} alt={item.alt || productName} boxAspect={3 / 4} unoptimized />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-[color:var(--ink)]/80">
              <Play size={28} className="text-white" fill="white" />
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
