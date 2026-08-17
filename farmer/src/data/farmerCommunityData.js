/**
 * Farmer Community Data
 * Real agricultural discussions, expert advice, photo sharing, Q&A, and multi-language posts
 */

export const COMMUNITY_CATEGORIES = [
  "All",
  "Ask Expert",
  "Organic Farming",
  "Pest & Disease Control",
  "Market & Prices",
  "Government Schemes",
  "Irrigation & Machinery",
];

export const COMMUNITY_LANGUAGES = [
  { code: "all", name: "All Languages (सर्व भाषा)" },
  { code: "mr", name: "मराठी (Marathi)" },
  { code: "en", name: "English" },
  { code: "hi", name: "हिंदी (Hindi)" },
];

export const INITIAL_COMMUNITY_POSTS = [
  {
    id: "post-1",
    author: "Ramesh Patil",
    authorRole: "Progressive Farmer",
    location: "Nashik, Maharashtra",
    authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
    timeAgo: "2 hours ago",
    language: "mr",
    category: "Pest & Disease Control",
    cropTag: "Tomato (टोमॅटो)",
    isQuestion: true,
    title: "टोमॅटो पिकावर करपा आणि पांढऱ्या माशीचा प्रादुर्भाव झाला आहे, काय उपाय करावा?",
    content:
      "माझ्या २ एकर टोमॅटोच्या बागेमध्ये पानांवर काळे डाग (करपा) पडत आहेत आणि पांढरी माशी वाढली आहे. रासायनिक फवारणीशिवाय काही सेंद्रिय अथवा प्रभावी औषध सुचवावे.",
    image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&h=400&q=80",
    likes: 24,
    commentsCount: 3,
    userLiked: false,
    comments: [
      {
        id: "c-1",
        author: "Dr. Vijay Kulkarni",
        authorRole: "Agri Expert & Scientist",
        isExpert: true,
        expertBadge: "Verified Agri Expert 🌾",
        location: "KVK Nashik",
        timeAgo: "1 hour ago",
        content:
          "रमेशजी, टोमॅटोतील करपा नियंत्रणासाठी: १) कॉपर ऑक्सिक्लोराईड ३० ग्रॅम + स्ट्रेप्टोसायक्लीन ६ ग्रॅम प्रति १५ लिटर पाण्यात मिसळून फवारावे. २) पांढऱ्या माशीसाठी पिवळे चिकट सापळे (Yellow Sticky Traps) प्रति एकरी १० ते १२ लावावेत. सेंद्रिय उपचारासाठी १% कडुनिंब तेल (Neem Oil 10000 ppm) २ मि.ली./लिटर फवारावे.",
        likes: 18,
      },
      {
        id: "c-2",
        author: "Sanjay Deshmukh",
        authorRole: "Tomato Grower",
        isExpert: false,
        location: "Sangamner",
        timeAgo: "45 mins ago",
        content:
          "मी गेल्या आठवड्यात निंबोळी अर्क ५% फवारला होता, मला खूप चांगला निकाल मिळाला आहे. तुम्ही ट्राय करू शकता.",
        likes: 5,
      },
    ],
  },
  {
    id: "post-2",
    author: "Dr. Ananya Sharma",
    authorRole: "Organic Farming Specialist",
    isExpert: true,
    expertBadge: "Verified Agri Expert 🌾",
    location: "IARI, Pune",
    authorAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150&q=80",
    timeAgo: "5 hours ago",
    language: "en",
    category: "Organic Farming",
    cropTag: "Soil Health & Compost",
    isQuestion: false,
    title: "Guide: How to prepare Jeevamrut (जीवामृत) for High Yield & Natural Soil Fertility",
    content:
      "Jeevamrut is a natural liquid fertilizer rich in beneficial soil microorganisms. Formula per 200L water: 10kg Fresh Cow Dung, 10L Fresh Cow Urine, 2kg Jaggery, 2kg Gram Flour (Besan), & 1 handful fertile farm soil. Stir daily for 48 hours. Apply 200L per acre via drip or flood irrigation every 15 days!",
    image: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=600&h=400&q=80",
    likes: 42,
    commentsCount: 2,
    userLiked: true,
    comments: [
      {
        id: "c-3",
        author: "Dnyaneshwar Shinde",
        authorRole: "Organic Sugarcane Farmer",
        isExpert: false,
        location: "Kolhapur",
        timeAgo: "3 hours ago",
        content:
          "Madam, can we use Jeevamrut through Drip Irrigation filter? Does it choke the drippers?",
        likes: 7,
      },
      {
        id: "c-4",
        author: "Dr. Ananya Sharma",
        authorRole: "Organic Farming Specialist",
        isExpert: true,
        expertBadge: "Verified Agri Expert 🌾",
        location: "IARI, Pune",
        timeAgo: "2 hours ago",
        content:
          "Yes! Filter the mixture carefully using a fine cotton cloth twice before pumping through drip to prevent nozzle blockage.",
        likes: 12,
      },
    ],
  },
  {
    id: "post-3",
    author: "Babanrao Jadhav",
    authorRole: "Onion & Garlic Grower",
    location: "Lasalgaon, Nashik",
    authorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80",
    timeAgo: "1 day ago",
    language: "mr",
    category: "Market & Prices",
    cropTag: "Onion (कांदा)",
    isQuestion: false,
    title: "लासलगाव बाजारात उन्हाळी कांद्याला चांगला भाव! साठवणुकीसाठी सोपा मार्ग.",
    content:
      "आज लासलगाव एपीएमसी मध्ये लाल व गावरान कांद्याला २५०० ते २८५० रुपये प्रति क्विंटल भाव मिळाला. शेतकरी बांधवांनी कांदा चाळीत साठवताना हवा खेळती राहील याची काळजी घ्यावी आणि १% बुरशीनाशक धुळणी करावी.",
    image: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cf?auto=format&fit=crop&w=600&h=400&q=80",
    likes: 38,
    commentsCount: 1,
    userLiked: false,
    comments: [
      {
        id: "c-5",
        author: "Sunil Pawar",
        authorRole: "Farmer",
        isExpert: false,
        location: "Yeola",
        timeAgo: "18 hours ago",
        content: "माहितीबद्दल धन्यवाद बबनराव! चाळीतील तापमान नियंत्रित ठेवण्यासाठी कोणते उपाय करावेत?",
        likes: 3,
      },
    ],
  },
  {
    id: "post-4",
    author: "Vikram Singh",
    authorRole: "Soybean Farmer",
    location: "Indore, Madhya Pradesh",
    authorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80",
    timeAgo: "1 day ago",
    language: "hi",
    category: "Government Schemes",
    cropTag: "PM-Kisan & Subsidy",
    isQuestion: false,
    title: "ड्रिप और स्प्रिंकलर सिंचाई सब्सिडी (PM-KUSUM Scheme) का लाभ कैसे लें?",
    content:
      "किसान भाइयों, राज्य कृषि विभाग द्वारा सूक्ष्म सिंचाई (Drip/Sprinkler) पर ८०% तक सब्सिडी दी जा रही है। पोर्टल पर आधार, ७/१२ और बैंक पासबुक के साथ ऑनलाइन आवेदन करें।",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&h=400&q=80",
    likes: 29,
    commentsCount: 1,
    userLiked: false,
    comments: [
      {
        id: "c-6",
        author: "Krishi Mitra Helpdesk",
        authorRole: "Government Agri Advisory",
        isExpert: true,
        expertBadge: "Government Agri Advisor 🏛️",
        location: "Krishi Bhavan",
        timeAgo: "20 hours ago",
        content: "बिल्कुल सही! किसान भाई अपने नजदीकी CSC सेंटर या Mahadbt/Agri portal से आवेदन कर सकते हैं।",
        likes: 11,
      },
    ],
  },
];
