import { createImage, getRadianAngle } from './imageUtils';

export const getCroppedImg = async (imageSrc, pixelCrop, rotation = 0) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const safeArea = Math.max(image.width, image.height) * 2;
    canvas.width = safeArea;
    canvas.height = safeArea;

    ctx.translate(safeArea / 2, safeArea / 2);
    ctx.rotate(getRadianAngle(rotation));
    ctx.translate(-safeArea / 2, -safeArea / 2);

    ctx.drawImage(image, (safeArea - image.width) / 2, (safeArea - image.height) / 2);

    const data = ctx.getImageData(0, 0, safeArea, safeArea);

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.putImageData(
        data,
        Math.round(-safeArea / 2 + image.width / 2 - pixelCrop.x),
        Math.round(-safeArea / 2 + image.height / 2 - pixelCrop.y)
    );

    return new Promise((resolve) => {
        canvas.toBlob((file) => {
            resolve(new File([file], 'cropped.jpeg', { type: 'image/jpeg' }));
        }, 'image/jpeg');
    });
};
