import Svg, { Path, Ellipse, Circle } from 'react-native-svg';
import { cute } from '@/theme/cute';

/**
 * The Slimora sprout — the same character as the app launcher icon, drawn as
 * vectors so it stays crisp at any size. Geometry matches
 * assets/images/icon.png exactly; the viewBox crops to the character's bounds
 * so it can sit on any background instead of the icon's butter square.
 */
export function SproutMascot({
  size = 220,
  body = cute.mint,
  face = cute.ink,
}: {
  size?: number;
  body?: string;
  face?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="105 240 918 918">
      {/* Leaves sit behind the body so the seed overlaps their bases. */}
      <Path
        d="M 555 470 C 640 322 806 292 906 326 C 884 462 720 524 570 502 Z"
        fill={body}
        stroke={body}
        strokeWidth={44}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <Path
        d="M 555 470 C 470 322 304 292 204 326 C 226 462 390 524 540 502 Z"
        fill={body}
        stroke={body}
        strokeWidth={44}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <Ellipse cx={555} cy={792} rx={390} ry={336} fill={body} />
      <Circle cx={408} cy={782} r={56} fill={face} />
      <Circle cx={702} cy={782} r={56} fill={face} />
      <Ellipse cx={555} cy={916} rx={36} ry={24} fill={face} />
    </Svg>
  );
}
