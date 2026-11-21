# Episode 4 (ep04-lincoln) plan config for tools/build_plan.py (PLAN_CONFIG=this file).
# Section windows are the script's chapter windows (600 s total). Hold keys are phrases that end a narration group.
# Silent beats follow the storyboard; the last slot of each section absorbs the remainder.
# Phase D2 (ElevenLabs narration, 525 s): windows rebalanced so the title plate (4.8 s beat), the clock at 7:22
# (3.6 s beat) and the end card (6.7 s beat) keep room; chapter cards are 2.5 s.
# John North narration (528.7 s at tempo 1.04): about 2.6 s moved from chapters 1-4, 9 and 10 into 5-8, whose
# narration grew most; every remainder beat stays at least 1.5 s.
TARGET_MS = 600000
TITLE = 'Episode 4 (ep04-lincoln)'
SECTIONS = {
 's01': ('Two minutes', 31555,
   [('open', 'Cold open: the Bliss copy under lamplight, the first line writes on before the narrator speaks.', 3000)], {},
   [('title', 'The page dissolves into the title plate ABRAHAM LINCOLN over the cabin woods; riser and impact.', None)]),
 's02': ('A cabin in Kentucky', 53295,
   [('card', 'Chapter title plate.', 2500), ('scene', 'Winter woods in Kentucky, the log cabin, chimney smoke; crane down.', 3000)],
   {'An axe was put into his hands at once': [('scene', 'The boy chops; the light fades to dusk over a small grave under trees (sombre).', 4500)]},
   [('scene', 'The boy reads by firelight; push to his face; match cut on the fire.', None)]),
 's03': ('The rail-splitter', 49392,
   [('card', 'Chapter title plate.', 2500), ('scene', 'Wide river at dawn, the flatboat drifting, before the narrator speaks.', 2000)], {},
   [('scene', 'Close-up: quiet pride as he is chosen captain. No battle.', None)]),
 's04': ('Lawyer and politician', 64864,
   [('card', 'Chapter title plate.', 2500)],
   {'He met Mary Todd at a ball': [('scene', 'The ball: Mary and Lincoln meet, over the shoulder each way.', 1600)],
    'He rode the legal circuit for years': [('scene', 'Horseback in the rain on the circuit.', 1600)]},
   [('scene', 'The Capitol (pre-dome) and a desk in the House.', None)]),
 's05': ('A house divided', 67930,
   [('card', 'Chapter title plate.', 2500)], {},
   [('scene', 'Cooper Union: the hall holds on the readable line.', None)]),
 's06': ('President of a breaking country', 57355,
   [('card', 'Chapter title plate.', 2500)], {},
   [('scene', 'Fort Sumter at night: the flag comes down on the beat. Timpani.', None)]),
 's07': ('War and emancipation', 92270,
   [('card', 'Chapter title plate.', 2500)],
   {'In November, Lincoln helped dedicate a cemetery there': [('scene', 'Gettysburg cemetery rows at dusk, slow crane (sombre).', 3500)]},
   [('doc', 'Hold on the opening words of the Bliss copy.', None)]),
 's08': ('Malice toward none', 65718,
   [('card', 'Chapter title plate.', 2500)],
   {'which he had pressed for': [('scene', 'The tally board turns: 119 to 56.', 2000)]},
   [('scene', 'Empty fields at dusk under the estimated toll (sombre).', None)]),
 's09': ('Ford\'s Theatre', 49001,
   [('card', 'Chapter title plate.', 2500)],
   {'Lincoln never regained consciousness': [('scene', 'The empty chair in the box; no event shown.', 2000)]},
   [('scene', 'The clock at 7:22, date card 15 April 1865; light shifts to morning.', None)]),
 's10': ('Legacy', 68620,
   [('card', 'Chapter title plate.', 2500)],
   {'Slavery was abolished in the United States': [('doc', 'Hold on the Thirteenth Amendment, Section 1.', 2300)]},
   [('end', 'Hold on the last line of the Bliss copy, then the end card (music up).', None)]),
}
_Y = {'oh nine': 1809, 'thirty': 1830, 'thirty-four': 1834, 'thirty-seven': 1837, 'forty-one': 1841, 'forty-two': 1842,
      'forty-six': 1846, 'fifty-four': 1854, 'fifty-eight': 1858, 'sixty': 1860, 'sixty-one': 1861, 'sixty-two': 1862,
      'sixty-three': 1863, 'sixty-four': 1864, 'sixty-five': 1865}
YEARS = [(r'eighteen ' + k, str(v)) for k, v in _Y.items()] + [(r'nineteen twenty-two', '1922')]
