# Episode 4 pronunciation log (ep04-lincoln)

Voice: Kokoro `bm_george`, speed 0.99, espeak-ng `en-gb` phonemes (approved series voice). Recorded 20 November 2026 (Phase C).

| Name | Phonemes used | Decision and evidence |
| --- | --- | --- |
| Appomattox | `ˌapəmˈatəks` (override) | Default phonemiser gave `ɐpˈɒmɐtˌɒks` (a-POM-a-tox). Standard US pronunciation is app-uh-MAT-uhks (NPS, Appomattox Court House). Override in `scripts/voice_sample.py`. |
| John T. Stuart | `dʒˈɒn tˈiː stjˈuːət` (override) | With the default text the full stop after "T." reached the model and the initial was swallowed (faster-whisper heard "from Stuart"). After the override the recogniser hears "John T. Stewart". |
| Robert E. Lee | `ɹˈɒbət ˈiː lˈiː` (override) | Same initial problem; also the sentence splitter broke the group at "E." (fixed: the splitter now ignores single-capital initials). |
| Ulysses S. Grant | `juːlˈɪsiːz ˈɛs ɡɹˈɑːnt` (override) | Same initial problem. British vowel in Grant kept (series voice). |
| Petersen | default `pˈiːtɜːsən` | PEE-ter-sen, as NPS (Petersen House). The recogniser writes "Peterson" (homophone). Listen once. |
| Grace Bedell | default `bɪdˈɛl` | buh-DELL. Listen once. |
| Sumter | default `sˈʌmtə` | SUM-ter. OK. |
| Gettysburg, Springfield, New Salem, Kentucky, Illinois, Mississippi, Charleston, Cooper Union, Douglass, Whig | default | Checked against the espeak output; standard. |

Unresolved: nobody has listened through yet. Listen for Petersen, Bedell and Appomattox in Phase D.
