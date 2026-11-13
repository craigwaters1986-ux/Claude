import XCTest
@testable import GymCore

final class AnatomyMappingTests: XCTestCase {
    func testSameCasesAsJavaScript() {
        let cases: [String: Muscle?] = [
            "Pectoralis_Major.L": .chest, "Deltoid_Anterior_R": .frontDelts, "Deltoid (posterior part).L": .rearDelts, "Deltoid.L": .sideDelts,
            "BicepsBrachii_L": .biceps, "Brachioradialis.L": .forearms, "Triceps_brachii_long_head": .triceps, "Rectus_abdominis": .abs,
            "External_oblique.L": .obliques, "Trapezius.R": .traps, "Latissimus_dorsi.L": .lats, "Rhomboid_major.R": .upperBack, "Erector_spinae": .lowerBack,
            "Gluteus_maximus.L": .glutes, "Vastus_lateralis.L": .quads, "Biceps_femoris.L": .hamstrings, "Adductor_magnus.L": .adductors,
            "Gastrocnemius_medial_head.R": .calves, "chest__FJ1456": .chest, "lats.001": .lats,
            "Femur.L": nil, "abdominal aorta": nil, "deltoid branch of right thoraco-acromial artery": nil, "right forearm": nil,
        ]
        for (name, want) in cases { XCTAssertEqual(AnatomyMapping.muscle(forMeshName: name), want, name) }
        XCTAssertEqual(AnatomyMapping.normalise("Pectoralis_Major.L.001"), "pectoralis major")
    }
}
