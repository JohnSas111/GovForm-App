// Limits for zooming and dragging the scanned form, so the picture can never
// be dragged away from the viewing area.

// Highest zoom level (5 = five times bigger). Beyond this the text is blurry.
export const MAX_ZOOM = 5;

// Size the picture is drawn at inside a box when it is scaled to fit
// without cropping (the same as resizeMode="contain").
export const fitSize = (
  imageWidth: number,
  imageHeight: number,
  boxWidth: number,
  boxHeight: number,
): { width: number; height: number } => {
  if (imageWidth <= 0 || imageHeight <= 0 || boxWidth <= 0 || boxHeight <= 0) {
    return { width: 0, height: 0 };
  }
  const imageAspect = imageWidth / imageHeight;
  const boxAspect = boxWidth / boxHeight;
  return boxAspect > imageAspect
    ? { width: boxHeight * imageAspect, height: boxHeight }
    : { width: boxWidth, height: boxWidth / imageAspect };
};

// Keeps a drag offset inside the allowed range for the current zoom.
// At zoom 1 (or whenever the picture is not bigger than the viewing area on
// this side) there is nothing to drag, so the offset is 0. Zoomed in, you can
// drag only far enough to reach each edge of the picture.
export const clampPan = (
  offset: number,
  zoom: number,
  imageSize: number,
  viewSize: number,
): number => {
  "worklet";
  const limit = Math.max(0, (imageSize * zoom - viewSize) / 2);
  return Math.min(limit, Math.max(-limit, offset));
};
