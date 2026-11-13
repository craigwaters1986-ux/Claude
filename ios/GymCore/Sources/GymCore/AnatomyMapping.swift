import Foundation

/// Maps 3D-asset mesh names to muscle groups (mirror of prototype/js/core/anatomy.js).
/// Lets a licensed / commissioned anatomy model replace the built-in one with no code changes.
public enum AnatomyMapping {
    /// Ordered: specific patterns before general ones.
    static let rules: [(String, Muscle)] = [
        (#"biceps femoris|semitendinosus|semimembranosus|hamstring"#, .hamstrings),
        (#"rectus femoris|vastus|quadriceps|\bquads?\b"#, .quads),
        (#"adductor|gracilis|pectineus"#, .adductors),
        (#"gluteus|glute"#, .glutes),
        (#"gastrocnemius|soleus|\bcal(f|ves)\b"#, .calves),
        (#"pectoralis|\bpecs?\b|\bchest\b"#, .chest),
        (#"(anterior|front|clavicular).*deltoid|deltoid.*(anterior|front|clavicular)|front ?delts?"#, .frontDelts),
        (#"(posterior|rear|spinal).*deltoid|deltoid.*(posterior|rear|spinal)|rear ?delts?|infraspinatus|teres minor"#, .rearDelts),
        (#"(lateral|middle|side|acromial).*deltoid|deltoid.*(lateral|middle|side|acromial)|side ?delts?|\bdeltoid\b"#, .sideDelts),
        (#"biceps|brachialis(?!radialis)|coracobrachialis"#, .biceps),
        (#"triceps|anconeus"#, .triceps),
        (#"brachioradialis|flexor (carpi|digitorum)|extensor (carpi|digitorum)|pronator|supinator|palmaris|forearm muscle"#, .forearms),
        (#"rectus abdominis|\babs\b"#, .abs),
        (#"oblique|serratus anterior"#, .obliques),
        (#"trapezius|\btraps?\b"#, .traps),
        (#"latissimus|\blats?\b"#, .lats),
        (#"rhomboid|teres major|upper back"#, .upperBack),
        (#"erector spinae|iliocostalis|longissimus|spinalis|multifidus|quadratus lumborum|lower back"#, .lowerBack),
    ]
    static let nonMuscle = #"\b(arter(y|ies)|vein|venous|nerve|branch|aorta|fascia|tendon|ligament|bursa|wall|region|skin|bone|cartilage|lymph|retinaculum|aponeurosis|sheath|compartment)\b"#

    private static func matches(_ s: String, _ pattern: String) -> Bool {
        (try? NSRegularExpression(pattern: pattern))?.firstMatch(in: s, range: NSRange(s.startIndex..., in: s)) != nil
    }

    public static func normalise(_ name: String) -> String {
        var s = name.replacingOccurrences(of: #"([a-z])([A-Z])"#, with: "$1 $2", options: .regularExpression).lowercased()
        s = s.replacingOccurrences(of: #"[._\-:/]+"#, with: " ", options: .regularExpression)
        s = s.replacingOccurrences(of: #"\b\d+\b"#, with: " ", options: .regularExpression)
        s = s.replacingOccurrences(of: #"\b(l|r|left|right|sin|dex|sinister|dexter|muscle|muscles|mesh|geo|obj)\b"#, with: " ", options: .regularExpression)
        return s.replacingOccurrences(of: #"\s+"#, with: " ", options: .regularExpression).trimmingCharacters(in: .whitespaces)
    }

    public static func muscle(forMeshName name: String) -> Muscle? {
        let raw = String(name.split(whereSeparator: { "._- ".contains($0) }).first ?? "")
        if let m = Muscle(rawValue: raw) { return m }
        let n = normalise(name)
        if matches(n, nonMuscle) { return nil }
        return rules.first { matches(n, $0.0) }?.1
    }
}
