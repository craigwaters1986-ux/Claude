// s06 shots that use the shared kit build (Capitol set, flag): TEMPORARY placeholders until the kit lands.
import React from 'react';
import {Frame} from '../kit/Shots';
export const CapitolShot: React.FC<{f: number; d: number}> = () => <Frame bg="#9CC4D8"><rect width={1920} height={1080} fill="#9CC4D8" /></Frame>;
export const SumterFlag: React.FC<{f: number; x: number; y: number; lower: number}> = () => null;
