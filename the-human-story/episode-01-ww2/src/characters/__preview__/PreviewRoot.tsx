import React from 'react';
import {Composition} from 'remotion';
import {loadFonts} from '../../components/Fonts';
import {SheetAsia, SheetEurope, SheetPoses, SheetCrowd, SheetExpressions} from './CharacterSheet';

loadFonts();
const sheets = {SheetAsia, SheetEurope, SheetPoses, SheetCrowd, SheetExpressions};

export const PreviewRoot: React.FC = () => (
  <>
    {Object.entries(sheets).map(([id, comp]) => (
      <Composition key={id} id={id} component={comp} durationInFrames={150} fps={30} width={1920} height={1080} />
    ))}
  </>
);
