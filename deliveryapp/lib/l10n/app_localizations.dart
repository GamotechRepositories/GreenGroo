import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_hi.dart';
import 'app_localizations_kn.dart';
import 'app_localizations_mr.dart';
import 'app_localizations_ta.dart';
import 'app_localizations_te.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('hi'),
    Locale('kn'),
    Locale('mr'),
    Locale('ta'),
    Locale('te'),
  ];

  /// No description provided for @appTitle.
  ///
  /// In en, this message translates to:
  /// **'GreenRow Delivery'**
  String get appTitle;

  /// No description provided for @brandName.
  ///
  /// In en, this message translates to:
  /// **'GreenRow'**
  String get brandName;

  /// No description provided for @deliveryPartner.
  ///
  /// In en, this message translates to:
  /// **'Delivery Partner'**
  String get deliveryPartner;

  /// No description provided for @splashFooterTagline.
  ///
  /// In en, this message translates to:
  /// **'GreenRow  ·  Delivery Partner App'**
  String get splashFooterTagline;

  /// No description provided for @featureFastDelivery.
  ///
  /// In en, this message translates to:
  /// **'Fast\nDelivery'**
  String get featureFastDelivery;

  /// No description provided for @featureSafeSecure.
  ///
  /// In en, this message translates to:
  /// **'Safe &\nSecure'**
  String get featureSafeSecure;

  /// No description provided for @featureEarnMore.
  ///
  /// In en, this message translates to:
  /// **'Earn\nMore'**
  String get featureEarnMore;

  /// No description provided for @deliverSafeEarnMore.
  ///
  /// In en, this message translates to:
  /// **'Deliver Safe, Earn More'**
  String get deliverSafeEarnMore;

  /// No description provided for @followSafetyGuidelines.
  ///
  /// In en, this message translates to:
  /// **'Follow all safety guidelines and keep your ratings high!'**
  String get followSafetyGuidelines;

  /// No description provided for @trustedByPartnersIndia.
  ///
  /// In en, this message translates to:
  /// **'Trusted by delivery partners across India'**
  String get trustedByPartnersIndia;

  /// No description provided for @chooseLanguage.
  ///
  /// In en, this message translates to:
  /// **'Choose Language'**
  String get chooseLanguage;

  /// No description provided for @selectLanguageSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Select your preferred language to continue'**
  String get selectLanguageSubtitle;

  /// No description provided for @continueButton.
  ///
  /// In en, this message translates to:
  /// **'Continue'**
  String get continueButton;

  /// No description provided for @saveLanguage.
  ///
  /// In en, this message translates to:
  /// **'Save Language'**
  String get saveLanguage;

  /// No description provided for @languageChanged.
  ///
  /// In en, this message translates to:
  /// **'Language updated successfully'**
  String get languageChanged;

  /// No description provided for @languageEnglish.
  ///
  /// In en, this message translates to:
  /// **'English'**
  String get languageEnglish;

  /// No description provided for @languageHindi.
  ///
  /// In en, this message translates to:
  /// **'Hindi'**
  String get languageHindi;

  /// No description provided for @languageMarathi.
  ///
  /// In en, this message translates to:
  /// **'Marathi'**
  String get languageMarathi;

  /// No description provided for @languageTamil.
  ///
  /// In en, this message translates to:
  /// **'Tamil'**
  String get languageTamil;

  /// No description provided for @languageTelugu.
  ///
  /// In en, this message translates to:
  /// **'Telugu'**
  String get languageTelugu;

  /// No description provided for @languageKannada.
  ///
  /// In en, this message translates to:
  /// **'Kannada'**
  String get languageKannada;

  /// No description provided for @loginWithPhone.
  ///
  /// In en, this message translates to:
  /// **'Login with Phone'**
  String get loginWithPhone;

  /// No description provided for @enterOtp.
  ///
  /// In en, this message translates to:
  /// **'Enter OTP'**
  String get enterOtp;

  /// No description provided for @otpSentMessage.
  ///
  /// In en, this message translates to:
  /// **'We sent a 6-digit code to your number'**
  String get otpSentMessage;

  /// No description provided for @enterMobileToContinue.
  ///
  /// In en, this message translates to:
  /// **'Enter your mobile number to continue'**
  String get enterMobileToContinue;

  /// No description provided for @mobileNumber.
  ///
  /// In en, this message translates to:
  /// **'Mobile Number'**
  String get mobileNumber;

  /// No description provided for @mobileNumberHint.
  ///
  /// In en, this message translates to:
  /// **'10-digit mobile number'**
  String get mobileNumberHint;

  /// No description provided for @countryCodePrefix.
  ///
  /// In en, this message translates to:
  /// **'+91  '**
  String get countryCodePrefix;

  /// No description provided for @otp.
  ///
  /// In en, this message translates to:
  /// **'OTP'**
  String get otp;

  /// No description provided for @otpHint.
  ///
  /// In en, this message translates to:
  /// **'Enter 6-digit OTP'**
  String get otpHint;

  /// No description provided for @resendOtp.
  ///
  /// In en, this message translates to:
  /// **'Resend OTP'**
  String get resendOtp;

  /// No description provided for @sendOtp.
  ///
  /// In en, this message translates to:
  /// **'Send OTP'**
  String get sendOtp;

  /// No description provided for @verifyAndContinue.
  ///
  /// In en, this message translates to:
  /// **'Verify & Continue'**
  String get verifyAndContinue;

  /// No description provided for @changeNumber.
  ///
  /// In en, this message translates to:
  /// **'Change number'**
  String get changeNumber;

  /// No description provided for @needHelp.
  ///
  /// In en, this message translates to:
  /// **'Need help?'**
  String get needHelp;

  /// No description provided for @selectVehicle.
  ///
  /// In en, this message translates to:
  /// **'Select vehicle'**
  String get selectVehicle;

  /// No description provided for @vehicleMotorcycle.
  ///
  /// In en, this message translates to:
  /// **'Motorcycle'**
  String get vehicleMotorcycle;

  /// No description provided for @vehicleBicycle.
  ///
  /// In en, this message translates to:
  /// **'Bicycle'**
  String get vehicleBicycle;

  /// No description provided for @vehicleElectricScooter.
  ///
  /// In en, this message translates to:
  /// **'Electric scooter'**
  String get vehicleElectricScooter;

  /// No description provided for @vehicleVan.
  ///
  /// In en, this message translates to:
  /// **'Van'**
  String get vehicleVan;

  /// No description provided for @noVehicle.
  ///
  /// In en, this message translates to:
  /// **'I don\'t have a vehicle'**
  String get noVehicle;

  /// No description provided for @noVehicleSubtitle.
  ///
  /// In en, this message translates to:
  /// **'No vehicle? We\'ll help!'**
  String get noVehicleSubtitle;

  /// No description provided for @next.
  ///
  /// In en, this message translates to:
  /// **'Next'**
  String get next;

  /// No description provided for @selectCity.
  ///
  /// In en, this message translates to:
  /// **'Select City'**
  String get selectCity;

  /// No description provided for @whereWillYouDeliver.
  ///
  /// In en, this message translates to:
  /// **'Where will you deliver?'**
  String get whereWillYouDeliver;

  /// No description provided for @searchCity.
  ///
  /// In en, this message translates to:
  /// **'Search city'**
  String get searchCity;

  /// No description provided for @cityMumbai.
  ///
  /// In en, this message translates to:
  /// **'Mumbai'**
  String get cityMumbai;

  /// No description provided for @cityPune.
  ///
  /// In en, this message translates to:
  /// **'Pune'**
  String get cityPune;

  /// No description provided for @cityNagpur.
  ///
  /// In en, this message translates to:
  /// **'Nagpur'**
  String get cityNagpur;

  /// No description provided for @cityNashik.
  ///
  /// In en, this message translates to:
  /// **'Nashik'**
  String get cityNashik;

  /// No description provided for @cityThane.
  ///
  /// In en, this message translates to:
  /// **'Thane'**
  String get cityThane;

  /// No description provided for @cityAurangabad.
  ///
  /// In en, this message translates to:
  /// **'Aurangabad'**
  String get cityAurangabad;

  /// No description provided for @cityDelhi.
  ///
  /// In en, this message translates to:
  /// **'Delhi'**
  String get cityDelhi;

  /// No description provided for @cityBengaluru.
  ///
  /// In en, this message translates to:
  /// **'Bengaluru'**
  String get cityBengaluru;

  /// No description provided for @cityHyderabad.
  ///
  /// In en, this message translates to:
  /// **'Hyderabad'**
  String get cityHyderabad;

  /// No description provided for @cityChennai.
  ///
  /// In en, this message translates to:
  /// **'Chennai'**
  String get cityChennai;

  /// No description provided for @cityKolkata.
  ///
  /// In en, this message translates to:
  /// **'Kolkata'**
  String get cityKolkata;

  /// No description provided for @cityAhmedabad.
  ///
  /// In en, this message translates to:
  /// **'Ahmedabad'**
  String get cityAhmedabad;

  /// No description provided for @citySurat.
  ///
  /// In en, this message translates to:
  /// **'Surat'**
  String get citySurat;

  /// No description provided for @cityJaipur.
  ///
  /// In en, this message translates to:
  /// **'Jaipur'**
  String get cityJaipur;

  /// No description provided for @cityLucknow.
  ///
  /// In en, this message translates to:
  /// **'Lucknow'**
  String get cityLucknow;

  /// No description provided for @cityIndore.
  ///
  /// In en, this message translates to:
  /// **'Indore'**
  String get cityIndore;

  /// No description provided for @uploadDocuments.
  ///
  /// In en, this message translates to:
  /// **'Upload Documents'**
  String get uploadDocuments;

  /// No description provided for @uploadDocumentsSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Complete all documents and payment details to continue'**
  String get uploadDocumentsSubtitle;

  /// No description provided for @identityDocuments.
  ///
  /// In en, this message translates to:
  /// **'Identity Documents'**
  String get identityDocuments;

  /// No description provided for @aadhaarCard.
  ///
  /// In en, this message translates to:
  /// **'Aadhaar Card'**
  String get aadhaarCard;

  /// No description provided for @aadhaarCardSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Front side clearly visible'**
  String get aadhaarCardSubtitle;

  /// No description provided for @panCard.
  ///
  /// In en, this message translates to:
  /// **'PAN Card'**
  String get panCard;

  /// No description provided for @panCardSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Clear photo of PAN'**
  String get panCardSubtitle;

  /// No description provided for @passportSizePhoto.
  ///
  /// In en, this message translates to:
  /// **'Passport Size Photo'**
  String get passportSizePhoto;

  /// No description provided for @passportSizePhotoSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Recent passport-size photo'**
  String get passportSizePhotoSubtitle;

  /// No description provided for @drivingLicense.
  ///
  /// In en, this message translates to:
  /// **'Driving License'**
  String get drivingLicense;

  /// No description provided for @drivingLicenseSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Valid driving license'**
  String get drivingLicenseSubtitle;

  /// No description provided for @vehicleDocuments.
  ///
  /// In en, this message translates to:
  /// **'Vehicle Documents'**
  String get vehicleDocuments;

  /// No description provided for @vehicleRc.
  ///
  /// In en, this message translates to:
  /// **'Vehicle RC'**
  String get vehicleRc;

  /// No description provided for @vehicleRcSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Registration certificate'**
  String get vehicleRcSubtitle;

  /// No description provided for @insurance.
  ///
  /// In en, this message translates to:
  /// **'Insurance'**
  String get insurance;

  /// No description provided for @insuranceSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Valid vehicle insurance'**
  String get insuranceSubtitle;

  /// No description provided for @bankDetails.
  ///
  /// In en, this message translates to:
  /// **'Bank Details'**
  String get bankDetails;

  /// No description provided for @accountHolderName.
  ///
  /// In en, this message translates to:
  /// **'Account Holder Name'**
  String get accountHolderName;

  /// No description provided for @accountHolderNameHint.
  ///
  /// In en, this message translates to:
  /// **'Name as per bank account'**
  String get accountHolderNameHint;

  /// No description provided for @bankName.
  ///
  /// In en, this message translates to:
  /// **'Bank Name'**
  String get bankName;

  /// No description provided for @bankNameHint.
  ///
  /// In en, this message translates to:
  /// **'e.g. HDFC Bank'**
  String get bankNameHint;

  /// No description provided for @accountNumber.
  ///
  /// In en, this message translates to:
  /// **'Account Number'**
  String get accountNumber;

  /// No description provided for @accountNumberHint.
  ///
  /// In en, this message translates to:
  /// **'Enter account number'**
  String get accountNumberHint;

  /// No description provided for @ifscCode.
  ///
  /// In en, this message translates to:
  /// **'IFSC Code'**
  String get ifscCode;

  /// No description provided for @ifscCodeHint.
  ///
  /// In en, this message translates to:
  /// **'e.g. HDFC0001234'**
  String get ifscCodeHint;

  /// No description provided for @upiId.
  ///
  /// In en, this message translates to:
  /// **'UPI ID'**
  String get upiId;

  /// No description provided for @upiIdHint.
  ///
  /// In en, this message translates to:
  /// **'yourname@upi'**
  String get upiIdHint;

  /// No description provided for @uploadDocumentSheetTitle.
  ///
  /// In en, this message translates to:
  /// **'Upload document'**
  String get uploadDocumentSheetTitle;

  /// No description provided for @takePhoto.
  ///
  /// In en, this message translates to:
  /// **'Take photo'**
  String get takePhoto;

  /// No description provided for @chooseFromGallery.
  ///
  /// In en, this message translates to:
  /// **'Choose from gallery'**
  String get chooseFromGallery;

  /// No description provided for @uploadedTapToChange.
  ///
  /// In en, this message translates to:
  /// **'Uploaded · Tap to change'**
  String get uploadedTapToChange;

  /// No description provided for @takeRecentPhoto.
  ///
  /// In en, this message translates to:
  /// **'Take a Recent Photo'**
  String get takeRecentPhoto;

  /// No description provided for @selfieCaptureSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Capture a clear live selfie, then complete face verification'**
  String get selfieCaptureSubtitle;

  /// No description provided for @cameraPreview.
  ///
  /// In en, this message translates to:
  /// **'Camera preview'**
  String get cameraPreview;

  /// No description provided for @faceClearlyVisible.
  ///
  /// In en, this message translates to:
  /// **'Make sure your face is clearly visible'**
  String get faceClearlyVisible;

  /// No description provided for @selfieNextStepHint.
  ///
  /// In en, this message translates to:
  /// **'Great! Next you\'ll blink and move your head on camera'**
  String get selfieNextStepHint;

  /// No description provided for @openCamera.
  ///
  /// In en, this message translates to:
  /// **'Open Camera'**
  String get openCamera;

  /// No description provided for @continueToVerification.
  ///
  /// In en, this message translates to:
  /// **'Continue to Verification'**
  String get continueToVerification;

  /// No description provided for @retakePhoto.
  ///
  /// In en, this message translates to:
  /// **'Retake Photo'**
  String get retakePhoto;

  /// No description provided for @faceVerification.
  ///
  /// In en, this message translates to:
  /// **'Face Verification'**
  String get faceVerification;

  /// No description provided for @verificationComplete.
  ///
  /// In en, this message translates to:
  /// **'Verification Complete'**
  String get verificationComplete;

  /// No description provided for @livenessFollowPrompts.
  ///
  /// In en, this message translates to:
  /// **'Follow the on-screen prompts to verify it\'s really you'**
  String get livenessFollowPrompts;

  /// No description provided for @livenessSuccessMessage.
  ///
  /// In en, this message translates to:
  /// **'Your live identity check was successful'**
  String get livenessSuccessMessage;

  /// No description provided for @allChecksPassed.
  ///
  /// In en, this message translates to:
  /// **'All checks passed'**
  String get allChecksPassed;

  /// No description provided for @keepFaceInCircle.
  ///
  /// In en, this message translates to:
  /// **'Keep your face inside the circle'**
  String get keepFaceInCircle;

  /// No description provided for @continueToApp.
  ///
  /// In en, this message translates to:
  /// **'Continue to App'**
  String get continueToApp;

  /// No description provided for @tryAgain.
  ///
  /// In en, this message translates to:
  /// **'Try Again'**
  String get tryAgain;

  /// No description provided for @cameraAccessError.
  ///
  /// In en, this message translates to:
  /// **'Could not open camera. Please allow camera access and try again.'**
  String get cameraAccessError;

  /// No description provided for @livenessCenterFace.
  ///
  /// In en, this message translates to:
  /// **'Center your face in the circle'**
  String get livenessCenterFace;

  /// No description provided for @livenessBlink.
  ///
  /// In en, this message translates to:
  /// **'Blink your eyes'**
  String get livenessBlink;

  /// No description provided for @livenessLookLeft.
  ///
  /// In en, this message translates to:
  /// **'Turn your head left'**
  String get livenessLookLeft;

  /// No description provided for @livenessLookRight.
  ///
  /// In en, this message translates to:
  /// **'Turn your head right'**
  String get livenessLookRight;

  /// No description provided for @livenessLookUp.
  ///
  /// In en, this message translates to:
  /// **'Look up'**
  String get livenessLookUp;

  /// No description provided for @home.
  ///
  /// In en, this message translates to:
  /// **'Home'**
  String get home;

  /// No description provided for @dashboard.
  ///
  /// In en, this message translates to:
  /// **'Dashboard'**
  String get dashboard;

  /// No description provided for @orders.
  ///
  /// In en, this message translates to:
  /// **'Orders'**
  String get orders;

  /// No description provided for @navigation.
  ///
  /// In en, this message translates to:
  /// **'Navigation'**
  String get navigation;

  /// No description provided for @map.
  ///
  /// In en, this message translates to:
  /// **'Map'**
  String get map;

  /// No description provided for @wallet.
  ///
  /// In en, this message translates to:
  /// **'Wallet'**
  String get wallet;

  /// No description provided for @profile.
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get profile;

  /// No description provided for @activeOrders.
  ///
  /// In en, this message translates to:
  /// **'Active Orders'**
  String get activeOrders;

  /// No description provided for @history.
  ///
  /// In en, this message translates to:
  /// **'History'**
  String get history;

  /// No description provided for @attendance.
  ///
  /// In en, this message translates to:
  /// **'Attendance'**
  String get attendance;

  /// No description provided for @performance.
  ///
  /// In en, this message translates to:
  /// **'Performance'**
  String get performance;

  /// No description provided for @notifications.
  ///
  /// In en, this message translates to:
  /// **'Notifications'**
  String get notifications;

  /// No description provided for @documents.
  ///
  /// In en, this message translates to:
  /// **'Documents'**
  String get documents;

  /// No description provided for @vehicle.
  ///
  /// In en, this message translates to:
  /// **'Vehicle'**
  String get vehicle;

  /// No description provided for @support.
  ///
  /// In en, this message translates to:
  /// **'Support'**
  String get support;

  /// No description provided for @settings.
  ///
  /// In en, this message translates to:
  /// **'Settings'**
  String get settings;

  /// No description provided for @logout.
  ///
  /// In en, this message translates to:
  /// **'Logout'**
  String get logout;

  /// No description provided for @goodMorning.
  ///
  /// In en, this message translates to:
  /// **'Good Morning 👋'**
  String get goodMorning;

  /// No description provided for @beSafeDeliverHappiness.
  ///
  /// In en, this message translates to:
  /// **'Be safe and deliver happiness'**
  String get beSafeDeliverHappiness;

  /// No description provided for @online.
  ///
  /// In en, this message translates to:
  /// **'Online'**
  String get online;

  /// No description provided for @offline.
  ///
  /// In en, this message translates to:
  /// **'Offline'**
  String get offline;

  /// No description provided for @todaysEarnings.
  ///
  /// In en, this message translates to:
  /// **'Today\'s Earnings'**
  String get todaysEarnings;

  /// No description provided for @tapToViewDetails.
  ///
  /// In en, this message translates to:
  /// **'Tap to view details'**
  String get tapToViewDetails;

  /// No description provided for @todaysDeliveries.
  ///
  /// In en, this message translates to:
  /// **'Today\'s Deliveries'**
  String get todaysDeliveries;

  /// No description provided for @completedToday.
  ///
  /// In en, this message translates to:
  /// **'Completed today'**
  String get completedToday;

  /// No description provided for @performanceScore.
  ///
  /// In en, this message translates to:
  /// **'Performance Score'**
  String get performanceScore;

  /// No description provided for @thisWeek.
  ///
  /// In en, this message translates to:
  /// **'This week'**
  String get thisWeek;

  /// No description provided for @customerRating.
  ///
  /// In en, this message translates to:
  /// **'Customer Rating'**
  String get customerRating;

  /// No description provided for @averageRating.
  ///
  /// In en, this message translates to:
  /// **'Average rating'**
  String get averageRating;

  /// No description provided for @activeDelivery.
  ///
  /// In en, this message translates to:
  /// **'Active Delivery'**
  String get activeDelivery;

  /// No description provided for @inProgress.
  ///
  /// In en, this message translates to:
  /// **'In Progress'**
  String get inProgress;

  /// No description provided for @viewDetails.
  ///
  /// In en, this message translates to:
  /// **'View details'**
  String get viewDetails;

  /// No description provided for @pickUp.
  ///
  /// In en, this message translates to:
  /// **'Pick Up'**
  String get pickUp;

  /// No description provided for @storeLocation.
  ///
  /// In en, this message translates to:
  /// **'Store location'**
  String get storeLocation;

  /// No description provided for @dropOff.
  ///
  /// In en, this message translates to:
  /// **'Drop Off'**
  String get dropOff;

  /// No description provided for @customerLocation.
  ///
  /// In en, this message translates to:
  /// **'Customer location'**
  String get customerLocation;

  /// No description provided for @quickActions.
  ///
  /// In en, this message translates to:
  /// **'Quick Actions'**
  String get quickActions;

  /// No description provided for @seeAll.
  ///
  /// In en, this message translates to:
  /// **'See all'**
  String get seeAll;

  /// No description provided for @newOrders.
  ///
  /// In en, this message translates to:
  /// **'New Orders'**
  String get newOrders;

  /// No description provided for @navigate.
  ///
  /// In en, this message translates to:
  /// **'Navigate'**
  String get navigate;

  /// No description provided for @recentOrders.
  ///
  /// In en, this message translates to:
  /// **'Recent Orders'**
  String get recentOrders;

  /// No description provided for @acceptanceRate.
  ///
  /// In en, this message translates to:
  /// **'Acceptance Rate'**
  String get acceptanceRate;

  /// No description provided for @last7Days.
  ///
  /// In en, this message translates to:
  /// **'Last 7 days'**
  String get last7Days;

  /// No description provided for @placeholderStoreName.
  ///
  /// In en, this message translates to:
  /// **'Store Name'**
  String get placeholderStoreName;

  /// No description provided for @placeholderCustomerName.
  ///
  /// In en, this message translates to:
  /// **'Customer Name'**
  String get placeholderCustomerName;

  /// No description provided for @placeholderPickupAddress.
  ///
  /// In en, this message translates to:
  /// **'Pickup address'**
  String get placeholderPickupAddress;

  /// No description provided for @placeholderDropAddress.
  ///
  /// In en, this message translates to:
  /// **'Drop address'**
  String get placeholderDropAddress;

  /// No description provided for @placeholderDistanceKm.
  ///
  /// In en, this message translates to:
  /// **'— km'**
  String get placeholderDistanceKm;

  /// No description provided for @placeholderEarnings.
  ///
  /// In en, this message translates to:
  /// **'₹ —'**
  String get placeholderEarnings;

  /// No description provided for @placeholderTimeMin.
  ///
  /// In en, this message translates to:
  /// **'— min'**
  String get placeholderTimeMin;

  /// No description provided for @placeholderPercent.
  ///
  /// In en, this message translates to:
  /// **'—%'**
  String get placeholderPercent;

  /// No description provided for @placeholderDash.
  ///
  /// In en, this message translates to:
  /// **'—'**
  String get placeholderDash;

  /// No description provided for @newOrdersSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Accept orders to start earning'**
  String get newOrdersSubtitle;

  /// No description provided for @placeholderPickupAddressLine.
  ///
  /// In en, this message translates to:
  /// **'Pickup address line'**
  String get placeholderPickupAddressLine;

  /// No description provided for @placeholderDropAddressLine.
  ///
  /// In en, this message translates to:
  /// **'Drop address line'**
  String get placeholderDropAddressLine;

  /// No description provided for @statusNew.
  ///
  /// In en, this message translates to:
  /// **'New'**
  String get statusNew;

  /// No description provided for @pickup.
  ///
  /// In en, this message translates to:
  /// **'Pickup'**
  String get pickup;

  /// No description provided for @drop.
  ///
  /// In en, this message translates to:
  /// **'Drop'**
  String get drop;

  /// No description provided for @reject.
  ///
  /// In en, this message translates to:
  /// **'Reject'**
  String get reject;

  /// No description provided for @accept.
  ///
  /// In en, this message translates to:
  /// **'Accept'**
  String get accept;

  /// No description provided for @orderInProgress.
  ///
  /// In en, this message translates to:
  /// **'Order in progress'**
  String get orderInProgress;

  /// No description provided for @headingToPickup.
  ///
  /// In en, this message translates to:
  /// **'Heading to Pickup'**
  String get headingToPickup;

  /// No description provided for @storeAddress.
  ///
  /// In en, this message translates to:
  /// **'Store address'**
  String get storeAddress;

  /// No description provided for @customer.
  ///
  /// In en, this message translates to:
  /// **'Customer'**
  String get customer;

  /// No description provided for @deliveryAddress.
  ///
  /// In en, this message translates to:
  /// **'Delivery address'**
  String get deliveryAddress;

  /// No description provided for @deliveryOtp.
  ///
  /// In en, this message translates to:
  /// **'Delivery OTP'**
  String get deliveryOtp;

  /// No description provided for @otpPlaceholder.
  ///
  /// In en, this message translates to:
  /// **'— — — —'**
  String get otpPlaceholder;

  /// No description provided for @askCustomerForOtp.
  ///
  /// In en, this message translates to:
  /// **'Ask customer for OTP'**
  String get askCustomerForOtp;

  /// No description provided for @timelineAssigned.
  ///
  /// In en, this message translates to:
  /// **'Assigned'**
  String get timelineAssigned;

  /// No description provided for @timelineAssignedSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Order assigned to you'**
  String get timelineAssignedSubtitle;

  /// No description provided for @timelinePickUp.
  ///
  /// In en, this message translates to:
  /// **'Pick Up'**
  String get timelinePickUp;

  /// No description provided for @timelinePickUpSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Collect from store'**
  String get timelinePickUpSubtitle;

  /// No description provided for @timelineDelivered.
  ///
  /// In en, this message translates to:
  /// **'Delivered'**
  String get timelineDelivered;

  /// No description provided for @timelineDeliveredSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Hand over to customer'**
  String get timelineDeliveredSubtitle;

  /// No description provided for @callCustomer.
  ///
  /// In en, this message translates to:
  /// **'Call Customer'**
  String get callCustomer;

  /// No description provided for @pickedUp.
  ///
  /// In en, this message translates to:
  /// **'Picked Up'**
  String get pickedUp;

  /// No description provided for @delivered.
  ///
  /// In en, this message translates to:
  /// **'Delivered'**
  String get delivered;

  /// No description provided for @liveMap.
  ///
  /// In en, this message translates to:
  /// **'Live Map'**
  String get liveMap;

  /// No description provided for @mapIntegrationComingSoon.
  ///
  /// In en, this message translates to:
  /// **'Map integration coming soon'**
  String get mapIntegrationComingSoon;

  /// No description provided for @enRoute.
  ///
  /// In en, this message translates to:
  /// **'En Route'**
  String get enRoute;

  /// No description provided for @etaMin.
  ///
  /// In en, this message translates to:
  /// **'ETA — min'**
  String get etaMin;

  /// No description provided for @store.
  ///
  /// In en, this message translates to:
  /// **'Store'**
  String get store;

  /// No description provided for @distance.
  ///
  /// In en, this message translates to:
  /// **'Distance'**
  String get distance;

  /// No description provided for @distanceRemaining.
  ///
  /// In en, this message translates to:
  /// **'— km remaining'**
  String get distanceRemaining;

  /// No description provided for @deliveryHistory.
  ///
  /// In en, this message translates to:
  /// **'Delivery History'**
  String get deliveryHistory;

  /// No description provided for @today.
  ///
  /// In en, this message translates to:
  /// **'Today'**
  String get today;

  /// No description provided for @week.
  ///
  /// In en, this message translates to:
  /// **'Week'**
  String get week;

  /// No description provided for @month.
  ///
  /// In en, this message translates to:
  /// **'Month'**
  String get month;

  /// No description provided for @orderId.
  ///
  /// In en, this message translates to:
  /// **'Order ID —'**
  String get orderId;

  /// No description provided for @amount.
  ///
  /// In en, this message translates to:
  /// **'Amount'**
  String get amount;

  /// No description provided for @date.
  ///
  /// In en, this message translates to:
  /// **'Date'**
  String get date;

  /// No description provided for @labelWithColon.
  ///
  /// In en, this message translates to:
  /// **'{label}:'**
  String labelWithColon(String label);

  /// No description provided for @earnings.
  ///
  /// In en, this message translates to:
  /// **'Earnings'**
  String get earnings;

  /// No description provided for @trackYourIncome.
  ///
  /// In en, this message translates to:
  /// **'Track your income'**
  String get trackYourIncome;

  /// No description provided for @updatedLive.
  ///
  /// In en, this message translates to:
  /// **'Updated live'**
  String get updatedLive;

  /// No description provided for @weekly.
  ///
  /// In en, this message translates to:
  /// **'Weekly'**
  String get weekly;

  /// No description provided for @monthly.
  ///
  /// In en, this message translates to:
  /// **'Monthly'**
  String get monthly;

  /// No description provided for @bonus.
  ///
  /// In en, this message translates to:
  /// **'Bonus'**
  String get bonus;

  /// No description provided for @incentives.
  ///
  /// In en, this message translates to:
  /// **'Incentives'**
  String get incentives;

  /// No description provided for @earningsChart.
  ///
  /// In en, this message translates to:
  /// **'Earnings Chart'**
  String get earningsChart;

  /// No description provided for @transactions.
  ///
  /// In en, this message translates to:
  /// **'Transactions'**
  String get transactions;

  /// No description provided for @deliveryPayment.
  ///
  /// In en, this message translates to:
  /// **'Delivery Payment'**
  String get deliveryPayment;

  /// No description provided for @dayMon.
  ///
  /// In en, this message translates to:
  /// **'M'**
  String get dayMon;

  /// No description provided for @dayTue.
  ///
  /// In en, this message translates to:
  /// **'T'**
  String get dayTue;

  /// No description provided for @dayWed.
  ///
  /// In en, this message translates to:
  /// **'W'**
  String get dayWed;

  /// No description provided for @dayThu.
  ///
  /// In en, this message translates to:
  /// **'T'**
  String get dayThu;

  /// No description provided for @dayFri.
  ///
  /// In en, this message translates to:
  /// **'F'**
  String get dayFri;

  /// No description provided for @daySat.
  ///
  /// In en, this message translates to:
  /// **'S'**
  String get daySat;

  /// No description provided for @daySun.
  ///
  /// In en, this message translates to:
  /// **'S'**
  String get daySun;

  /// No description provided for @walletBalance.
  ///
  /// In en, this message translates to:
  /// **'Wallet Balance'**
  String get walletBalance;

  /// No description provided for @withdraw.
  ///
  /// In en, this message translates to:
  /// **'Withdraw'**
  String get withdraw;

  /// No description provided for @manageYourEarnings.
  ///
  /// In en, this message translates to:
  /// **'Manage your earnings'**
  String get manageYourEarnings;

  /// No description provided for @recentTransactions.
  ///
  /// In en, this message translates to:
  /// **'Recent Transactions'**
  String get recentTransactions;

  /// No description provided for @accountHolder.
  ///
  /// In en, this message translates to:
  /// **'Account Holder'**
  String get accountHolder;

  /// No description provided for @accountNumberMasked.
  ///
  /// In en, this message translates to:
  /// **'— — — —'**
  String get accountNumberMasked;

  /// No description provided for @transaction.
  ///
  /// In en, this message translates to:
  /// **'Transaction'**
  String get transaction;

  /// No description provided for @trackWorkingHours.
  ///
  /// In en, this message translates to:
  /// **'Track your working hours'**
  String get trackWorkingHours;

  /// No description provided for @monthYear.
  ///
  /// In en, this message translates to:
  /// **'Month Year'**
  String get monthYear;

  /// No description provided for @loginTime.
  ///
  /// In en, this message translates to:
  /// **'Login Time'**
  String get loginTime;

  /// No description provided for @logoutTime.
  ///
  /// In en, this message translates to:
  /// **'Logout Time'**
  String get logoutTime;

  /// No description provided for @workingHours.
  ///
  /// In en, this message translates to:
  /// **'Working Hours'**
  String get workingHours;

  /// No description provided for @breakTime.
  ///
  /// In en, this message translates to:
  /// **'Break Time'**
  String get breakTime;

  /// No description provided for @timePlaceholder.
  ///
  /// In en, this message translates to:
  /// **'— : —'**
  String get timePlaceholder;

  /// No description provided for @workingHoursPlaceholder.
  ///
  /// In en, this message translates to:
  /// **'— h — m'**
  String get workingHoursPlaceholder;

  /// No description provided for @breakTimePlaceholder.
  ///
  /// In en, this message translates to:
  /// **'— m'**
  String get breakTimePlaceholder;

  /// No description provided for @attendanceHistory.
  ///
  /// In en, this message translates to:
  /// **'Attendance History'**
  String get attendanceHistory;

  /// No description provided for @datePlaceholder.
  ///
  /// In en, this message translates to:
  /// **'Date —'**
  String get datePlaceholder;

  /// No description provided for @hoursWorked.
  ///
  /// In en, this message translates to:
  /// **'— h — m worked'**
  String get hoursWorked;

  /// No description provided for @deliveryMetrics.
  ///
  /// In en, this message translates to:
  /// **'Your delivery metrics'**
  String get deliveryMetrics;

  /// No description provided for @score.
  ///
  /// In en, this message translates to:
  /// **'Score'**
  String get score;

  /// No description provided for @onTimeDelivery.
  ///
  /// In en, this message translates to:
  /// **'On Time Delivery'**
  String get onTimeDelivery;

  /// No description provided for @cancellationRate.
  ///
  /// In en, this message translates to:
  /// **'Cancellation Rate'**
  String get cancellationRate;

  /// No description provided for @leaderboardPosition.
  ///
  /// In en, this message translates to:
  /// **'Leaderboard Position'**
  String get leaderboardPosition;

  /// No description provided for @leaderboardRank.
  ///
  /// In en, this message translates to:
  /// **'# —'**
  String get leaderboardRank;

  /// No description provided for @inYourZone.
  ///
  /// In en, this message translates to:
  /// **'In your zone'**
  String get inYourZone;

  /// No description provided for @stayUpdated.
  ///
  /// In en, this message translates to:
  /// **'Stay updated'**
  String get stayUpdated;

  /// No description provided for @notificationNewOrder.
  ///
  /// In en, this message translates to:
  /// **'New Order'**
  String get notificationNewOrder;

  /// No description provided for @notificationNewOrderMessage.
  ///
  /// In en, this message translates to:
  /// **'A new delivery order is available near you'**
  String get notificationNewOrderMessage;

  /// No description provided for @notificationPaymentReceived.
  ///
  /// In en, this message translates to:
  /// **'Payment Received'**
  String get notificationPaymentReceived;

  /// No description provided for @notificationPaymentMessage.
  ///
  /// In en, this message translates to:
  /// **'Your delivery payment has been credited'**
  String get notificationPaymentMessage;

  /// No description provided for @notificationIncentiveUnlocked.
  ///
  /// In en, this message translates to:
  /// **'Incentive Unlocked'**
  String get notificationIncentiveUnlocked;

  /// No description provided for @notificationIncentiveMessage.
  ///
  /// In en, this message translates to:
  /// **'You unlocked a weekly bonus incentive'**
  String get notificationIncentiveMessage;

  /// No description provided for @notificationAnnouncement.
  ///
  /// In en, this message translates to:
  /// **'Announcement'**
  String get notificationAnnouncement;

  /// No description provided for @notificationAnnouncementMessage.
  ///
  /// In en, this message translates to:
  /// **'New safety guidelines for delivery partners'**
  String get notificationAnnouncementMessage;

  /// No description provided for @notificationSupportUpdate.
  ///
  /// In en, this message translates to:
  /// **'Support Update'**
  String get notificationSupportUpdate;

  /// No description provided for @notificationSupportMessage.
  ///
  /// In en, this message translates to:
  /// **'Your support ticket has been updated'**
  String get notificationSupportMessage;

  /// No description provided for @timeMinAgo.
  ///
  /// In en, this message translates to:
  /// **'— min ago'**
  String get timeMinAgo;

  /// No description provided for @timeHourAgo.
  ///
  /// In en, this message translates to:
  /// **'— hour ago'**
  String get timeHourAgo;

  /// No description provided for @timeDayAgo.
  ///
  /// In en, this message translates to:
  /// **'— day ago'**
  String get timeDayAgo;

  /// No description provided for @partnerName.
  ///
  /// In en, this message translates to:
  /// **'Partner Name'**
  String get partnerName;

  /// No description provided for @partnerId.
  ///
  /// In en, this message translates to:
  /// **'ID: — — —'**
  String get partnerId;

  /// No description provided for @editProfile.
  ///
  /// In en, this message translates to:
  /// **'Edit Profile'**
  String get editProfile;

  /// No description provided for @driverInformation.
  ///
  /// In en, this message translates to:
  /// **'Driver Information'**
  String get driverInformation;

  /// No description provided for @personalDetails.
  ///
  /// In en, this message translates to:
  /// **'Personal details'**
  String get personalDetails;

  /// No description provided for @vehicleInformation.
  ///
  /// In en, this message translates to:
  /// **'Vehicle Information'**
  String get vehicleInformation;

  /// No description provided for @bikeDetails.
  ///
  /// In en, this message translates to:
  /// **'Bike details'**
  String get bikeDetails;

  /// No description provided for @license.
  ///
  /// In en, this message translates to:
  /// **'License'**
  String get license;

  /// No description provided for @verificationDocuments.
  ///
  /// In en, this message translates to:
  /// **'Verification documents'**
  String get verificationDocuments;

  /// No description provided for @uploadAndVerifyDocuments.
  ///
  /// In en, this message translates to:
  /// **'Upload and verify documents'**
  String get uploadAndVerifyDocuments;

  /// No description provided for @docDrivingLicense.
  ///
  /// In en, this message translates to:
  /// **'Driving License'**
  String get docDrivingLicense;

  /// No description provided for @docPan.
  ///
  /// In en, this message translates to:
  /// **'PAN'**
  String get docPan;

  /// No description provided for @docAadhaar.
  ///
  /// In en, this message translates to:
  /// **'Aadhaar'**
  String get docAadhaar;

  /// No description provided for @docVehicleRc.
  ///
  /// In en, this message translates to:
  /// **'Vehicle RC'**
  String get docVehicleRc;

  /// No description provided for @upload.
  ///
  /// In en, this message translates to:
  /// **'Upload'**
  String get upload;

  /// No description provided for @pending.
  ///
  /// In en, this message translates to:
  /// **'Pending'**
  String get pending;

  /// No description provided for @vehicleDetails.
  ///
  /// In en, this message translates to:
  /// **'Vehicle Details'**
  String get vehicleDetails;

  /// No description provided for @yourDeliveryVehicle.
  ///
  /// In en, this message translates to:
  /// **'Your delivery vehicle'**
  String get yourDeliveryVehicle;

  /// No description provided for @active.
  ///
  /// In en, this message translates to:
  /// **'Active'**
  String get active;

  /// No description provided for @bikeDetailsTitle.
  ///
  /// In en, this message translates to:
  /// **'Bike Details'**
  String get bikeDetailsTitle;

  /// No description provided for @registrationNumber.
  ///
  /// In en, this message translates to:
  /// **'Registration Number'**
  String get registrationNumber;

  /// No description provided for @pollutionCertificate.
  ///
  /// In en, this message translates to:
  /// **'Pollution Certificate'**
  String get pollutionCertificate;

  /// No description provided for @vehicleStatus.
  ///
  /// In en, this message translates to:
  /// **'Vehicle Status'**
  String get vehicleStatus;

  /// No description provided for @verified.
  ///
  /// In en, this message translates to:
  /// **'Verified'**
  String get verified;

  /// No description provided for @weAreHereToHelp.
  ///
  /// In en, this message translates to:
  /// **'We are here to help'**
  String get weAreHereToHelp;

  /// No description provided for @faq.
  ///
  /// In en, this message translates to:
  /// **'FAQ'**
  String get faq;

  /// No description provided for @commonQuestions.
  ///
  /// In en, this message translates to:
  /// **'Common questions'**
  String get commonQuestions;

  /// No description provided for @chatSupport.
  ///
  /// In en, this message translates to:
  /// **'Chat Support'**
  String get chatSupport;

  /// No description provided for @chatWithTeam.
  ///
  /// In en, this message translates to:
  /// **'Chat with our team'**
  String get chatWithTeam;

  /// No description provided for @callSupport.
  ///
  /// In en, this message translates to:
  /// **'Call Support'**
  String get callSupport;

  /// No description provided for @talkToSupportAgent.
  ///
  /// In en, this message translates to:
  /// **'Talk to support agent'**
  String get talkToSupportAgent;

  /// No description provided for @raiseTicket.
  ///
  /// In en, this message translates to:
  /// **'Raise Ticket'**
  String get raiseTicket;

  /// No description provided for @submitSupportRequest.
  ///
  /// In en, this message translates to:
  /// **'Submit a support request'**
  String get submitSupportRequest;

  /// No description provided for @support247.
  ///
  /// In en, this message translates to:
  /// **'24/7 Support'**
  String get support247;

  /// No description provided for @supportAvailableRoundClock.
  ///
  /// In en, this message translates to:
  /// **'Our team is available round the clock'**
  String get supportAvailableRoundClock;

  /// No description provided for @darkMode.
  ///
  /// In en, this message translates to:
  /// **'Dark Mode'**
  String get darkMode;

  /// No description provided for @darkThemeOn.
  ///
  /// In en, this message translates to:
  /// **'Dark theme is on'**
  String get darkThemeOn;

  /// No description provided for @lightThemeOn.
  ///
  /// In en, this message translates to:
  /// **'Light theme is on'**
  String get lightThemeOn;

  /// No description provided for @language.
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get language;

  /// No description provided for @pushNotifications.
  ///
  /// In en, this message translates to:
  /// **'Push Notifications'**
  String get pushNotifications;

  /// No description provided for @orderAlerts.
  ///
  /// In en, this message translates to:
  /// **'Order Alerts'**
  String get orderAlerts;

  /// No description provided for @privacy.
  ///
  /// In en, this message translates to:
  /// **'Privacy'**
  String get privacy;

  /// No description provided for @privacyPolicyTerms.
  ///
  /// In en, this message translates to:
  /// **'Privacy policy & terms'**
  String get privacyPolicyTerms;

  /// No description provided for @password.
  ///
  /// In en, this message translates to:
  /// **'Password'**
  String get password;

  /// No description provided for @passwordHint.
  ///
  /// In en, this message translates to:
  /// **'Enter password (min 6 chars)'**
  String get passwordHint;

  /// No description provided for @login.
  ///
  /// In en, this message translates to:
  /// **'Login'**
  String get login;

  /// No description provided for @register.
  ///
  /// In en, this message translates to:
  /// **'Register'**
  String get register;

  /// No description provided for @createAccount.
  ///
  /// In en, this message translates to:
  /// **'Create Account'**
  String get createAccount;

  /// No description provided for @alreadyHaveAccount.
  ///
  /// In en, this message translates to:
  /// **'Already have an account? Login'**
  String get alreadyHaveAccount;

  /// No description provided for @dontHaveAccount.
  ///
  /// In en, this message translates to:
  /// **'New partner? Register'**
  String get dontHaveAccount;

  /// No description provided for @enterPhoneAndPassword.
  ///
  /// In en, this message translates to:
  /// **'Enter your phone number and password'**
  String get enterPhoneAndPassword;

  /// No description provided for @authError.
  ///
  /// In en, this message translates to:
  /// **'Something went wrong. Please try again.'**
  String get authError;

  /// No description provided for @selectArea.
  ///
  /// In en, this message translates to:
  /// **'Select Area'**
  String get selectArea;

  /// No description provided for @selectAreaSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Choose your delivery area'**
  String get selectAreaSubtitle;

  /// No description provided for @searchArea.
  ///
  /// In en, this message translates to:
  /// **'Search area'**
  String get searchArea;

  /// No description provided for @noAreasFound.
  ///
  /// In en, this message translates to:
  /// **'No areas found'**
  String get noAreasFound;

  /// No description provided for @verificationPendingTitle.
  ///
  /// In en, this message translates to:
  /// **'Verification in progress'**
  String get verificationPendingTitle;

  /// No description provided for @verificationPendingHours.
  ///
  /// In en, this message translates to:
  /// **'Document & identity verification usually completes within 3–6 hours.'**
  String get verificationPendingHours;

  /// No description provided for @verificationOfflineVisit.
  ///
  /// In en, this message translates to:
  /// **'Please visit your area Delivery Manager for offline verification with original documents.'**
  String get verificationOfflineVisit;

  /// No description provided for @verificationManagerLabel.
  ///
  /// In en, this message translates to:
  /// **'Delivery Manager'**
  String get verificationManagerLabel;

  /// No description provided for @verificationStoreLabel.
  ///
  /// In en, this message translates to:
  /// **'Store'**
  String get verificationStoreLabel;

  /// No description provided for @verificationAddressLabel.
  ///
  /// In en, this message translates to:
  /// **'Address'**
  String get verificationAddressLabel;

  /// No description provided for @verificationPhoneLabel.
  ///
  /// In en, this message translates to:
  /// **'Phone'**
  String get verificationPhoneLabel;

  /// No description provided for @verificationNoManagerYet.
  ///
  /// In en, this message translates to:
  /// **'No delivery manager is registered for your area yet. Stay offline until verification is assigned.'**
  String get verificationNoManagerYet;

  /// No description provided for @verificationCannotGoOnline.
  ///
  /// In en, this message translates to:
  /// **'You can go online after verification is complete.'**
  String get verificationCannotGoOnline;

  /// No description provided for @verificationApprovedTitle.
  ///
  /// In en, this message translates to:
  /// **'You\'re verified'**
  String get verificationApprovedTitle;

  /// No description provided for @verificationApprovedToast.
  ///
  /// In en, this message translates to:
  /// **'Verified! You can go online now.'**
  String get verificationApprovedToast;

  /// No description provided for @verificationRejectedTitle.
  ///
  /// In en, this message translates to:
  /// **'Verification rejected'**
  String get verificationRejectedTitle;

  /// No description provided for @verificationRejectedHint.
  ///
  /// In en, this message translates to:
  /// **'Contact your area delivery manager for help.'**
  String get verificationRejectedHint;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) => <String>[
    'en',
    'hi',
    'kn',
    'mr',
    'ta',
    'te',
  ].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'hi':
      return AppLocalizationsHi();
    case 'kn':
      return AppLocalizationsKn();
    case 'mr':
      return AppLocalizationsMr();
    case 'ta':
      return AppLocalizationsTa();
    case 'te':
      return AppLocalizationsTe();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
