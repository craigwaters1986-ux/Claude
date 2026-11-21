# Episode 3 narration direction

Use the channel's British male Kokoro bm_george voice. The local PyTorch sample uses the same Kokoro-82M weights and voice identity, with a different inference runtime from Episode 2. This avoids the ONNX runtime whose telemetry connection was blocked during the earlier rebuild.

Render related sentences together so their intonation carries across the phrase. Start at speed 0.99 and add 0.21 seconds between groups, with 0.34 seconds at paragraph breaks. Preserve natural breaths inside the generated audio. Keep deliberate pauses at changes of scene and after sensitive passages. Do not stretch silences to fill a chapter. Refit the narration and edit together to reach 12:00.

The script has been revised to join repeated short sentences and to read the years as “sixteen oh five” and “sixteen oh six”. Captions retain normal spelling and written dates.

## Pronunciation work

The sample uses phoneme overrides grounded in the following pronunciation references.

| Word | British target | Reference |
| --- | --- | --- |
| Catesby | KAYTS-bee | https://dictionary.cambridge.org/hi/उच्चारण/अंग्रेज़ी/catesby |
| Guy Fawkes | guy forks, without a pronounced r in this accent | https://dictionary.cambridge.org/pronunciation/english/guy-fawkes-night |
| Hoxton | HOCK-stuhn | https://dictionary.cambridge.org/pronunciation/english/hoxton |
| Warwickshire | WORR-ik-shuh | https://dictionary.cambridge.org/pronunciation/english/warwickshire |
| Salisbury | SAWLZ-buh-ree | https://dictionary.cambridge.org/pronunciation/english/salisbury |

The actual sample contains Catesby, Fawkes, Warwickshire, Monteagle and Hoxton. Monteagle currently uses the British phonemiser's default and needs a reliable name-specific pronunciation reference. Also verify Cecil, Knyvett, Tresham, Holbeach and Ralph Ewens before the full narration is approved. The phoneme audit records what was sent to the model. Dictionary lookup and signal checks alone do not establish how the finished audio sounds.
