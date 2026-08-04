package com.bulkmobilemart.app

import android.content.Intent
import android.os.Bundle
import androidx.activity.OnBackPressedCallback
import androidx.core.view.WindowCompat
import io.flutter.embedding.android.FlutterFragmentActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterFragmentActivity() {
    private val backChannelName = "com.bulkmobilemart.app/back"
    private var backChannel: MethodChannel? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        super.onCreate(savedInstanceState)
    }

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        val channel = MethodChannel(
            flutterEngine.dartExecutor.binaryMessenger,
            backChannelName,
        )
        backChannel = channel

        // Take priority over Flutter's default back callback so shell tabs
        // (Cart/Orders/…) go Home instead of finishing the Activity.
        onBackPressedDispatcher.addCallback(
            this,
            object : OnBackPressedCallback(true) {
                override fun handleOnBackPressed() {
                    val active = backChannel
                    if (active == null) {
                        isEnabled = false
                        onBackPressedDispatcher.onBackPressed()
                        isEnabled = true
                        return
                    }

                    active.invokeMethod(
                        "onBack",
                        null,
                        object : MethodChannel.Result {
                            override fun success(result: Any?) {
                                when (result) {
                                    true -> return
                                    "exit" -> {
                                        finish()
                                        return
                                    }
                                    else -> {
                                        isEnabled = false
                                        try {
                                            onBackPressedDispatcher.onBackPressed()
                                        } finally {
                                            isEnabled = true
                                        }
                                    }
                                }
                            }

                            override fun error(
                                errorCode: String,
                                errorMessage: String?,
                                errorDetails: Any?,
                            ) {
                                isEnabled = false
                                try {
                                    onBackPressedDispatcher.onBackPressed()
                                } finally {
                                    isEnabled = true
                                }
                            }

                            override fun notImplemented() {
                                isEnabled = false
                                try {
                                    onBackPressedDispatcher.onBackPressed()
                                } finally {
                                    isEnabled = true
                                }
                            }
                        },
                    )
                }
            },
        )
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
    }
}
