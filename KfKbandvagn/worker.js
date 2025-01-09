// worker.js
self.onmessage = function (e) {
    const { preloadedPixels, player, lightnessVals } = e.data;
    const pixels = preloadedPixels.slice();
    const bigint = parseInt(player.color.substring(1), 16);
    const red = (bigint >> 16) & 255;
    const green = (bigint >> 8) & 255;
    const blue = bigint & 255;
    
    const { h, s } = rgbToHsl(red, green, blue);
    const alpha = Math.floor(255 * Math.min(player.lives/3 , 1));

    if (player.lives > 0) {
        for (let i = 0; i < pixels.length; i += 4) {
            const { r: newR, g: newG, b: newB } = hslToRgb(h, s, lightnessVals[i / 4]);
            pixels[i] = newR; // Red
            pixels[i + 1] = newG; // Green
            pixels[i + 2] = newB; // Blue
            pixels[i + 3] = pixels[i + 3] > 0 ? alpha : 0; // Alpha
        }
    } else {
        for (let i = 0; i < pixels.length; i += 4) {
            pixels[i + 3] = pixels[i + 3] > 0 ? 20 : 0; // Alpha
        }
    }

    self.postMessage({ pixels });
};

function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;

    if (max === min) return { h: 0, s: 0, l }; // Achromatic

    const delta = max - min;
    const s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    let h;
    switch (max) {
        case r: h = (g - b) / delta + (g < b ? 6 : 0); break;
        case g: h = (b - r) / delta + 2; break;
        case b: h = (r - g) / delta + 4; break;
    }

    h /= 6;
    return { h: h * 360, s: s * 100, l: l * 100 };
};

function hslToRgb (h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;

    const hueToRgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    const r = hueToRgb(p, q, h + 1 / 3);
    const g = hueToRgb(p, q, h);
    const b = hueToRgb(p, q, h - 1 / 3);

    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255),
    };
};

  