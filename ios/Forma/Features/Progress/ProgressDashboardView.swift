import SwiftUI
import Charts
import SwiftData
import GymCore

struct ProgressDashboardView: View {
    enum Range: String, CaseIterable, Identifiable { case week = "7D", month = "30D", quarter = "90D", year = "1Y"; var id: Self { self }
        var days: Int { switch self { case .week: 7; case .month: 30; case .quarter: 90; case .year: 365 } }
        var unit: Calendar.Component { switch self { case .week: .day; case .month, .quarter: .weekOfYear; case .year: .month } } }

    @Environment(\.modelContext) private var context
    @State private var range: Range = .month
    @State private var lift = "bench"
    @State private var selectedDate: Date?

    var body: some View {
        let repo = WorkoutRepository(context: context)
        let all = repo.completedWorkouts()
        let start = Date.now.addingTimeInterval(-Double(range.days) * 86_400)
        let inRange = all.filter { $0.startedAt >= start }
        let prev = all.filter { $0.startedAt >= start.addingTimeInterval(-Double(range.days) * 86_400) && $0.startedAt < start }
        let lifts = Array(Set(all.flatMap { $0.exercises.map(\.exerciseID) })).sorted()
        let e1rm = StrengthAnalytics.history(all, exerciseID: lift).filter { $0.date >= start }.compactMap { s in s.bestE1RM.map { (s.date, $0) } }.reversed()

        NavigationStack {
            ScrollView {
                VStack(spacing: 14) {
                    Picker("Range", selection: $range) { ForEach(Range.allCases) { Text($0.rawValue).tag($0) } }.pickerStyle(.segmented)
                    HStack {
                        stat("Total lifted", inRange.reduce(0) { $0 + $1.volumeKg }, prev.reduce(0) { $0 + $1.volumeKg })
                        stat("Workouts", Double(inRange.count), Double(prev.count))
                    }
                    GlassCard {
                        VStack(alignment: .leading) {
                            Text("Training volume").font(.headline)
                            Chart(inRange) { w in
                                BarMark(x: .value("Date", w.startedAt, unit: range.unit), y: .value("Volume (kg)", w.volumeKg))
                                    .foregroundStyle(LinearGradient(colors: [Theme.ice, Theme.accent], startPoint: .top, endPoint: .bottom)).cornerRadius(4)
                            }
                            .chartXSelection(value: $selectedDate)
                            .frame(height: 180)
                            .accessibilityLabel("Training volume per \(range.unit == .day ? "day" : range.unit == .month ? "month" : "week")")
                        }
                    }
                    GlassCard {
                        VStack(alignment: .leading) {
                            HStack { Text("Estimated 1RM").font(.headline); Spacer()
                                Picker("Lift", selection: $lift) { ForEach(lifts, id: \.self) { Text(ExerciseLibrary.byID[$0]?.name ?? $0).tag($0) } }.pickerStyle(.menu) }
                            if e1rm.count >= 2 {
                                Chart(Array(e1rm), id: \.0) { d, v in
                                    LineMark(x: .value("Date", d), y: .value("e1RM", v)).interpolationMethod(.monotone).lineStyle(.init(lineWidth: 2)).foregroundStyle(Theme.ice)
                                    PointMark(x: .value("Date", d), y: .value("e1RM", v)).symbolSize(30).foregroundStyle(Theme.ice)
                                }
                                .chartYScale(domain: .automatic(includesZero: false)).frame(height: 180)
                            } else { Text("Log this lift twice to see a trend.").foregroundStyle(Theme.text2) }
                            Text("Epley estimate adjusted for reps in reserve — not a tested max.").font(.caption2).foregroundStyle(Theme.text2)
                        }
                    }
                    GlassCard {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Personal records").font(.headline)
                            ForEach(lifts.prefix(6), id: \.self) { id in
                                let r = StrengthAnalytics.records(all, exerciseID: id)
                                HStack { Image(systemName: "trophy.fill").foregroundStyle(Theme.pr); Text(ExerciseLibrary.byID[id]?.name ?? id); Spacer(); Text("\(r.bestE1RM, specifier: "%.1f") kg").monospacedDigit().bold() }
                            }
                        }
                    }
                }.padding(16)
            }
            .background(Theme.bg0).navigationTitle("Progress")
        }
    }

    private func stat(_ label: String, _ v: Double, _ p: Double) -> some View {
        GlassCard {
            VStack(alignment: .leading, spacing: 4) {
                Text(label.uppercased()).font(.caption2.weight(.semibold)).foregroundStyle(Theme.text2)
                Text(v.formatted(.number.notation(.compactName))).font(.title2.bold().monospacedDigit())
                if p > 0 { let d = (v - p) / p * 100; Text("\(d >= 0 ? "▲" : "▼") \(abs(Int(d)))%").font(.caption.bold()).foregroundStyle(d >= 0 ? Color(hex: 0x30E8A0) : Color(hex: 0xFF4D6D)) }
            }
        }
    }
}
