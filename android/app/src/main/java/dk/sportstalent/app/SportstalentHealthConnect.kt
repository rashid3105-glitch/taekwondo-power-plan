package dk.sportstalent.app

import android.util.Log
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.ActiveCaloriesBurnedRecord
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.HeartRateVariabilityRmssdRecord
import androidx.health.connect.client.records.Record
import androidx.health.connect.client.records.RestingHeartRateRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContract
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.time.Instant
import kotlin.reflect.KClass

/**
 * Local Capacitor 8 plugin bridging Android Health Connect read access to the JS layer.
 * Mirrors iOS SportstalentHealthKit method surface: debugRegistration, isAvailable,
 * requestAuthorization, queryQuantity, queryCategory, queryWorkouts.
 */
@CapacitorPlugin(name = "SportstalentHealthConnect")
class SportstalentHealthConnect : Plugin() {

    private val tag = "SportstalentHealthConnect"
    private val scope = CoroutineScope(Dispatchers.Main)

    private var permissionLauncher: ActivityResultLauncher<Set<String>>? = null
    private var pendingPermissionCall: PluginCall? = null
    private var pendingPermissionRequested: Set<String> = emptySet()

    override fun load() {
        super.load()
        Log.i(tag, "Plugin load() invoked")
        try {
            val activity = activity ?: return
            val contract: ActivityResultContract<Set<String>, Set<String>> =
                PermissionController.createRequestPermissionResultContract()
            permissionLauncher = activity.registerForActivityResult(contract) { granted ->
                val call = pendingPermissionCall
                pendingPermissionCall = null
                val requested = pendingPermissionRequested
                pendingPermissionRequested = emptySet()
                val allGranted = requested.isNotEmpty() && granted.containsAll(requested)
                Log.i(tag, "Permission result: granted=${granted.size}/${requested.size}")
                val res = JSObject()
                res.put("granted", allGranted)
                val list = JSArray()
                granted.forEach { list.put(it) }
                res.put("grantedPermissions", list)
                call?.resolve(res)
            }
        } catch (t: Throwable) {
            Log.w(tag, "Failed to register permission launcher: ${t.message}")
        }
    }

    // MARK: - Type mapping (whitelist)

    private fun recordClass(id: String): KClass<out Record>? = when (id) {
        "sleep", "sleepAnalysis", "SleepSessionRecord" -> SleepSessionRecord::class
        "resting_hr", "restingHeartRate", "RestingHeartRateRecord" -> RestingHeartRateRecord::class
        "hrv", "heartRateVariabilityRmssd", "HeartRateVariabilityRmssdRecord" -> HeartRateVariabilityRmssdRecord::class
        "heart_rate", "heartRate", "HeartRateRecord" -> HeartRateRecord::class
        "active_energy", "activeCaloriesBurned", "ActiveCaloriesBurnedRecord" -> ActiveCaloriesBurnedRecord::class
        "steps", "stepCount", "StepsRecord" -> StepsRecord::class
        "workout", "exercise", "ExerciseSessionRecord" -> ExerciseSessionRecord::class
        else -> null
    }

    private fun permissionFor(id: String): String? {
        val kls = recordClass(id) ?: return null
        return HealthPermission.getReadPermission(kls)
    }

    // MARK: - debugRegistration

    @PluginMethod
    fun debugRegistration(call: PluginCall) {
        val ctx = context
        val status = try { HealthConnectClient.getSdkStatus(ctx) } catch (t: Throwable) { -1 }
        Log.i(tag, "debugRegistration sdkStatus=$status")
        val res = JSObject()
        res.put("registered", true)
        res.put("sdkStatus", status)
        res.put("healthConnectAvailable", status == HealthConnectClient.SDK_AVAILABLE)
        res.put("identifier", "SportstalentHealthConnect")
        res.put("jsName", "SportstalentHealthConnect")
        val methods = JSArray()
        listOf("debugRegistration", "isAvailable", "requestAuthorization",
            "queryQuantity", "queryCategory", "queryWorkouts").forEach { methods.put(it) }
        res.put("methods", methods)
        call.resolve(res)
    }

    // MARK: - isAvailable

    @PluginMethod
    fun isAvailable(call: PluginCall) {
        val status = try { HealthConnectClient.getSdkStatus(context) } catch (t: Throwable) { -1 }
        val res = JSObject()
        res.put("available", status == HealthConnectClient.SDK_AVAILABLE)
        res.put("sdkStatus", status)
        call.resolve(res)
    }

    // MARK: - requestAuthorization

