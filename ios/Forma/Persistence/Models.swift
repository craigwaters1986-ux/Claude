import Foundation
import SwiftData
import GymCore

// SwiftData schema (local, offline-first). Completed workouts, templates,
// profile and a sync outbox live here. The *active* workout is deliberately
// NOT a SwiftData object: it's a GymCore.WorkoutRecord value that is
// autosaved atomically to a JSON file on every edit (see ActiveWorkoutStore),
// which keeps the logging hot path fast and crash-safe.

@Model final class WorkoutEntity {
    @Attribute(.unique) var id: UUID
    var name: String
    var startedAt: Date
    var endedAt: Date?
    var notes: String
    /// Full workout as JSON (GymCore.WorkoutRecord) — keeps the schema small and
    /// migrations trivial; denormalised columns below support queries.
    var payload: Data
    var volumeKg: Double
    var hardSets: Int
    var exerciseIDs: [String]
    var updatedAt: Date
    var isTombstoned: Bool   // tombstone for sync

    init(record: WorkoutRecord) throws {
        id = record.id; name = record.name; startedAt = record.startedAt; endedAt = record.endedAt; notes = record.notes
        payload = try JSONEncoder().encode(record)
        volumeKg = record.volumeKg; hardSets = record.hardSetCount
        exerciseIDs = Array(Set(record.exercises.map(\.exerciseID)))
        updatedAt = .now; isTombstoned = false
    }

    var record: WorkoutRecord? { try? JSONDecoder().decode(WorkoutRecord.self, from: payload) }

    func update(from record: WorkoutRecord) throws {
        name = record.name; endedAt = record.endedAt; notes = record.notes
        payload = try JSONEncoder().encode(record)
        volumeKg = record.volumeKg; hardSets = record.hardSetCount
        exerciseIDs = Array(Set(record.exercises.map(\.exerciseID))); updatedAt = .now
    }
}

@Model final class TemplateEntity {
    @Attribute(.unique) var id: UUID
    var name: String
    var items: [TemplateItem]
    var createdAt: Date
    init(id: UUID = UUID(), name: String, items: [TemplateItem]) { self.id = id; self.name = name; self.items = items; createdAt = .now }
}

@Model final class CustomExerciseEntity {
    @Attribute(.unique) var id: String
    var definition: ExerciseDefinition
    init(_ def: ExerciseDefinition) { id = def.id; definition = def }
}

@Model final class ProfileEntity {
    var name: String = ""
    var goal: String = "hypertrophy"
    var experience: String = "intermediate"
    var trainingDays: [Int] = [1, 2, 4, 5]
    var equipment: [String] = Equipment.allCases.map(\.rawValue)
    var injuries: [String] = []
    var location: String = "gym"
    var unitsRaw: String = "kg"
    var durationMinutes: Int = 60
    var restDefaultSeconds: Int = 120
    var hapticsEnabled: Bool = true
    var healthKitEnabled: Bool = false
    var cloudAIEnabled: Bool = false
    var coachUsesHistory: Bool = true
    var onboarded: Bool = false
    /// Personal recovery-speed multipliers learnt from "how does it feel?" feedback.
    var personalRecovery: [String: Double] = [:]
    var likes: [String] = []
    var dislikes: [String] = []
    init() {}
    var units: Units { Units(rawValue: unitsRaw) ?? .kg }
}

/// Outbox for deferred sync (offline-first). Every mutation appends an entry;
/// SyncService drains it with exponential backoff when online.
@Model final class OutboxEntity {
    @Attribute(.unique) var id: UUID
    var operation: String   // "workout.upsert", "workout.delete", "template.upsert", ...
    var entityID: String
    var createdAt: Date
    var attempts: Int
    var nextAttemptAt: Date
    init(operation: String, entityID: String) { id = UUID(); self.operation = operation; self.entityID = entityID; createdAt = .now; attempts = 0; nextAttemptAt = .now }
}

enum FormaSchema {
    static let models: [any PersistentModel.Type] = [WorkoutEntity.self, TemplateEntity.self, CustomExerciseEntity.self, ProfileEntity.self, OutboxEntity.self]
}
