import React from 'react';

// Reserve the bottom 164 pixels in every captioned shot. Wrap editorially so
// names and short phrases stay together; one- and two-line cues share a baseline grid.
export function CaptionBand({lines}:{lines: [string] | [string,string]}) {
  return <g>
    <rect y="916" width="1920" height="164" fill="#292a29"/>
    <path d="M0 916H1920" stroke="#c0a573" strokeWidth="5"/>
    <text x="960" textAnchor="middle" fontFamily="DejaVu Sans, sans-serif" fontSize="45" fill="#fff6e5">
      {lines.map((line,i)=><tspan key={i} x="960" y={(lines.length===1?1010:979)+i*55}>{line}</tspan>)}
    </text>
  </g>;
}