    @PluginMethod
    fun requestAuthorization(call: PluginCall) {
        val readIds = call.getArray("read", JSArray())
        val perms = mutableSetOf<String>()
        if (readIds != null) {
            for (i in 0 until readIds.length()) {
                val id = readIds.optString(i, "")
                val perm = permissionFor(id)
                if (perm != null) perms.add(perm)
            }
        }
        if (perms.isEmpty()) {
            call.reject("No valid Health Connect read types requested")
            return
        }
        val status = try { HealthConnectClient.getSdkStatus(context) } catch (t: Throwable) { -1 }
        if (status != HealthConnectClient.SDK_AVAILABLE) {
            call.reject("Health Connect not available (sdkStatus=$status)")
            return
        }
        Log.i(tag, "requestAuthorization launching for ${perms.size} permissions")
        scope.launch {
            try {
                val client = HealthConnectClient.getOrCreate(context)
                val already = client.permissionController.getGrantedPermissions()
                if (already.containsAll(perms)) {
                    val res = JSObject()
                    res.put("granted", true)
                    val list = JSArray()
                    already.forEach { list.put(it) }
                    res.put("grantedPermissions", list)
                    call.resolve(res)
                    return@launch
                }
                val launcher = permissionLauncher
                if (launcher == null) {
                    call.reject("Permission launcher not initialised")
                    return@launch
                }
                pendingPermissionCall = call
                pendingPermissionRequested = perms
                call.setKeepAlive(true)
                launcher.launch(perms)
            } catch (t: Throwable) {
                Log.e(tag, "requestAuthorization failed", t)
                call.reject("Authorization failed: ${t.message}")
            }
        }
    }

    // MARK: - Shared query helpers

    private fun parseInstant(s: String?): Instant? {
        if (s.isNullOrEmpty()) return null
        return try { Instant.parse(s) } catch (t: Throwable) { null }
    }

    private fun unitFor(id: String): String = when (id) {
        "resting_hr", "restingHeartRate", "heart_rate", "heartRate" -> "bpm"
        "hrv", "heartRateVariabilityRmssd" -> "ms"
        "active_energy", "activeCaloriesBurned" -> "kcal"
        "steps", "stepCount" -> "count"
        "sleep", "sleepAnalysis" -> "seconds"
        else -> ""
    }

    // MARK: - queryQuantity

    @PluginMethod
    fun queryQuantity(call: PluginCall) {
        val metricType = call.getString("metricType") ?: call.getString("sampleType")
        val start = parseInstant(call.getString("startDate"))
        val end = parseInstant(call.getString("endDate"))
        if (metricType == null || start == null || end == null) {
            call.reject("metricType, startDate, endDate are required")
            return
        }
        val kls = recordClass(metricType)
        if (kls == null) {
            call.reject("Unsupported metric type: $metricType")
            return
        }
        val unit = unitFor(metricType)
        Log.i(tag, "queryQuantity metricType=$metricType range=$start..$end")
        scope.launch {
            try {
                val client = HealthConnectClient.getOrCreate(context)
                val samples = JSArray()
                withContext(Dispatchers.IO) {
                    val response = client.readRecords(
                        ReadRecordsRequest(
                            recordType = kls,
                            timeRangeFilter = TimeRangeFilter.between(start, end)
                        )
                    )
                    for (record in response.records) {
                        val obj = JSObject()
                        val meta = record.metadata
                        obj.put("uuid", meta.id)
                        obj.put("external_id", meta.id)
                        obj.put("sourceName", meta.dataOrigin.packageName)
                        obj.put("unit", unit)
                        when (record) {
                            is RestingHeartRateRecord -> {
                                obj.put("startDate", record.time.toString())
                                obj.put("endDate", record.time.toString())
                                obj.put("value", record.beatsPerMinute.toDouble())
                            }
                            is HeartRateVariabilityRmssdRecord -> {
                                obj.put("startDate", record.time.toString())
                                obj.put("endDate", record.time.toString())
                                obj.put("value", record.heartRateVariabilityMillis)
                            }
                            is StepsRecord -> {
                                obj.put("startDate", record.startTime.toString())
                                obj.put("endDate", record.endTime.toString())
                                obj.put("value", record.count.toDouble())
                            }
                            is ActiveCaloriesBurnedRecord -> {
                                obj.put("startDate", record.startTime.toString())
                                obj.put("endDate", record.endTime.toString())
                                obj.put("value", record.energy.inKilocalories)
                            }
                            is HeartRateRecord -> {
                                // Aggregate: one entry per HR sample inside the record.
                                val samplesInner = record.samples
                                if (samplesInner.isNotEmpty()) {
                                    for (s in samplesInner) {
                                        val inner = JSObject()
                                        inner.put("uuid", "${meta.id}:${s.time}")
                                        inner.put("external_id", "${meta.id}:${s.time}")
                                        inner.put("sourceName", meta.dataOrigin.packageName)
                                        inner.put("unit", unit)
                                        inner.put("startDate", s.time.toString())
                                        inner.put("endDate", s.time.toString())
                                        inner.put("value", s.beatsPerMinute.toDouble())
                                        samples.put(inner)
                                    }
                                    continue
                                }
                            }
                            else -> {}
                        }
                        samples.put(obj)
                    }
                }
                val res = JSObject()
                res.put("samples", samples)
                call.resolve(res)
            } catch (t: Throwable) {
                Log.e(tag, "queryQuantity failed", t)
                call.reject("Query failed: ${t.message}")
            }
        }
    }

