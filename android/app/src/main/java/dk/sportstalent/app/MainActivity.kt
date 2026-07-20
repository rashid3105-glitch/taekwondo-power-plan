package dk.sportstalent.app

import android.os.Bundle
import android.util.Log
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        // Register local Capacitor plugins BEFORE super.onCreate so the bridge picks them up.
        registerPlugin(SportstalentHealthConnect::class.java)
        Log.i("SportstalentHealthConnect", "SportstalentHealthConnect registered in bridge")
        super.onCreate(savedInstanceState)
    }
}
