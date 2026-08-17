/**
 * Government Agricultural Schemes Data for Farmers
 * Maharashtra State & Central Government Schemes with Eligibility, Required Documents, Application Process, and Important Dates
 */

export const SCHEME_CATEGORIES = [
  "All Schemes",
  "Financial Benefit",
  "Irrigation & Drip",
  "Solar & Energy",
  "Crop Insurance",
  "Machinery & Equipment",
  "Dairy & Livestock",
];

export const SCHEME_STATUS = [
  "All Status",
  "Active (अर्जासाठी खुले)",
  "Closing Soon (अंतिम तारीख जवळ)",
  "Upcoming (लवकरच सुरू)",
];

export const GOVERNMENT_SCHEMES = [
  {
    id: "scheme-1",
    title: "PM Krishi Sinchayee Yojana — Micro Irrigation (ठिबक व तुषार सिंचन अनुदान)",
    shortName: "PMKSY Drip & Sprinkler Subsidy",
    govtLevel: "State & Central Joint (महाडीबीटी)",
    category: "Irrigation & Drip",
    subsidyAmount: "80% Subsidy (80% पर्यंत अनुदान)",
    maxBenefit: "Up to ₹85,000 per Hectare",
    status: "Active (अर्जासाठी खुले)",
    statusBadge: "active",
    deadline: "31 August 2026",
    daysLeft: 14,
    description: "शेतकऱ्यांना ठिबक आणि तुषार सिंचन संच बसवण्यासाठी ८०% पर्यंत शासकीय अनुदान दिले जाते. पाण्याचा वापर कमी करून उत्पन्न वाढवण्यासाठी ही अत्यंत महत्त्वाची योजना आहे.",
    image: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=600&h=400&q=80",
    
    // Eligibility Requirements
    eligibility: [
      "शेतकऱ्याच्या नावावर किमान ०.२० हेक्टर (२० गुंठे) जमीन असावी.",
      "जमिनीचा ७/१२ आणि ८-अ उतारा अद्ययावत असणे आवश्यक.",
      "शेतात विहीर, कूपनलिका, किंवा पाण्याचा कायमस्वरूपी स्त्रोत असावा.",
      "अल्प व अल्पभूधारक (Small & Marginal) शेतकऱ्यांना प्राधान्य.",
      "मागील ५ वर्षात या घटकाचा शासकीय लाभ घेतलेला नसावा.",
    ],

    // Required Documents Checklist
    documents: [
      { name: "७/१२ आणि ८-अ उतारा (7/12 & 8A Extract)", required: true },
      { name: "आधार कार्ड (Aadhaar Card linked with Mobile)", required: true },
      { name: "बँक पासबुक पहिल्या पानाची प्रत (Bank Passbook with IFSC)", required: true },
      { name: "पाण्याचा स्त्रोत असल्याचा दाखला / स्वयंघोषणा पत्र", required: true },
      { name: "कोटेशन (Approved Drip Dealer Quotation)", required: true },
      { name: "जातीचा दाखला (Caste Certificate - SC/ST असल्यास)", required: false },
    ],

    // Application Information
    applicationInfo: {
      mode: "Online & CSC Center (ऑनलाइन महाडीबीटी पोर्टल)",
      portalName: "MahaDBT Farmer Portal (महाडीबीटी शेतकरी योजना)",
      portalUrl: "https://mahadbt.maharashtra.gov.in",
      steps: [
        "1. महाडीबीटी पोर्टलवर (mahadbt.maharashtra.gov.in) जाऊन शेतकरी रजिस्ट्रेशन करा.",
        "2. 'सिंचन साधने आणि सुविधा' या घटकाअंतर्गत 'ठिबक सिंचन' पर्याय निवडा.",
        "3. जमिनीचा तपशील (७/१२) भरून कागदपत्रे अपलोड करा.",
        "4. अर्ज सबमिट करा आणि २५ रुपये ऑनलाईन शुल्क भरा.",
        "5. लॉटरी पद्धतीद्वारे निवड झाल्यानंतर कृषी अधिकाऱ्यांच्या पूर्वसंमतीने ठिबक संच खरेदी करा.",
      ],
      offlineContact: "तालुका कृषी अधिकारी कार्यालय किंवा गावातील ग्रामसेवक / कृषी सहाय्यक.",
    },

    // Important Dates
    importantDates: [
      { label: "Application Start Date (अर्ज सुरू तारीख)", date: "01 June 2026" },
      { label: "Application Deadline (अंतिम तारीख)", date: "31 August 2026" },
      { label: "Lottery & Approval Date (निवड यादी)", date: "15 September 2026" },
      { label: "Subsidy Disbursement (अनुदान जमा)", date: "Within 45 Days of Site Verification" },
    ],
  },
  {
    id: "scheme-2",
    title: "PM-KUSUM & Mukhyamantri Solar Pump Scheme (सौर कृषी पंप योजना)",
    shortName: "Solar Agri Pump 90% Subsidy",
    govtLevel: "Maharashtra Govt (MSEDCL / MEDA)",
    category: "Solar & Energy",
    subsidyAmount: "90% Subsidy (९०% शासकीय अनुदान)",
    maxBenefit: "3 HP, 5 HP, 7.5 HP Solar Pump Sets",
    status: "Active (अर्जासाठी खुले)",
    statusBadge: "active",
    deadline: "15 September 2026",
    daysLeft: 29,
    description: "दिवसा अखंडित आणि मोफत विजेसाठी शेतकऱ्यांना ३, ५ व ७.५ अश्वशक्तीचे (HP) सौर कृषी पंप ९०% अनुदानावर दिले जातात. शेतकऱ्याला फक्त १०% हिस्सा भरावा लागतो.",
    image: "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=600&h=400&q=80",
    
    eligibility: [
      "शेतकऱ्याकडे पारंपरिक वीज कनेक्शन नसलेले शेत असावे.",
      "जमिनीचा ७/१२ उतारा आणि विहीर/कूपनलिका असावी.",
      "३ HP साठी किमान १ एकर, ५ HP साठी २.५ एकर आणि ७.५ HP साठी ५ एकर जमीन आवश्यक.",
      "अनुसूचित जाती/जमाती शेतकऱ्यांना ९५% अनुदान.",
    ],

    documents: [
      { name: "अद्ययावत ७/१२ आणि ८-अ उतारा", required: true },
      { name: "आधार कार्ड", required: true },
      { name: "बँक पासबुक", required: true },
      { name: "पाण्याचा स्त्रोत असल्याचे प्रमाणपत्र", required: true },
      { name: "वीज जोडणी नसल्याचे स्वयंघोषणा पत्र", required: true },
    ],

    applicationInfo: {
      mode: "Online (महावितरण सौर कृषी पंप पोर्टल)",
      portalName: "MSEDCL Solar Pump Portal",
      portalUrl: "https://www.mahadiscom.in/solar",
      steps: [
        "1. महावितरणच्या अधिकृत पोर्टलवर (mahadiscom.in/solar) जा.",
        "2. 'नवीन ग्राहक अर्ज' वर क्लिक करून वैयक्तिक माहिती व ७/१२ अपलोड करा.",
        "3. पंप क्षमता (3HP / 5HP / 7.5HP) निवडा.",
        "4. अर्जाची पडताळणी झाल्यानंतर १०% शेतकरी हिस्सा ऑनलाईन भरा.",
        "5. महावितरणच्या मान्यताप्राप्त एजन्सीद्वारे शेतात सोलर पंप बसवला जाईल.",
      ],
      offlineContact: "नजीकचे महावितरण उपविभाग कार्यालय (MSEDCL Office).",
    },

    importantDates: [
      { label: "Application Start Date", date: "15 May 2026" },
      { label: "Application Deadline", date: "15 September 2026" },
      { label: "Document Verification", date: "Within 10 Days of Submission" },
      { label: "Pump Installation Window", date: "Within 30 Days of Demand Note Payment" },
    ],
  },
  {
    id: "scheme-3",
    title: "Magel Tyala Shettale — Farm Pond Subsidy Scheme (मागेल त्याला शेततळे)",
    shortName: "Magel Tyala Shettale Subsidy",
    govtLevel: "Maharashtra State Govt",
    category: "Financial Benefit",
    subsidyAmount: "₹75,000 Direct Bank Subsidy",
    maxBenefit: "₹75,000 Direct Benefit Transfer (DBT)",
    status: "Closing Soon (अंतिम तारीख जवळ)",
    statusBadge: "closing_soon",
    deadline: "25 August 2026",
    daysLeft: 8,
    description: "पावसाचे पाणी साठवून दुष्काळी परिस्थितीत पिकांना पाणी देण्यासाठी शेततळे खोदण्यासाठी शासनाकडून ७५,००० रुपये पर्यंत थेट आर्थिक अनुदान दिले जाते.",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&h=400&q=80",
    
    eligibility: [
      "शेतकऱ्याकडे किमान ०.६० हेक्टर (१.५ एकर) शेतजमीन असावी.",
      "शेततळ्यासाठी जागेची निवड कृषी विभागाच्या निकषानुसार योग्य असावी.",
      "यापूर्वी शेततळ्याचा कोणताही शासकीय लाभ घेतलेला नसावा.",
    ],

    documents: [
      { name: "७/१२ आणि ८-अ उतारा", required: true },
      { name: "जागेचा नकाशा आणि आरेखण", required: true },
      { name: "आधार कार्ड आणि बँक पासबुक", required: true },
      { name: "बंधपत्र व हमीपत्र (Rs. 100 Stamp)", required: true },
    ],

    applicationInfo: {
      mode: "Online (महाडीबीटी पोर्टल)",
      portalName: "MahaDBT Shettale Portal",
      portalUrl: "https://mahadbt.maharashtra.gov.in",
      steps: [
        "1. महाडीबीटी पोर्टलवर 'मृद व जलसंधारण' घटकाखाली अर्ज करा.",
        "2. शेततळ्याचा आकार (उदा. ३०x३०x३ मीटर) निवडा.",
        "3. कृषी सहाय्यकाद्वारे जागेची पूर्वपाहणी (Pre-Sanction Site Verification) केली जाईल.",
        "4. कामाची पूर्वसंमत्ती मिळाल्यानंतर शेततळ्याचे काम सुरू करा.",
        "5. काम पूर्ण झाल्यावर जिओ-टॅगिंगनंतर अनुदान बँकेत जमा होईल.",
      ],
      offlineContact: "गावातील कृषी सहाय्यक किंवा तालुका कृषी अधिकारी कार्यालय.",
    },

    importantDates: [
      { label: "Application Start Date", date: "01 April 2026" },
      { label: "Application Deadline", date: "25 August 2026" },
      { label: "Site Inspection Window", date: "Within 7 Days of Application" },
      { label: "Subsidy Credit Date", date: "Within 21 Days of Completion Verification" },
    ],
  },
  {
    id: "scheme-4",
    title: "PM Fasal Bima Yojana (सर्वसमावेशक पीक विमा योजना - १ रुपयात पीक विमा)",
    shortName: "PMFBY Re 1 Crop Insurance",
    govtLevel: "Central & State Govt",
    category: "Crop Insurance",
    subsidyAmount: "100% Premium Paid by Govt (केवळ ₹१ नोंदणी शुल्क)",
    maxBenefit: "Full Coverage for Flood, Drought & Pest Loss",
    status: "Active (अर्जासाठी खुले)",
    statusBadge: "active",
    deadline: "31 August 2026",
    daysLeft: 14,
    description: "महाराष्ट्रातील शेतकऱ्यांसाठी केवळ १ रुपया भरून खरीप व रब्बी हंगामातील पिकांचा विमा काढता येतो. उर्वरित सर्व प्रीमियम शासन भरते.",
    image: "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=600&h=400&q=80",
    
    eligibility: [
      "महाराष्ट्रातील सर्व कर्जदार व बिनकर्जदार शेतकरी पात्र.",
      "खरीप पिके (सोयाबीन, कापूस, भात, मूग, उडीद, मका) घेणारे शेतकरी.",
      "बाधित क्षेत्राचा पिक पेरा (Crop Sowing Self-Declaration) असणे आवश्यक.",
    ],

    documents: [
      { name: "खरीप पीक पेरा नोंद असलेला ७/१२ उतारा", required: true },
      { name: "आधार कार्ड", required: true },
      { name: "बँक पासबुक प्रत", required: true },
      { name: "स्वयंघोषणा पीक पेरा पत्र", required: true },
    ],

    applicationInfo: {
      mode: "Online / CSC Center / Crop Insurance App",
      portalName: "PMFBY Official Portal & Crop Insurance App",
      portalUrl: "https://pmfby.gov.in",
      steps: [
        "1. pmfby.gov.in पोर्टलवर जा किंवा नजीकच्या सीएससी सेंटर (CSC Center) ला भेट द्या.",
        "2. ७/१२ आणि पीक पेरा अपलोड करून पिकाची निवड करा.",
        "3. केवळ १ रुपया नोंदणी शुल्क ऑनलाईन भरा आणि पावती डाऊनलोड करा.",
        "4. निसर्ग आपत्तीमुळे नुकसान झाल्यास ७२ तासांच्या आत 'Crop Insurance App' वर नोंद करा.",
      ],
      offlineContact: "विमा कंपनी प्रतिनिधी, बँक शाखा किंवा कृषी सहाय्यक.",
    },

    importantDates: [
      { label: "Kharif Registration Start", date: "01 June 2026" },
      { label: "Registration Deadline", date: "31 August 2026" },
      { label: "Loss Intimation Window", date: "Within 72 Hours of Natural Calamity" },
    ],
  },
  {
    id: "scheme-5",
    title: "Sub-Mission on Agricultural Mechanization (कृषी यांत्रिकीकरण - ट्रॅक्टर व अवजारे अनुदान)",
    shortName: "SMAM Farm Machinery 50% Subsidy",
    govtLevel: "Central & State Govt",
    category: "Machinery & Equipment",
    subsidyAmount: "40% to 50% Subsidy (५०% पर्यंत अनुदान)",
    maxBenefit: "Up to ₹1.25 Lakh for Tractor & Implements",
    status: "Upcoming (लवकरच सुरू)",
    statusBadge: "upcoming",
    deadline: "10 September 2026",
    daysLeft: 24,
    description: "शेतकऱ्यांना ट्रॅक्टर, रोटाव्हेटर, पॉवर टिलर, थ्रेशर, आणि पेरणी यंत्र खरेदीसाठी ५०% पर्यंत शासकीय अनुदान दिले जाते.",
    image: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&h=400&q=80",
    
    eligibility: [
      "शेतकऱ्याच्या नावावर शेतजमीन (७/१२) असावी.",
      "महिला शेतकरी आणि अल्पभूधारकांना ५०% तर इतर शेतकऱ्यांना ४०% अनुदान.",
    ],

    documents: [
      { name: "७/१२ आणि ८-अ उतारा", required: true },
      { name: "आधार कार्ड आणि बँक पासबुक", required: true },
      { name: "मान्यताप्राप्त डीलरचे कोटेशन (Quotation)", required: true },
    ],

    applicationInfo: {
      mode: "Online (महाडीबीटी पोर्टल)",
      portalName: "MahaDBT Machinery Scheme",
      portalUrl: "https://mahadbt.maharashtra.gov.in",
      steps: [
        "1. महाडीबीटी पोर्टलवर 'कृषी यांत्रिकीकरण' घटकाखाली अर्ज करा.",
        "2. अवजाराची निवड करा (ट्रॅक्टर/रोटाव्हेटर/पेरणीयंत्र).",
        "3. लॉटरी निवड झाल्यानंतर खरेदी करून तपासणीनंतर अनुदान खात्यात जमा होईल.",
      ],
      offlineContact: "तालुका कृषी अधिकारी office.",
    },

    importantDates: [
      { label: "Application Window", date: "25 August 2026 - 10 September 2026" },
      { label: "Lottery Announcement", date: "20 September 2026" },
    ],
  },
];
