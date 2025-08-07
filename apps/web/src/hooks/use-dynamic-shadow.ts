import { useState, useEffect } from 'react';
import ColorThief from 'colorthief';

interface UseDynamicShadowOptions {
    shadowIntensity?: number;
    shadowBlur?: number;
    shadowOffset?: number;
}

export const useDynamicShadow = (
    imageUrl?: string,
    options: UseDynamicShadowOptions = {}
) => {
    const {
        shadowIntensity = 0.3,
        shadowBlur = 12,
        shadowOffset = 6
    } = options;

    const [shadowStyle, setShadowStyle] = useState<string>('');

    useEffect(() => {
        if (!imageUrl) {
            setShadowStyle('');
            return;
        }

        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            try {
                const colorThief = new ColorThief();
                const [r, g, b] = colorThief.getColor(img);
                const shadow = `drop-shadow(${shadowOffset}px ${shadowOffset}px ${shadowBlur}px rgba(${r}, ${g}, ${b}, ${shadowIntensity}))`;
                setShadowStyle(shadow);
            } catch (error) {
                setShadowStyle('');
            }
        };

        img.onerror = () => setShadowStyle('');
        img.src = imageUrl;
    }, [imageUrl, shadowIntensity, shadowBlur, shadowOffset]);

    return shadowStyle;
};