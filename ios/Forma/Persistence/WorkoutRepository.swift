import Foundation
import SwiftData
import GymCore

/// Single entry point for reading/writing training data. Views never touch
/// SwiftData directly for mutations, so every write also records an outbox
/// entry for deferred sync.
@MainActor
final class WorkoutRepository {
    let context: ModelContext
    init(context: ModelContext) { self.context = context }

    func completedWorkouts(since: Date? = nil) -> [WorkoutRecord] {
        var d = FetchDescriptor<WorkoutEntity>(predicate: #Predicate { !$0.isDeleted }, sortBy: [SortDescriptor(\.startedAt)])
        if let since { d.predicate = #Predicate { !$0.isDeleted && $0.startedAt >= since } }
        return ((try? context.fetch(d)) ?? []).compactMap(\.record)
    }

    func save(_ record: WorkoutRecord) throws {
        let id = record.id
        if let existing = try context.fetch(FetchDescriptor<WorkoutEntity>(predicate: #Predicate { $0.id == id })).first {
            try existing.update(from: record)
        } else {
            context.insert(try WorkoutEntity(record: record))
        }
        context.insert(OutboxEntity(operation: "workout.upsert", entityID: id.uuidString))
        try context.save()
    }

    func delete(id: UUID) throws {
        guard let e = try context.fetch(FetchDescriptor<WorkoutEntity>(predicate: #Predicate { $0.id == id })).first else { return }
        e.isDeleted = true; e.updatedAt = .now
        context.insert(OutboxEntity(operation: "workout.delete", entityID: id.uuidString))
        try context.save()
    }

    func profile() -> ProfileEntity {
        if let p = try? context.fetch(FetchDescriptor<ProfileEntity>()).first { return p }
        let p = ProfileEntity(); context.insert(p); try? context.save(); return p
    }

    func catalog() -> ExerciseCatalog {
        ExerciseCatalog(custom: ((try? context.fetch(FetchDescriptor<CustomExerciseEntity>())) ?? []).map(\.definition))
    }

    func recovery(at date: Date = .now, health: HealthSignals?) -> RecoverySnapshot {
        let p = profile()
        let personal = Dictionary(uniqueKeysWithValues: p.personalRecovery.compactMap { k, v in Muscle(rawValue: k).map { ($0, v) } })
        let recent = completedWorkouts(since: date.addingTimeInterval(-11 * 86_400))
        return RecoveryEngine(catalog: catalog()).snapshot(workouts: recent, at: date, health: health, personal: personal)
    }

    /// GDPR-style export: everything the user created, as JSON.
    func exportAll() throws -> Data {
        struct Export: Codable { var exportedAt: Date; var workouts: [WorkoutRecord]; var templates: [String: [TemplateItem]]; var customExercises: [ExerciseDefinition] }
        let templates = ((try? context.fetch(FetchDescriptor<TemplateEntity>())) ?? []).reduce(into: [String: [TemplateItem]]()) { $0[$1.name] = $1.items }
        let enc = JSONEncoder(); enc.outputFormatting = [.prettyPrinted, .sortedKeys]; enc.dateEncodingStrategy = .iso8601
        return try enc.encode(Export(exportedAt: .now, workouts: completedWorkouts(), templates: templates, customExercises: Array(catalog().byID.values.filter(\.isCustom))))
    }

    /// Deletes every local record (and queues a server-side account deletion when signed in).
    func deleteAll() throws {
        for m in FormaSchema.models { try context.delete(model: m) }
        ActiveWorkoutStore.clear()
        try context.save()
    }
}

/// Crash-safe autosave for the in-progress workout (atomic JSON file write).
enum ActiveWorkoutStore {
    private static var url: URL {
        let dir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir.appendingPathComponent("active-workout.json")
    }
    static func load() -> WorkoutRecord? { (try? Data(contentsOf: url)).flatMap { try? JSONDecoder().decode(WorkoutRecord.self, from: $0) } }
    static func save(_ w: WorkoutRecord) { if let d = try? JSONEncoder().encode(w) { try? d.write(to: url, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication]) } }
    static func clear() { try? FileManager.default.removeItem(at: url) }
}
