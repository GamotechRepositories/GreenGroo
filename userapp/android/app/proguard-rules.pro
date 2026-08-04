# Flutter deferred components (not used — suppress Play Core references)
-dontwarn com.google.android.play.core.**

# Razorpay SDK
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes JavascriptInterface
-keepattributes *Annotation*

-dontwarn com.razorpay.**
-keep class com.razorpay.** { *; }

# Flutter
-keep class io.flutter.** { *; }

# Firebase Cloud Messaging
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