    // MARK: - queryCategory (sleep sessions)

    @PluginMethod
    fun queryCategory(call: PluginCall) {
        val metricType = call.getString("metricType") ?: call.getString("sampleType") ?: "sleep"
        val start = parseInstant(call.getString("startDate"))
        val end = parseInstant(call.getString("endDate"))
        if (start == null || end == null) {
            call.reject("startDate, endDate are required")
            return
        }
        val kls = recordClass(metricType)
        if (kls == null || kls != SleepSessionRecord::class) {
            call.reject("Unsupported category type: $metricType")
            return
        }
        Log.i(tag, "queryCategory metricType=$metricType range=$start..$end")
        scope.launch {
            try {
                val client = HealthConnectClient.getOrCreate(context)
                val samples = JSArray()
                withContext(Dispatchers.IO) {
                    val response = client.readRecords(
                        ReadRecordsRequest(
                            recordType = SleepSessionRecord::class,
                            timeRangeFilter = TimeRangeFilter.between(start, end)
                        )
                    )
                    for (record in response.records) {
                        val meta = record.metadata
                        val obj = JSObject()
                        obj.put("uuid", meta.id)
                        obj.put("external_id", meta.id)
                        obj.put("sourceName", meta.dataOrigin.packageName)
                        obj.put("startDate", record.startTime.toString())
                        obj.put("endDate", record.endTime.toString())
                        val durationSec = (record.endTime.epochSecond - record.startTime.epochSecond).toDouble()
                        obj.put("value", durationSec)
                        obj.put("unit", "seconds")
                        samples.put(obj)
                    }
                }
                val res = JSObject()
                res.put("samples", samples)
                call.resolve(res)
            } catch (t: Throwable) {
                Log.e(tag, "queryCategory failed", t)
                call.reject("Query failed: ${t.message}")
            }
        }
    }

    // MARK: - queryWorkouts

    @PluginMethod
    fun queryWorkouts(call: PluginCall) {
        val start = parseInstant(call.getString("startDate"))
        val end = parseInstant(call.getString("endDate"))
        if (start == null || end == null) {
            call.reject("startDate, endDate are required")
            return
        }
        Log.i(tag, "queryWorkouts range=$start..$end")
        scope.launch {
            try {
                val client = HealthConnectClient.getOrCreate(context)
                val workouts = JSArray()
                withContext(Dispatchers.IO) {
                    val response = client.readRecords(
                        ReadRecordsRequest(
                            recordType = ExerciseSessionRecord::class,
                            timeRangeFilter = TimeRangeFilter.between(start, end)
                        )
                    )
                    for (record in response.records) {
                        val meta = record.metadata
                        val obj = JSObject()
                        obj.put("uuid", meta.id)
                        obj.put("external_id", meta.id)
                        obj.put("sourceName", meta.dataOrigin.packageName)
                        obj.put("startDate", record.startTime.toString())
                        obj.put("endDate", record.endTime.toString())
                        val durationSec = (record.endTime.epochSecond - record.startTime.epochSecond).toDouble()
                        obj.put("duration", durationSec)
                        obj.put("activityType", record.exerciseType)
                        record.title?.let { obj.put("title", it) }

                        // Best-effort enrichment: aggregate HR + calories over the workout window.
                        try {
                            val sessionFilter = TimeRangeFilter.between(record.startTime, record.endTime)
                            val hrResp = client.readRecords(
                                ReadRecordsRequest(
                                    recordType = HeartRateRecord::class,
                                    timeRangeFilter = sessionFilter
                                )
                            )
                            var sum = 0.0
                            var count = 0
                            var maxHr = 0L
                            for (hr in hrResp.records) {
                                for (s in hr.samples) {
                                    sum += s.beatsPerMinute.toDouble()
                                    count += 1
                                    if (s.beatsPerMinute > maxHr) maxHr = s.beatsPerMinute
                                }
                            }
                            if (count > 0) {
                                obj.put("avgHr", sum / count)
                                obj.put("maxHr", maxHr.toDouble())
                            }
                        } catch (_: Throwable) {}
                        try {
                            val sessionFilter = TimeRangeFilter.between(record.startTime, record.endTime)
                            val calResp = client.readRecords(
                                ReadRecordsRequest(
                                    recordType = ActiveCaloriesBurnedRecord::class,
                                    timeRangeFilter = sessionFilter
                                )
                            )
                            var cal = 0.0
                            for (c in calResp.records) cal += c.energy.inKilocalories
                            if (cal > 0.0) obj.put("calories", cal)
                        } catch (_: Throwable) {}

                        workouts.put(obj)
                    }
                    // 'filter' is only referenced to satisfy Kotlin unused-variable warnings.
                    filter.hashCode()
                }
                val res = JSObject()
                res.put("workouts", workouts)
                call.resolve(res)
            } catch (t: Throwable) {
                Log.e(tag, "queryWorkouts failed", t)
                call.reject("Query failed: ${t.message}")
            }
        }
    }
}
