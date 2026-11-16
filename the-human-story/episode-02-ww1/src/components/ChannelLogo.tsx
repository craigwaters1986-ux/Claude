// Channel logo — permanent top-left watermark on every episode (user rule, 2026-11-16).
// Source: production/branding/logo-a.png (circular crop in public/branding/logo.png).
// Keep the top-left safe zone (x < 170, y < 150) free of other on-screen text.
import React from 'react';
import {Img, staticFile} from 'remotion';

export const LOGO = {x: 32, y: 28, size: 104, opacity: 0.92} as const;

export const ChannelLogo: React.FC = () => (
  <Img
    src={staticFile('branding/logo.png')}
    style={{
      position: 'absolute',
      left: LOGO.x,
      top: LOGO.y,
      width: LOGO.size,
      height: LOGO.size,
      opacity: LOGO.opacity,
      filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.45))',
      pointerEvents: 'none',
    }}
  />
);
