// Exercise library. Each exercise declares primary/secondary muscles (feeds the
// recovery model + mannequin), equipment, movement pattern (used to find
// alternatives), load increment, joint-stress tags (used by the injury
// safeguards) and Apple Watch rep-tracking support level.
//
// watch: 'supported'    — validated target for the wrist rep counter prototype
//        'experimental' — wrist moves, signal is usable but unvalidated
//        'unsupported'  — wrist is (near) stationary or signal is ambiguous

const E = (id, name, o) => ({
  id, name,
  primary: o.p, secondary: o.s || [],
  equipment: o.eq, pattern: o.pat,
  mechanics: o.m || 'compound',
  incrementKg: o.inc ?? 2.5,
  stress: o.stress || [],
  watch: o.watch || 'unsupported',
  bodyweight: !!o.bw,
  instructions: o.how,
});

export const EXERCISES = [
  // ── Chest
  E('bench', 'Barbell Bench Press', { p: ['chest'], s: ['frontDelts', 'triceps'], eq: ['barbell', 'bench'], pat: 'horizontalPush', stress: ['shoulder'], watch: 'experimental',
    how: ['Lie with eyes under the bar, feet planted, shoulder blades pinched.', 'Lower the bar under control to mid-chest.', 'Press up and slightly back until elbows lock out.'] }),
  E('inclineDb', 'Incline Dumbbell Press', { p: ['chest'], s: ['frontDelts', 'triceps'], eq: ['dumbbell', 'bench'], pat: 'horizontalPush', inc: 2, stress: ['shoulder'], watch: 'experimental',
    how: ['Set the bench to 30°.', 'Lower dumbbells to upper chest with elbows ~45° from torso.', 'Press up, bringing the dumbbells together over the chest.'] }),
  E('dbBench', 'Dumbbell Bench Press', { p: ['chest'], s: ['frontDelts', 'triceps'], eq: ['dumbbell', 'bench'], pat: 'horizontalPush', inc: 2, stress: ['shoulder'], watch: 'experimental',
    how: ['Lie flat with dumbbells at chest level.', 'Press up until arms are extended.', 'Lower slowly to a comfortable stretch.'] }),
  E('cableFly', 'Cable Fly', { p: ['chest'], s: ['frontDelts'], eq: ['cable'], pat: 'chestFly', m: 'isolation', inc: 2.5, watch: 'experimental',
    how: ['Set pulleys at shoulder height and step forward.', 'With a soft elbow bend, sweep the handles together.', 'Return slowly until you feel a stretch across the chest.'] }),
  E('pushup', 'Push-Up', { p: ['chest'], s: ['triceps', 'frontDelts', 'abs'], eq: [], pat: 'horizontalPush', bw: true, inc: 0, stress: ['wrist'],
    how: ['Hands slightly wider than shoulders, body in a straight line.', 'Lower until the chest is just above the floor.', 'Push back up without letting the hips sag.'] }),
  E('dip', 'Parallel Bar Dip', { p: ['chest', 'triceps'], s: ['frontDelts'], eq: ['dipStation'], pat: 'verticalPushDown', bw: true, inc: 2.5, stress: ['shoulder'],
    how: ['Support yourself on straight arms, lean slightly forward.', 'Lower until upper arms are parallel to the floor.', 'Press back to the top.'] }),
  E('machineChest', 'Machine Chest Press', { p: ['chest'], s: ['triceps', 'frontDelts'], eq: ['machine'], pat: 'horizontalPush', inc: 5, watch: 'experimental',
    how: ['Adjust the seat so handles are at mid-chest.', 'Press forward to full extension.', 'Return under control.'] }),

  // ── Back
  E('deadlift', 'Conventional Deadlift', { p: ['hamstrings', 'glutes', 'lowerBack'], s: ['traps', 'forearms', 'quads', 'lats'], eq: ['barbell'], pat: 'hinge', inc: 5, stress: ['lowerBack'],
    how: ['Bar over mid-foot, hinge and grip just outside the knees.', 'Brace hard, push the floor away keeping the bar close.', 'Stand tall, then lower by pushing the hips back.'] }),
  E('row', 'Barbell Row', { p: ['upperBack', 'lats'], s: ['biceps', 'rearDelts', 'lowerBack'], eq: ['barbell'], pat: 'horizontalPull', stress: ['lowerBack'], watch: 'experimental',
    how: ['Hinge to ~45° with a flat back.', 'Row the bar to the lower ribs.', 'Lower with control without losing your torso angle.'] }),
  E('dbRow', 'One-Arm Dumbbell Row', { p: ['lats', 'upperBack'], s: ['biceps', 'rearDelts'], eq: ['dumbbell', 'bench'], pat: 'horizontalPull', inc: 2, watch: 'experimental',
    how: ['Support one knee and hand on a bench.', 'Pull the dumbbell toward your hip.', 'Lower fully to stretch the lat.'] }),
  E('pullup', 'Pull-Up', { p: ['lats'], s: ['biceps', 'upperBack', 'forearms'], eq: ['pullupBar'], pat: 'verticalPull', bw: true, inc: 2.5, stress: ['shoulder'], watch: 'experimental',
    how: ['Hang with an overhand grip slightly wider than shoulders.', 'Pull until the chin clears the bar.', 'Lower to a full hang.'] }),
  E('latPulldown', 'Lat Pulldown', { p: ['lats'], s: ['biceps', 'upperBack'], eq: ['cable'], pat: 'verticalPull', inc: 5, watch: 'experimental',
    how: ['Grip just outside shoulder width, thighs locked under the pad.', 'Pull the bar to the upper chest, driving elbows down.', 'Let the bar rise slowly to full stretch.'] }),
  E('seatedRow', 'Seated Cable Row', { p: ['upperBack', 'lats'], s: ['biceps', 'rearDelts'], eq: ['cable'], pat: 'horizontalPull', inc: 5, watch: 'experimental',
    how: ['Sit tall with a slight knee bend.', 'Row the handle to your stomach, squeezing the shoulder blades.', 'Extend the arms under control.'] }),
  E('invertedRow', 'Inverted Row', { p: ['upperBack', 'lats'], s: ['biceps', 'rearDelts'], eq: ['pullupBar'], pat: 'horizontalPull', bw: true, inc: 0,
    how: ['Hang under a bar at hip height with a straight body.', 'Pull your chest to the bar.', 'Lower to straight arms.'] }),
  E('shrug', 'Dumbbell Shrug', { p: ['traps'], s: ['forearms'], eq: ['dumbbell'], pat: 'shrug', m: 'isolation', inc: 2, watch: 'experimental',
    how: ['Stand tall holding dumbbells at your sides.', 'Raise the shoulders straight up toward the ears.', 'Pause, then lower slowly.'] }),
  E('backExt', 'Back Extension', { p: ['lowerBack'], s: ['glutes', 'hamstrings'], eq: ['bench'], pat: 'hinge', m: 'isolation', inc: 2.5, bw: true, stress: ['lowerBack'],
    how: ['Set the pad just below the hips.', 'Lower the torso with a neutral spine.', 'Raise until the body forms a straight line.'] }),

  // ── Shoulders
  E('ohp', 'Overhead Press', { p: ['frontDelts'], s: ['sideDelts', 'triceps', 'traps'], eq: ['barbell'], pat: 'verticalPush', stress: ['shoulder', 'lowerBack'], watch: 'supported',
    how: ['Bar on the front of the shoulders, glutes squeezed.', 'Press straight up, moving the head back out of the way.', 'Lock out overhead, then lower to the collarbones.'] }),
  E('dbShoulderPress', 'Dumbbell Shoulder Press', { p: ['frontDelts'], s: ['sideDelts', 'triceps'], eq: ['dumbbell'], pat: 'verticalPush', inc: 2, stress: ['shoulder'], watch: 'supported',
    how: ['Sit or stand with dumbbells at shoulder height, palms forward.', 'Press overhead until arms are straight.', 'Lower back to shoulder height.'] }),
  E('lateralRaise', 'Lateral Raise', { p: ['sideDelts'], s: ['traps'], eq: ['dumbbell'], pat: 'lateralRaise', m: 'isolation', inc: 1, watch: 'supported',
    how: ['Hold light dumbbells at your sides.', 'Raise them out to shoulder height, leading with the elbows.', 'Lower slowly — don\'t swing.'] }),
  E('facePull', 'Face Pull', { p: ['rearDelts'], s: ['upperBack', 'traps'], eq: ['cable'], pat: 'rearDelt', m: 'isolation', inc: 2.5, watch: 'experimental',
    how: ['Rope at upper-chest height.', 'Pull toward your face, splitting the rope and rotating the hands back.', 'Return under control.'] }),
  E('reverseFly', 'Reverse Dumbbell Fly', { p: ['rearDelts'], s: ['upperBack'], eq: ['dumbbell'], pat: 'rearDelt', m: 'isolation', inc: 1, watch: 'experimental',
    how: ['Hinge forward with a flat back.', 'Raise the dumbbells out to the sides.', 'Lower slowly.'] }),
  E('pikePushup', 'Pike Push-Up', { p: ['frontDelts'], s: ['triceps', 'sideDelts'], eq: [], pat: 'verticalPush', bw: true, inc: 0, stress: ['shoulder', 'wrist'],
    how: ['Start in a downward-dog shape, hips high.', 'Bend the elbows to lower the head toward the floor.', 'Press back up.'] }),

  // ── Arms
  E('dbCurl', 'Dumbbell Curl', { p: ['biceps'], s: ['forearms'], eq: ['dumbbell'], pat: 'curl', m: 'isolation', inc: 1, watch: 'supported',
    how: ['Stand with dumbbells at your sides, palms forward.', 'Curl up without moving the upper arm.', 'Lower fully under control.'] }),
  E('bbCurl', 'Barbell Curl', { p: ['biceps'], s: ['forearms'], eq: ['barbell'], pat: 'curl', m: 'isolation', inc: 2.5, watch: 'supported',
    how: ['Grip at shoulder width, elbows at your sides.', 'Curl the bar toward the shoulders.', 'Lower to full extension.'] }),
  E('hammerCurl', 'Hammer Curl', { p: ['biceps', 'forearms'], eq: ['dumbbell'], pat: 'curl', m: 'isolation', inc: 1, watch: 'supported',
    how: ['Hold dumbbells with palms facing each other.', 'Curl up, keeping the neutral grip.', 'Lower slowly.'] }),
  E('tricepPushdown', 'Cable Tricep Pushdown', { p: ['triceps'], eq: ['cable'], pat: 'tricepExt', m: 'isolation', inc: 2.5, watch: 'experimental',
    how: ['Elbows pinned to your sides.', 'Push the bar/rope down to full extension.', 'Let it rise until forearms pass parallel.'] }),
  E('skullcrusher', 'EZ-Bar Skull Crusher', { p: ['triceps'], eq: ['barbell', 'bench'], pat: 'tricepExt', m: 'isolation', inc: 2.5, stress: ['elbow'], watch: 'experimental',
    how: ['Lie on a bench, bar over the forehead.', 'Bend only at the elbows to lower the bar.', 'Extend back up.'] }),
  E('ohTricep', 'Overhead Dumbbell Extension', { p: ['triceps'], eq: ['dumbbell'], pat: 'tricepExt', m: 'isolation', inc: 2, stress: ['shoulder', 'elbow'], watch: 'experimental',
    how: ['Hold one dumbbell overhead with both hands.', 'Lower it behind your head.', 'Extend to straight arms.'] }),
  E('diamondPushup', 'Diamond Push-Up', { p: ['triceps'], s: ['chest'], eq: [], pat: 'horizontalPush', bw: true, inc: 0, stress: ['wrist'],
    how: ['Hands together under the chest forming a diamond.', 'Lower with elbows close to the body.', 'Press back up.'] }),

  // ── Legs
  E('squat', 'Barbell Back Squat', { p: ['quads', 'glutes'], s: ['adductors', 'lowerBack', 'hamstrings'], eq: ['barbell', 'rack'], pat: 'squat', inc: 5, stress: ['knee', 'lowerBack'],
    how: ['Bar on the upper back, feet shoulder-width.', 'Brace, sit down and back to at least parallel.', 'Drive up through the whole foot.'] }),
  E('frontSquat', 'Front Squat', { p: ['quads'], s: ['glutes', 'abs', 'upperBack'], eq: ['barbell', 'rack'], pat: 'squat', inc: 2.5, stress: ['knee', 'wrist'],
    how: ['Bar on the front delts, elbows high.', 'Squat with an upright torso.', 'Drive up keeping elbows up.'] }),
  E('gobletSquat', 'Goblet Squat', { p: ['quads', 'glutes'], s: ['adductors', 'abs'], eq: ['dumbbell'], pat: 'squat', inc: 2, stress: ['knee'],
    how: ['Hold a dumbbell at your chest.', 'Squat between your knees, chest up.', 'Stand back up.'] }),
  E('legPress', 'Leg Press', { p: ['quads', 'glutes'], s: ['adductors'], eq: ['machine'], pat: 'squat', inc: 10, stress: ['knee'],
    how: ['Feet shoulder-width on the platform.', 'Lower until knees reach ~90°.', 'Press back without locking the knees hard.'] }),
  E('rdl', 'Romanian Deadlift', { p: ['hamstrings', 'glutes'], s: ['lowerBack', 'forearms'], eq: ['barbell'], pat: 'hinge', inc: 5, stress: ['lowerBack'],
    how: ['Soft knees, push the hips back.', 'Slide the bar down the thighs until you feel a hamstring stretch.', 'Drive the hips forward to stand.'] }),
  E('dbRdl', 'Dumbbell Romanian Deadlift', { p: ['hamstrings', 'glutes'], s: ['lowerBack'], eq: ['dumbbell'], pat: 'hinge', inc: 2, stress: ['lowerBack'],
    how: ['Hold dumbbells in front of the thighs.', 'Hinge back keeping them close to the legs.', 'Return to standing.'] }),
  E('lunge', 'Walking Lunge', { p: ['quads', 'glutes'], s: ['hamstrings', 'adductors'], eq: ['dumbbell'], pat: 'lunge', inc: 2, stress: ['knee'],
    how: ['Step forward and lower the back knee toward the floor.', 'Push through the front heel to step into the next rep.', 'Keep the torso upright.'] }),
  E('splitSquat', 'Bulgarian Split Squat', { p: ['quads', 'glutes'], s: ['adductors'], eq: ['dumbbell', 'bench'], pat: 'lunge', inc: 2, stress: ['knee'],
    how: ['Rear foot on a bench.', 'Lower straight down until the front thigh is parallel.', 'Drive up through the front foot.'] }),
  E('bwSquat', 'Bodyweight Squat', { p: ['quads', 'glutes'], s: ['adductors'], eq: [], pat: 'squat', bw: true, inc: 0, stress: ['knee'],
    how: ['Feet shoulder-width, arms forward.', 'Squat as deep as you comfortably can.', 'Stand back up.'] }),
  E('legCurl', 'Lying Leg Curl', { p: ['hamstrings'], s: ['calves'], eq: ['machine'], pat: 'legCurl', m: 'isolation', inc: 5,
    how: ['Pad just above the heels.', 'Curl the heels toward your glutes.', 'Lower slowly.'] }),
  E('legExt', 'Leg Extension', { p: ['quads'], eq: ['machine'], pat: 'legExt', m: 'isolation', inc: 5, stress: ['knee'],
    how: ['Pad on the lower shins.', 'Extend the knees fully.', 'Lower under control.'] }),
  E('hipThrust', 'Barbell Hip Thrust', { p: ['glutes'], s: ['hamstrings'], eq: ['barbell', 'bench'], pat: 'hipThrust', inc: 5,
    how: ['Upper back on a bench, bar over the hips.', 'Drive the hips up until the torso is level.', 'Squeeze, then lower.'] }),
  E('gluteBridge', 'Glute Bridge', { p: ['glutes'], s: ['hamstrings'], eq: [], pat: 'hipThrust', bw: true, inc: 0,
    how: ['Lie on your back, knees bent.', 'Drive the hips up.', 'Squeeze the glutes, then lower.'] }),
  E('calfRaise', 'Standing Calf Raise', { p: ['calves'], eq: ['machine'], pat: 'calf', m: 'isolation', inc: 5,
    how: ['Balls of the feet on the platform.', 'Rise as high as possible.', 'Lower into a full stretch.'] }),
  E('bwCalf', 'Single-Leg Calf Raise', { p: ['calves'], eq: [], pat: 'calf', m: 'isolation', bw: true, inc: 0,
    how: ['Stand on one foot on a step.', 'Rise onto the toes.', 'Lower below the step.'] }),
  E('adductor', 'Hip Adduction Machine', { p: ['adductors'], eq: ['machine'], pat: 'adduction', m: 'isolation', inc: 5,
    how: ['Pads on the inner knees.', 'Squeeze the legs together.', 'Return slowly.'] }),

  // ── Core
  E('plank', 'Plank', { p: ['abs'], s: ['obliques'], eq: [], pat: 'antiExtension', m: 'isolation', bw: true, inc: 0,
    how: ['Forearms under shoulders, body straight.', 'Brace the abs and squeeze the glutes.', 'Hold — logged as seconds in the reps field.'] }),
  E('hangingRaise', 'Hanging Leg Raise', { p: ['abs'], s: ['obliques', 'forearms'], eq: ['pullupBar'], pat: 'flexion', m: 'isolation', bw: true, inc: 0,
    how: ['Hang from a bar.', 'Raise the legs by curling the pelvis up.', 'Lower without swinging.'] }),
  E('cableCrunch', 'Cable Crunch', { p: ['abs'], eq: ['cable'], pat: 'flexion', m: 'isolation', inc: 2.5,
    how: ['Kneel holding a rope behind the head.', 'Crunch down by flexing the spine.', 'Return slowly.'] }),
  E('russianTwist', 'Russian Twist', { p: ['obliques'], s: ['abs'], eq: [], pat: 'rotation', m: 'isolation', bw: true, inc: 0, stress: ['lowerBack'],
    how: ['Sit with the torso leaning back, feet up.', 'Rotate side to side.', 'Keep the chest tall.'] }),
];

