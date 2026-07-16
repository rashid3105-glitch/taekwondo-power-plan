import Foundation
import Capacitor
import HealthKit

// Local Capacitor plugin bridging HealthKit read access to the JS layer.
// Registered from JS as `registerPlugin<SportstalentHealthKit>("SportstalentHealthKit")`.
// Exposed methods are wired in SportstalentHealthKit.m via CAP_PLUGIN_METHOD.
@objc(SportstalentHealthKit)
public class SportstalentHealthKit: CAPPlugin {

    private let store = HKHealthStore()

    // MARK: - Type mapping (whitelist; do not accept arbitrary strings from JS)

    private func quantityType(_ id: String) -> HKQuantityType? {
        let map: [String: HKQuantityTypeIdentifier] = [
            "restingHeartRate": .restingHeartRate,
            "heartRateVariabilitySDNN": .heartRateVariabilitySDNN,
            "heartRate": .heartRate,
            "activeEnergyBurned": .activeEnergyBurned,
        ]
        guard let ident = map[id] else { return nil }
        return HKObjectType.quantityType(forIdentifier: ident)
    }

    private func categoryType(_ id: String) -> HKCategoryType? {
        let map: [String: HKCategoryTypeIdentifier] = [
            "sleepAnalysis": .sleepAnalysis,
        ]
        guard let ident = map[id] else { return nil }
        return HKObjectType.categoryType(forIdentifier: ident)
    }

    private func unit(for id: String) -> HKUnit {
        switch id {
        case "restingHeartRate", "heartRate":
            return HKUnit.count().unitDivided(by: HKUnit.minute())
        case "heartRateVariabilitySDNN":
            return HKUnit.secondUnit(with: .milli)
        case "activeEnergyBurned":
            return HKUnit.kilocalorie()
        default:
            return HKUnit.count()
        }
    }

    // MARK: - isAvailable

    @objc func isAvailable(_ call: CAPPluginCall) {
        call.resolve(["available": HKHealthStore.isHealthDataAvailable()])
    }

    // MARK: - requestAuthorization

    @objc func requestAuthorization(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else {
            call.reject("HealthKit not available on this device")
            return
        }
        let readIds = call.getArray("read", String.self) ?? []
        var readTypes = Set<HKObjectType>()
        for id in readIds {
            if id == "workoutType" {
                readTypes.insert(HKObjectType.workoutType())
            } else if let q = quantityType(id) {
                readTypes.insert(q)
            } else if let c = categoryType(id) {
                readTypes.insert(c)
            }
        }
        if readTypes.isEmpty {
            call.reject("No valid HealthKit read types requested")
            return
        }
        store.requestAuthorization(toShare: nil, read: readTypes) { success, error in
            if let error = error {
                call.reject("Authorization failed: \(error.localizedDescription)")
                return
            }
            call.resolve(["granted": success])
        }
    }

    // MARK: - queryQuantity

