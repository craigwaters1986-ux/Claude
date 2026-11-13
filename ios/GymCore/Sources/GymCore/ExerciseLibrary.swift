import Foundation

/// Built-in exercise catalogue. IDs match the web prototype and the server
/// so plans and exports are portable. (Instructions live in the app's
/// localized resources; this file keeps only what the engines need.)
public enum ExerciseLibrary {
    public static let all: [ExerciseDefinition] = [
        .init(id: "bench", name: "Barbell Bench Press", primary: [.chest], secondary: [.frontDelts, .triceps], equipment: [.barbell, .bench], pattern: "horizontalPush", stress: [.shoulder], watch: .experimental),
        .init(id: "inclineDb", name: "Incline Dumbbell Press", primary: [.chest], secondary: [.frontDelts, .triceps], equipment: [.dumbbell, .bench], pattern: "horizontalPush", incrementKg: 2, stress: [.shoulder], watch: .experimental),
        .init(id: "dbBench", name: "Dumbbell Bench Press", primary: [.chest], secondary: [.frontDelts, .triceps], equipment: [.dumbbell, .bench], pattern: "horizontalPush", incrementKg: 2, stress: [.shoulder], watch: .experimental),
        .init(id: "cableFly", name: "Cable Fly", primary: [.chest], secondary: [.frontDelts], equipment: [.cable], pattern: "chestFly", mechanics: .isolation, watch: .experimental),
        .init(id: "pushup", name: "Push-Up", primary: [.chest], secondary: [.triceps, .frontDelts, .abs], pattern: "horizontalPush", incrementKg: 0, stress: [.wrist]),
        .init(id: "dip", name: "Parallel Bar Dip", primary: [.chest, .triceps], secondary: [.frontDelts], equipment: [.dipStation], pattern: "verticalPushDown", stress: [.shoulder]),
        .init(id: "machineChest", name: "Machine Chest Press", primary: [.chest], secondary: [.triceps, .frontDelts], equipment: [.machine], pattern: "horizontalPush", incrementKg: 5, watch: .experimental),
        .init(id: "deadlift", name: "Conventional Deadlift", primary: [.hamstrings, .glutes, .lowerBack], secondary: [.traps, .forearms, .quads, .lats], equipment: [.barbell], pattern: "hinge", incrementKg: 5, stress: [.lowerBack]),
        .init(id: "row", name: "Barbell Row", primary: [.upperBack, .lats], secondary: [.biceps, .rearDelts, .lowerBack], equipment: [.barbell], pattern: "horizontalPull", stress: [.lowerBack], watch: .experimental),
        .init(id: "dbRow", name: "One-Arm Dumbbell Row", primary: [.lats, .upperBack], secondary: [.biceps, .rearDelts], equipment: [.dumbbell, .bench], pattern: "horizontalPull", incrementKg: 2, watch: .experimental),
        .init(id: "pullup", name: "Pull-Up", primary: [.lats], secondary: [.biceps, .upperBack, .forearms], equipment: [.pullupBar], pattern: "verticalPull", stress: [.shoulder], watch: .experimental),
        .init(id: "latPulldown", name: "Lat Pulldown", primary: [.lats], secondary: [.biceps, .upperBack], equipment: [.cable], pattern: "verticalPull", incrementKg: 5, watch: .experimental),
        .init(id: "seatedRow", name: "Seated Cable Row", primary: [.upperBack, .lats], secondary: [.biceps, .rearDelts], equipment: [.cable], pattern: "horizontalPull", incrementKg: 5, watch: .experimental),
        .init(id: "shrug", name: "Dumbbell Shrug", primary: [.traps], secondary: [.forearms], equipment: [.dumbbell], pattern: "shrug", mechanics: .isolation, incrementKg: 2, watch: .experimental),
        .init(id: "ohp", name: "Overhead Press", primary: [.frontDelts], secondary: [.sideDelts, .triceps, .traps], equipment: [.barbell], pattern: "verticalPush", stress: [.shoulder, .lowerBack], watch: .supported),
        .init(id: "dbShoulderPress", name: "Dumbbell Shoulder Press", primary: [.frontDelts], secondary: [.sideDelts, .triceps], equipment: [.dumbbell], pattern: "verticalPush", incrementKg: 2, stress: [.shoulder], watch: .supported),
        .init(id: "lateralRaise", name: "Lateral Raise", primary: [.sideDelts], secondary: [.traps], equipment: [.dumbbell], pattern: "lateralRaise", mechanics: .isolation, incrementKg: 1, watch: .supported),
        .init(id: "facePull", name: "Face Pull", primary: [.rearDelts], secondary: [.upperBack, .traps], equipment: [.cable], pattern: "rearDelt", mechanics: .isolation, watch: .experimental),
        .init(id: "dbCurl", name: "Dumbbell Curl", primary: [.biceps], secondary: [.forearms], equipment: [.dumbbell], pattern: "curl", mechanics: .isolation, incrementKg: 1, watch: .supported),
        .init(id: "bbCurl", name: "Barbell Curl", primary: [.biceps], secondary: [.forearms], equipment: [.barbell], pattern: "curl", mechanics: .isolation, watch: .supported),
        .init(id: "hammerCurl", name: "Hammer Curl", primary: [.biceps, .forearms], equipment: [.dumbbell], pattern: "curl", mechanics: .isolation, incrementKg: 1, watch: .supported),
        .init(id: "tricepPushdown", name: "Cable Tricep Pushdown", primary: [.triceps], equipment: [.cable], pattern: "tricepExt", mechanics: .isolation, watch: .experimental),
        .init(id: "skullcrusher", name: "EZ-Bar Skull Crusher", primary: [.triceps], equipment: [.barbell, .bench], pattern: "tricepExt", mechanics: .isolation, stress: [.elbow], watch: .experimental),
        .init(id: "squat", name: "Barbell Back Squat", primary: [.quads, .glutes], secondary: [.adductors, .lowerBack, .hamstrings], equipment: [.barbell, .rack], pattern: "squat", incrementKg: 5, stress: [.knee, .lowerBack]),
        .init(id: "gobletSquat", name: "Goblet Squat", primary: [.quads, .glutes], secondary: [.adductors, .abs], equipment: [.dumbbell], pattern: "squat", incrementKg: 2, stress: [.knee]),
        .init(id: "legPress", name: "Leg Press", primary: [.quads, .glutes], secondary: [.adductors], equipment: [.machine], pattern: "squat", incrementKg: 10, stress: [.knee]),
        .init(id: "rdl", name: "Romanian Deadlift", primary: [.hamstrings, .glutes], secondary: [.lowerBack, .forearms], equipment: [.barbell], pattern: "hinge", incrementKg: 5, stress: [.lowerBack]),
        .init(id: "lunge", name: "Walking Lunge", primary: [.quads, .glutes], secondary: [.hamstrings, .adductors], equipment: [.dumbbell], pattern: "lunge", incrementKg: 2, stress: [.knee]),
        .init(id: "legCurl", name: "Lying Leg Curl", primary: [.hamstrings], secondary: [.calves], equipment: [.machine], pattern: "legCurl", mechanics: .isolation, incrementKg: 5),
        .init(id: "legExt", name: "Leg Extension", primary: [.quads], equipment: [.machine], pattern: "legExt", mechanics: .isolation, incrementKg: 5, stress: [.knee]),
        .init(id: "hipThrust", name: "Barbell Hip Thrust", primary: [.glutes], secondary: [.hamstrings], equipment: [.barbell, .bench], pattern: "hipThrust", incrementKg: 5),
        .init(id: "calfRaise", name: "Standing Calf Raise", primary: [.calves], equipment: [.machine], pattern: "calf", mechanics: .isolation, incrementKg: 5),
        .init(id: "plank", name: "Plank", primary: [.abs], secondary: [.obliques], pattern: "antiExtension", mechanics: .isolation, incrementKg: 0),
        .init(id: "cableCrunch", name: "Cable Crunch", primary: [.abs], equipment: [.cable], pattern: "flexion", mechanics: .isolation),
    ]

    public static let byID: [String: ExerciseDefinition] = Dictionary(uniqueKeysWithValues: all.map { ($0.id, $0) })
}

/// Lookup that merges built-ins with the user's custom exercises.
public struct ExerciseCatalog: Sendable {
    public var byID: [String: ExerciseDefinition]
    public init(custom: [ExerciseDefinition] = []) {
        var map = ExerciseLibrary.byID
        for c in custom { map[c.id] = c }
        byID = map
    }
    public subscript(id: String) -> ExerciseDefinition? { byID[id] }
}