export const EXERCISE_BY_ID = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

export const EQUIPMENT = [
  { id: 'barbell', label: 'Barbell' }, { id: 'dumbbell', label: 'Dumbbells' },
  { id: 'cable', label: 'Cables' }, { id: 'machine', label: 'Machines' },
  { id: 'bench', label: 'Bench' }, { id: 'rack', label: 'Squat rack' },
  { id: 'pullupBar', label: 'Pull-up bar' }, { id: 'dipStation', label: 'Dip station' },
];

export const LOCATION_EQUIPMENT = {
  gym: EQUIPMENT.map((e) => e.id),
  home: ['dumbbell', 'bench', 'pullupBar'],
  bodyweight: [],
};

export function hasEquipment(ex, available) {
  const set = new Set(available);
  return ex.equipment.every((e) => set.has(e));
}

export function alternativesFor(ex, { available, exclude = [] } = {}) {
  return EXERCISES.filter((o) => o.id !== ex.id && !exclude.includes(o.id)
    && (o.pattern === ex.pattern || o.primary.some((m) => ex.primary.includes(m)))
    && (!available || hasEquipment(o, available)))
    .sort((a, b) => (b.pattern === ex.pattern) - (a.pattern === ex.pattern));
}

export function searchExercises(query, list = EXERCISES) {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter((e) => e.name.toLowerCase().includes(q)
    || e.primary.some((m) => m.toLowerCase().includes(q))
    || e.equipment.some((x) => x.toLowerCase().includes(q)));
}
