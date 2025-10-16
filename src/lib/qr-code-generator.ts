
'use client';

export const generateQrCodeImage = async (
    shopName: string, 
    amount: string, 
    upiId: string
): Promise<File | null> => {
    
    const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(shopName.trim())}&am=${amount}&cu=INR`;
    const QRCode = (await import('qrcode')).default;

    try {
        const svgString = await QRCode.toString(upiUrl, { type: 'svg' });
        const decodedSvg = unescape(encodeURIComponent(svgString));
        const url = 'data:image/svg+xml;base64,' + btoa(decodedSvg);

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = async () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error("Could not get canvas context"));
                    return;
                }

                const qrSize = 256;
                const padding = 20;
                const topSectionHeight = 80;
                const bottomPadding = 20;

                canvas.width = qrSize + padding * 2;
                canvas.height = qrSize + topSectionHeight + bottomPadding;

                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.fillStyle = 'black';
                ctx.font = 'bold 24px Poppins, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(shopName, canvas.width / 2, 40);

                ctx.font = 'bold 36px Poppins, sans-serif';
                ctx.fillText(`₹${amount}`, canvas.width / 2, 80);

                ctx.drawImage(img, padding, topSectionHeight, qrSize, qrSize);

                const pngDataUrl = canvas.toDataURL('image/png');
                const response = await fetch(pngDataUrl);
                const blob = await response.blob();
                const file = new File([blob], 'payment-qr.png', { type: 'image/png' });
                resolve(file);
            };
            img.onerror = (e) => {
                console.error("Image loading failed:", e);
                reject(new Error("Could not create QR code image for sharing."));
            };
            img.src = url;
        });

    } catch (error) {
        console.error("QR Code generation failed", error);
        return null;
    }
}
