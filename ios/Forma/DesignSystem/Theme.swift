import SwiftUI
import GymCore

/// Forma design tokens — mirrors prototype/css/tokens.css.
enum Theme {
    static let bg0 = Color(hex: 0x050608)
    static let bg1 = Color(hex: 0x0B0D12)
    static let text0 = Color(hex: 0xF4F8FF)
    static let text1 = Color(hex: 0xB9C3D6)
    static let text2 = Color(hex: 0x8792A8)
    static let accent = Color(hex: 0x2F8CFF)
    static let ice = Color(hex: 0x5CE1FF)
    static let violet = Color(hex: 0x8B7BFF)
    static let pr = Color(hex: 0xFFCF5C)
    static let accentGradient = LinearGradient(colors: [ice, accent, Color(hex: 0x6D5CFF)], startPoint: .topLeading, endPoint: .bottomTrailing)
    static let aiGradient = LinearGradient(colors: [violet, accent, ice], startPoint: .topLeading, endPoint: .bottomTrailing)

    static func recovery(_ s: RecoveryStatus) -> Color {
        switch s {
        case .ready: Color(hex: 0x30E8A0)
        case .light: Color(hex: 0x3AA8FF)
        case .caution: Color(hex: 0xFFD23F)
        case .fatigued: Color(hex: 0xFF4D6D)
        }
    }
    static func label(_ s: RecoveryStatus) -> String {
        switch s { case .ready: "Ready"; case .light: "Nearly ready"; case .caution: "Recovering"; case .fatigued: "Fatigued" }
    }

    enum Radius { static let card: CGFloat = 22; static let control: CGFloat = 16 }
    enum Motion { static let spring = Animation.spring(response: 0.42, dampingFraction: 0.82); static let snappy = Animation.snappy(duration: 0.25) }
}

extension Color {
    init(hex: UInt32, opacity: Double = 1) {
        self.init(.sRGB, red: Double((hex >> 16) & 0xFF) / 255, green: Double((hex >> 8) & 0xFF) / 255, blue: Double(hex & 0xFF) / 255, opacity: opacity)
    }
}

// MARK: - Components

struct GlassCard<Content: View>: View {
    var glow = false
    @ViewBuilder var content: Content
    var body: some View {
        content
            .padding(16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(.ultraThinMaterial.opacity(0.55), in: RoundedRectangle(cornerRadius: Theme.Radius.card, style: .continuous))
            .background(Color.white.opacity(0.03), in: RoundedRectangle(cornerRadius: Theme.Radius.card, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: Theme.Radius.card, style: .continuous)
                    .strokeBorder(glow ? AnyShapeStyle(LinearGradient(colors: [Theme.ice.opacity(0.55), .clear, Theme.violet.opacity(0.4)], startPoint: .topLeading, endPoint: .bottomTrailing)) : AnyShapeStyle(Color.white.opacity(0.09)), lineWidth: 1)
            }
    }
}

struct RecoveryRing: View {
    var percent: Int
    var size: CGFloat = 150
    var lineWidth: CGFloat = 13
    @State private var shown = 0.0
    var body: some View {
        ZStack {
            Circle().stroke(Color.white.opacity(0.07), lineWidth: lineWidth)
            Circle().trim(from: 0, to: shown)
                .stroke(AngularGradient(colors: [Theme.ice, Theme.accent, Color(hex: 0x6D5CFF), Theme.ice], center: .center), style: .init(lineWidth: lineWidth, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .shadow(color: Theme.ice.opacity(0.6), radius: 10)
            HStack(alignment: .firstTextBaseline, spacing: 1) {
                Text("\(percent)").font(.system(size: size * 0.36, weight: .bold, design: .rounded)).monospacedDigit().contentTransition(.numericText())
                Text("%").font(.system(size: size * 0.14, weight: .semibold)).foregroundStyle(Theme.text1)
            }
        }
        .frame(width: size, height: size)
        .onAppear { withAnimation(.easeOut(duration: 1.2)) { shown = Double(percent) / 100 } }
        .onChange(of: percent) { _, v in withAnimation(Theme.Motion.spring) { shown = Double(v) / 100 } }
        .accessibilityElement().accessibilityLabel("Estimated recovery \(percent) percent")
    }
}

struct PrimaryButtonStyle: ButtonStyle {
    var ai = false
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline).foregroundStyle(.white)
            .frame(maxWidth: .infinity, minHeight: 56)
            .background(ai ? Theme.aiGradient : Theme.accentGradient, in: Capsule())
            .shadow(color: (ai ? Theme.violet : Theme.accent).opacity(0.45), radius: 16, y: 6)
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
            .animation(Theme.Motion.snappy, value: configuration.isPressed)
    }
}

struct EstimateDisclaimer: View {
    var text = "An estimate from your training volume, effort and time since training. Not a medical or physiological measurement."
    var body: some View {
        Label(text, systemImage: "info.circle").font(.caption2).foregroundStyle(Theme.text2)
    }
}
