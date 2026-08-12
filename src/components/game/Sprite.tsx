/**
 * Sprite — renders one frame of a horizontal sprite strip and flickers through
 * the frames on an interval to give a hand-drawn idle animation.
 *
 * A 32px-tall strip is shown inside a clipped box; we slide the sheet left by
 * frameW * frame. Display size is upscaled (scale prop) for a chunky cute look.
 */
import { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { View } from 'react-native';

interface Props {
  src: number;
  frames: number;
  frameW: number;
  frameH: number;
  scale?: number; // upscale factor
  fps?: number;
  style?: object;
}

export function Sprite({ src, frames, frameW, frameH, scale = 2, fps = 8, style }: Props) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setFrame((f) => (f + 1) % frames), 1000 / fps);
    return () => clearInterval(id);
  }, [frames, fps]);

  const w = frameW * scale;
  const h = frameH * scale;

  return (
    <View style={[{ width: w, height: h, overflow: 'hidden' }, style]}>
      <Image
        source={src}
        style={{
          width: frameW * frames * scale,
          height: h,
          transform: [{ translateX: -frame * w }],
        }}
        contentFit="contain"
        cachePolicy="memory-disk"
      />
    </View>
  );
}