    @objc func queryQuantity(_ call: CAPPluginCall) {
        guard let sampleTypeId = call.getString("sampleType"),
              let startIso = call.getString("startDate"),
              let endIso = call.getString("endDate") else {
            call.reject("sampleType, startDate, endDate are required")
            return
        }
        guard let qType = quantityType(sampleTypeId) else {
            call.reject("Unsupported quantity type: \(sampleTypeId)")
            return
        }
        guard let start = Self.parseIso(startIso), let end = Self.parseIso(endIso) else {
            call.reject("Invalid ISO date")
            return
        }
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: [])
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)
        let hkUnit = unit(for: sampleTypeId)
        let unitString: String = {
            switch sampleTypeId {
            case "restingHeartRate", "heartRate": return "bpm"
            case "heartRateVariabilitySDNN": return "ms"
            case "activeEnergyBurned": return "kcal"
            default: return ""
            }
        }()
        let query = HKSampleQuery(sampleType: qType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: [sort]) { _, results, error in
            if let error = error {
                call.reject("Query failed: \(error.localizedDescription)")
                return
            }
            let samples: [[String: Any]] = (results as? [HKQuantitySample])?.map { s in
                [
                    "uuid": s.uuid.uuidString,
                    "startDate": Self.isoFormatter.string(from: s.startDate),
                    "endDate": Self.isoFormatter.string(from: s.endDate),
                    "value": s.quantity.doubleValue(for: hkUnit),
                    "unit": unitString,
                    "sourceName": s.sourceRevision.source.name,
                ]
            } ?? []
            call.resolve(["samples": samples])
        }
        store.execute(query)
    }

    // MARK: - queryCategory (used for sleepAnalysis)

    @objc func queryCategory(_ call: CAPPluginCall) {
        guard let sampleTypeId = call.getString("sampleType"),
              let startIso = call.getString("startDate"),
              let endIso = call.getString("endDate") else {
            call.reject("sampleType, startDate, endDate are required")
            return
        }
        guard let cType = categoryType(sampleTypeId) else {
            call.reject("Unsupported category type: \(sampleTypeId)")
            return
        }
        guard let start = Self.parseIso(startIso), let end = Self.parseIso(endIso) else {
            call.reject("Invalid ISO date")
            return
        }
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: [])
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)
        let query = HKSampleQuery(sampleType: cType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: [sort]) { _, results, error in
            if let error = error {
                call.reject("Query failed: \(error.localizedDescription)")
                return
            }
            let samples: [[String: Any]] = (results as? [HKCategorySample])?.map { s in
                [
                    "uuid": s.uuid.uuidString,
                    "startDate": Self.isoFormatter.string(from: s.startDate),
                    "endDate": Self.isoFormatter.string(from: s.endDate),
                    "value": s.value,
                    "sourceName": s.sourceRevision.source.name,
                ]
            } ?? []
            call.resolve(["samples": samples])
        }
        store.execute(query)
    }

    // MARK: - queryWorkouts

    @objc func queryWorkouts(_ call: CAPPluginCall) {
        guard let startIso = call.getString("startDate"),
              let endIso = call.getString("endDate") else {
            call.reject("startDate, endDate are required")
            return
        }
        guard let start = Self.parseIso(startIso), let end = Self.parseIso(endIso) else {
            call.reject("Invalid ISO date")
            return
        }
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: [])
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)
        let query = HKSampleQuery(sampleType: HKObjectType.workoutType(), predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: [sort]) { _, results, error in
            if let error = error {
                call.reject("Query failed: \(error.localizedDescription)")
                return
            }
            let workouts: [[String: Any]] = (results as? [HKWorkout])?.map { w in
                var dict: [String: Any] = [
                    "uuid": w.uuid.uuidString,
                    "startDate": Self.isoFormatter.string(from: w.startDate),
                    "endDate": Self.isoFormatter.string(from: w.endDate),
                    "duration": w.duration, // seconds
                    "activityType": w.workoutActivityType.rawValue,
                    "activityName": Self.workoutName(w.workoutActivityType),
                    "sourceName": w.sourceRevision.source.name,
                ]
                if let cal = w.totalEnergyBurned?.doubleValue(for: HKUnit.kilocalorie()) {
                    dict["totalEnergyBurned"] = cal
                }
                if let dist = w.totalDistance?.doubleValue(for: HKUnit.meter()) {
                    dict["totalDistance"] = dist
                }
                return dict
            } ?? []
            call.resolve(["workouts": workouts])
        }
        store.execute(query)
    }

    // MARK: - Helpers

    private static let isoFormatter: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()

    private static let isoFormatterNoFrac: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime]
        return f
    }()

    private static func parseIso(_ s: String) -> Date? {
        return isoFormatter.date(from: s) ?? isoFormatterNoFrac.date(from: s)
    }

    private static func workoutName(_ t: HKWorkoutActivityType) -> String {
        switch t {
        case .running: return "running"
        case .cycling: return "cycling"
        case .walking: return "walking"
        case .swimming: return "swimming"
        case .traditionalStrengthTraining, .functionalStrengthTraining: return "strength"
        case .highIntensityIntervalTraining: return "hiit"
        case .yoga: return "yoga"
        case .martialArts, .taekwondo, .kickboxing, .boxing: return "martial_arts"
        case .soccer: return "soccer"
        case .basketball: return "basketball"
        case .tennis: return "tennis"
        case .hiking: return "hiking"
        case .rowing: return "rowing"
        case .elliptical: return "elliptical"
        case .stairClimbing: return "stair_climbing"
        case .coreTraining: return "core"
        case .flexibility: return "flexibility"
        case .mixedCardio: return "mixed_cardio"
        default: return "other"
        }
    }
}
