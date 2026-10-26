# Flutter Wrapper
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.** { *; }
-keep class io.flutter.util.** { *; }
-keep class io.flutter.view.** { *; }
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }

# Firebase & Google Services
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**
-keep class io.flutter.plugins.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

# Google Play Core / Deferred Components (suppress optional missing classes)
-dontwarn com.google.android.play.core.**
-dontwarn io.flutter.embedding.android.FlutterPlayStoreSplitApplication

# Preserve annotations and signatures
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes InnerClasses
-keepattributes EnclosingMethod
-keepattributes SourceFile,LineNumberTable
