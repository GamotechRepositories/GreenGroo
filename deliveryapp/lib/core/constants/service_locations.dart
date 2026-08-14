/// Serviceable cities & areas across all Indian states (synced with DeliveryManager).
abstract final class ServiceLocations {
  static const cities = <ServiceCity>[
    ServiceCity(
      id: 'visakhapatnam',
      name: 'Visakhapatnam',
      state: 'Andhra Pradesh',
      areas: ['MVP Colony', 'Gajuwaka', 'Madhurawada', 'Dwaraka Nagar', 'Seethammadhara', 'Beach Road'],
    ),
    ServiceCity(
      id: 'vijayawada',
      name: 'Vijayawada',
      state: 'Andhra Pradesh',
      areas: ['Benz Circle', 'Governorpet', 'Patamata', 'Guntur Road', 'Auto Nagar', 'Labbipet'],
    ),
    ServiceCity(
      id: 'tirupati',
      name: 'Tirupati',
      state: 'Andhra Pradesh',
      areas: ['Tirumala', 'Renigunta', 'Alipiri', 'Bairagipatteda', 'Chandragiri'],
    ),
    ServiceCity(
      id: 'guntur',
      name: 'Guntur',
      state: 'Andhra Pradesh',
      areas: ['Brodipet', 'Lakshmipuram', 'Arundelpet', 'Nagarampalem', 'Autonagar'],
    ),
    ServiceCity(
      id: 'itanagar',
      name: 'Itanagar',
      state: 'Arunachal Pradesh',
      areas: ['Naharlagun', 'Ganga Market', 'Bank Tinali', 'Niti Vihar', 'Chimpu'],
    ),
    ServiceCity(
      id: 'tawang',
      name: 'Tawang',
      state: 'Arunachal Pradesh',
      areas: ['Tawang Market', 'Old Market', 'New Market', 'District Centre'],
    ),
    ServiceCity(
      id: 'guwahati',
      name: 'Guwahati',
      state: 'Assam',
      areas: ['Dispur', 'Paltan Bazaar', 'Fancy Bazaar', 'Chandmari', 'Beltola', 'Six Mile', 'Zoo Road'],
    ),
    ServiceCity(
      id: 'dibrugarh',
      name: 'Dibrugarh',
      state: 'Assam',
      areas: ['Chowkidinghee', 'Amolapatty', 'Mancotta', 'Graham Bazar', 'Jail Road'],
    ),
    ServiceCity(
      id: 'silchar',
      name: 'Silchar',
      state: 'Assam',
      areas: ['Central Road', 'Rangirkhari', 'Tarapur', 'Meherpur', 'Sonai Road'],
    ),
    ServiceCity(
      id: 'patna',
      name: 'Patna',
      state: 'Bihar',
      areas: ['Boring Road', 'Kankarbagh', 'Bailey Road', 'Patliputra', 'Rajendra Nagar', 'Danapur', 'Fraser Road'],
    ),
    ServiceCity(
      id: 'gaya',
      name: 'Gaya',
      state: 'Bihar',
      areas: ['Civil Lines', 'A.P. Colony', 'Rampur', 'Delha', 'Bodh Gaya Road'],
    ),
    ServiceCity(
      id: 'muzaffarpur',
      name: 'Muzaffarpur',
      state: 'Bihar',
      areas: ['Motijheel', 'Kalambagh Road', 'Bhagwanpur', 'Mithanpura', 'Aghoria Bazar'],
    ),
    ServiceCity(
      id: 'bhagalpur',
      name: 'Bhagalpur',
      state: 'Bihar',
      areas: ['Tilkamanjhi', 'Nathnagar', 'Barari', 'Zero Mile', 'Police Line'],
    ),
    ServiceCity(
      id: 'raipur',
      name: 'Raipur',
      state: 'Chhattisgarh',
      areas: ['Pandri', 'Shankar Nagar', 'Telibandha', 'Civil Lines', 'Amapara', 'Tatibandh'],
    ),
    ServiceCity(
      id: 'bilaspur-cg',
      name: 'Bilaspur',
      state: 'Chhattisgarh',
      areas: ['Vyapar Vihar', 'Nehru Nagar', 'Torwa', 'Link Road', 'Magarpara'],
    ),
    ServiceCity(
      id: 'bhilai',
      name: 'Bhilai',
      state: 'Chhattisgarh',
      areas: ['Sector 6', 'Supela', 'Power House', 'Civic Centre', 'Nehru Nagar'],
    ),
    ServiceCity(
      id: 'panaji',
      name: 'Panaji',
      state: 'Goa',
      areas: ['Fontainhas', 'Altinho', 'Miramar', 'Caranzalem', 'St. Inez', 'Campal'],
    ),
    ServiceCity(
      id: 'margao',
      name: 'Margao',
      state: 'Goa',
      areas: ['Fatorda', 'Borda', 'Navelim', 'Aquem', 'Comba'],
    ),
    ServiceCity(
      id: 'vasco',
      name: 'Vasco da Gama',
      state: 'Goa',
      areas: ['Mormugao', 'Chicalim', 'Sada', 'Baina', 'Mangor Hill'],
    ),
    ServiceCity(
      id: 'ahmedabad',
      name: 'Ahmedabad',
      state: 'Gujarat',
      areas: ['Navrangpura', 'Satellite', 'Bopal', 'SG Highway', 'Maninagar', 'Prahlad Nagar', 'Vastrapur', 'CG Road', 'Chandkheda', 'Gota', 'Thaltej', 'Paldi', 'Bodakdev'],
    ),
    ServiceCity(
      id: 'surat',
      name: 'Surat',
      state: 'Gujarat',
      areas: ['Adajan', 'Vesu', 'Varachha', 'Katargam', 'Athwa', 'Piplod', 'City Light'],
    ),
    ServiceCity(
      id: 'vadodara',
      name: 'Vadodara',
      state: 'Gujarat',
      areas: ['Alkapuri', 'Fatehgunj', 'Gotri', 'Manjalpur', 'Akota', 'Karelibaug'],
    ),
    ServiceCity(
      id: 'rajkot',
      name: 'Rajkot',
      state: 'Gujarat',
      areas: ['Kalawad Road', 'University Road', 'Gondal Road', 'Mavdi', 'Race Course'],
    ),
    ServiceCity(
      id: 'gandhinagar',
      name: 'Gandhinagar',
      state: 'Gujarat',
      areas: ['Sector 21', 'Sector 16', 'Kudasan', 'Infocity', 'Sargasan'],
    ),
    ServiceCity(
      id: 'gurugram',
      name: 'Gurugram',
      state: 'Haryana',
      areas: ['Cyber City', 'Sector 29', 'Sector 54', 'Golf Course Road', 'Sohna Road', 'MG Road', 'DLF Phase 1', 'DLF Phase 2', 'DLF Phase 3', 'Sector 14', 'Udyog Vihar', 'Palam Vihar'],
    ),
    ServiceCity(
      id: 'faridabad',
      name: 'Faridabad',
      state: 'Haryana',
      areas: ['Sector 15', 'Sector 16', 'NIT', 'Ballabhgarh', 'Greater Faridabad', 'Greenfield Colony'],
    ),
    ServiceCity(
      id: 'panipat',
      name: 'Panipat',
      state: 'Haryana',
      areas: ['Model Town', 'Sector 11', 'Sector 12', 'Assandh Road', 'GT Road'],
    ),
    ServiceCity(
      id: 'ambala',
      name: 'Ambala',
      state: 'Haryana',
      areas: ['Ambala Cantt', 'Ambala City', 'Mahesh Nagar', 'Sector 8', 'Railway Road'],
    ),
    ServiceCity(
      id: 'hisar',
      name: 'Hisar',
      state: 'Haryana',
      areas: ['Model Town', 'Sector 14', 'Urban Estate', 'Auto Market', 'Dabra Chowk'],
    ),
    ServiceCity(
      id: 'shimla',
      name: 'Shimla',
      state: 'Himachal Pradesh',
      areas: ['Mall Road', 'The Ridge', 'Sanjauli', 'Summer Hill', 'Kasumpti', 'Chotta Shimla'],
    ),
    ServiceCity(
      id: 'dharamshala',
      name: 'Dharamshala',
      state: 'Himachal Pradesh',
      areas: ['McLeod Ganj', 'Kotwali Bazaar', 'Forsyth Ganj', 'Bhagsu', 'Cantt'],
    ),
    ServiceCity(
      id: 'manali',
      name: 'Manali',
      state: 'Himachal Pradesh',
      areas: ['Old Manali', 'Mall Road', 'Vashisht', 'Hadimba', 'Model Town'],
    ),
    ServiceCity(
      id: 'ranchi',
      name: 'Ranchi',
      state: 'Jharkhand',
      areas: ['Main Road', 'Lalpur', 'Doranda', 'Kanke', 'Harmu', 'Ashok Nagar', 'Bariatu'],
    ),
    ServiceCity(
      id: 'jamshedpur',
      name: 'Jamshedpur',
      state: 'Jharkhand',
      areas: ['Bistupur', 'Sakchi', 'Kadma', 'Sonari', 'Telco Colony', 'Mango'],
    ),
    ServiceCity(
      id: 'dhanbad',
      name: 'Dhanbad',
      state: 'Jharkhand',
      areas: ['Bank More', 'Hirapur', 'Saraidhela', 'Bartand', 'Jharia'],
    ),
    ServiceCity(
      id: 'bengaluru',
      name: 'Bengaluru',
      state: 'Karnataka',
      areas: ['Koramangala', 'Indiranagar', 'Whitefield', 'HSR Layout', 'Jayanagar', 'BTM Layout', 'Electronic City', 'Marathahalli', 'Yelahanka', 'Malleshwaram', 'Rajajinagar', 'Hebbal', 'Banashankari', 'Sarjapur Road', 'MG Road'],
    ),
    ServiceCity(
      id: 'mysuru',
      name: 'Mysuru',
      state: 'Karnataka',
      areas: ['Vijayanagar', 'Gokulam', 'Jayalakshmipuram', 'Kuvempunagar', 'Nazarbad', 'Hebbal'],
    ),
    ServiceCity(
      id: 'mangaluru',
      name: 'Mangaluru',
      state: 'Karnataka',
      areas: ['Hampankatta', 'Kadri', 'Bejai', 'Surathkal', 'Pumpwell', 'Kankanady'],
    ),
    ServiceCity(
      id: 'hubballi',
      name: 'Hubballi',
      state: 'Karnataka',
      areas: ['Vidyanagar', 'Gokul Road', 'Deshpande Nagar', 'Keshwapur', 'Unkal'],
    ),
    ServiceCity(
      id: 'belagavi',
      name: 'Belagavi',
      state: 'Karnataka',
      areas: ['Tilakwadi', 'Shahapur', 'Congress Road', 'Vadgaon', 'Angol'],
    ),
    ServiceCity(
      id: 'kochi',
      name: 'Kochi',
      state: 'Kerala',
      areas: ['MG Road', 'Kakkanad', 'Edappally', 'Panampilly Nagar', 'Fort Kochi', 'Vyttila', 'Palarivattom'],
    ),
    ServiceCity(
      id: 'thiruvananthapuram',
      name: 'Thiruvananthapuram',
      state: 'Kerala',
      areas: ['Technopark', 'Kowdiar', 'Pattom', 'Kesavadasapuram', 'Vazhuthacaud', 'Kazhakkoottam'],
    ),
    ServiceCity(
      id: 'kozhikode',
      name: 'Kozhikode',
      state: 'Kerala',
      areas: ['Mavoor Road', 'Palayam', 'Focus Mall Area', 'West Hill', 'Kallai', 'Beach'],
    ),
    ServiceCity(
      id: 'thrissur',
      name: 'Thrissur',
      state: 'Kerala',
      areas: ['Round South', 'Punkunnam', 'East Fort', 'Kuriyachira', 'Ollur'],
    ),
    ServiceCity(
      id: 'indore',
      name: 'Indore',
      state: 'Madhya Pradesh',
      areas: ['Vijay Nagar', 'AB Road', 'Palasia', 'Rajendra Nagar', 'Bhawarkua', 'Scheme 78', 'Scheme 54', 'Sudama Nagar', 'Rau', 'MR 10', 'Geeta Bhawan'],
    ),
    ServiceCity(
      id: 'bhopal',
      name: 'Bhopal',
      state: 'Madhya Pradesh',
      areas: ['MP Nagar', 'Arera Colony', 'Kolar Road', 'New Market', 'Berasia Road', 'Habibganj'],
    ),
    ServiceCity(
      id: 'gwalior',
      name: 'Gwalior',
      state: 'Madhya Pradesh',
      areas: ['City Centre', 'Thatipur', 'Morar', 'Lashkar', 'DD Nagar', 'Phool Bagh'],
    ),
    ServiceCity(
      id: 'jabalpur',
      name: 'Jabalpur',
      state: 'Madhya Pradesh',
      areas: ['Civil Lines', 'Wright Town', 'Napier Town', 'Gorakhpur', 'Vijay Nagar'],
    ),
    ServiceCity(
      id: 'mumbai',
      name: 'Mumbai',
      state: 'Maharashtra',
      areas: ['Colaba', 'Fort', 'Churchgate', 'Nariman Point', 'Marine Lines', 'Grant Road', 'Girgaon', 'Opera House', 'Chowpatty', 'Malabar Hill', 'Walkeshwar', 'Pedder Road', 'Cuffe Parade', 'Byculla', 'Mazgaon', 'Parel', 'Lower Parel', 'Worli', 'Prabhadevi', 'Dadar East', 'Dadar West', 'Matunga', 'Mahim', 'Wadala', 'Sion', 'Kurla East', 'Kurla West', 'Chembur', 'Ghatkopar East', 'Ghatkopar West', 'Vikhroli', 'Kanjurmarg', 'Bhandup', 'Mulund East', 'Mulund West', 'Powai', 'Chandivali', 'Andheri East', 'Andheri West', 'Jogeshwari East', 'Jogeshwari West', 'Goregaon East', 'Goregaon West', 'Malad East', 'Malad West', 'Kandivali East', 'Kandivali West', 'Borivali East', 'Borivali West', 'Dahisar', 'Santacruz East', 'Santacruz West', 'Vile Parle East', 'Vile Parle West', 'Bandra East', 'Bandra West', 'Khar East', 'Khar West', 'Juhu', 'Versova', 'Lokhandwala', 'Oshiwara', 'Marol', 'Saki Naka', 'MIDC Andheri', 'BKC'],
    ),
    ServiceCity(
      id: 'pune',
      name: 'Pune',
      state: 'Maharashtra',
      areas: ['Hinjewadi Phase 1', 'Hinjewadi Phase 2', 'Hinjewadi Phase 3', 'Marunji', 'Mhalunge', 'Wakad', 'Balewadi', 'Baner', 'Aundh', 'Pashan', 'Sus', 'Lavale', 'Bhugaon', 'Bavdhan', 'Kothrud', 'Karve Nagar', 'Erandwane', 'Deccan Gymkhana', 'Shivajinagar', 'FC Road', 'JM Road', 'Koregaon Park', 'Kalyani Nagar', 'Viman Nagar', 'Yerwada', 'Kharadi', 'Wagholi', 'Hadapsar', 'Magarpatta', 'Mundhwa', 'Kondhwa', 'Wanowrie', 'NIBM', 'Undri', 'Pisoli', 'Bibwewadi', 'Sahakar Nagar', 'Swargate', 'Camp', 'Koregaon Bhima', 'Chakan', 'Talegaon', 'Pimpri', 'Chinchwad', 'Pimple Saudagar', 'Pimple Nilakh', 'Pimple Gurav', 'Nigdi', 'Akurdi', 'Ravet', 'Tathawade', 'Punawale', 'Dange Chowk', 'Thergaon', 'Rahatani', 'Sangvi', 'Dhanori', 'Lohegaon', 'Moshi', 'Charholi', 'Alandi', 'Manjari', 'Fursungi', 'Phursungi', 'Ambegaon', 'Katraj', 'Dhankawadi', 'Warje', 'Sinhagad Road', 'Vadgaon Budruk', 'Narhe', 'Dhayari', 'Hinjewadi Megapolis', 'Nande', 'Mulshi Road', 'Pirangut', 'Chandani Chowk'],
    ),
    ServiceCity(
      id: 'nagpur',
      name: 'Nagpur',
      state: 'Maharashtra',
      areas: ['Dharampeth', 'Sitabuldi', 'Civil Lines', 'Ramdaspeth', 'Sadar', 'Manish Nagar', 'Pratap Nagar', 'Wardha Road', 'Hingna', 'MIHAN', 'Kamptee Road', 'Jaripatka', 'Itwari', 'Gandhibagh', 'Trimurti Nagar', 'Besa', 'Somalwada', 'Bajaj Nagar', 'Shankar Nagar', 'Koradi', 'Katol Road', 'Amravati Road', 'Wathoda', 'Hudkeshwar', 'Nandanvan', 'Reshimbagh'],
    ),
    ServiceCity(
      id: 'thane',
      name: 'Thane',
      state: 'Maharashtra',
      areas: ['Thane West', 'Thane East', 'Ghodbunder Road', 'Hiranandani Estate', 'Hiranandani Meadows', 'Kopri', 'Wagle Estate', 'Kalwa', 'Mumbra', 'Diva', 'Naupada', 'Panchpakhadi', 'Majiwada', 'Kolshet', 'Balkum', 'Owale', 'Manpada', 'Vartak Nagar', 'Lokmanya Nagar', 'Cadbury Junction', 'Teen Hath Naka', 'Kapurbawdi', 'Kavesar', 'Anand Nagar', 'Louiswadi'],
    ),
    ServiceCity(
      id: 'nashik',
      name: 'Nashik',
      state: 'Maharashtra',
      areas: ['College Road', 'Gangapur Road', 'CIDCO', 'Panchavati', 'Indira Nagar', 'Satpur', 'Ambad', 'Pathardi Phata', 'Ashoka Marg', 'Canada Corner', 'Dwarka', 'Untwadi', 'Mhasrul', 'Adgaon', 'Sinnar Road', 'Trimbak Road', 'Govardhan', 'Anandwalli', 'Sharanpur', 'Deolali'],
    ),
    ServiceCity(
      id: 'aurangabad-mh',
      name: 'Chhatrapati Sambhajinagar',
      state: 'Maharashtra',
      areas: ['CIDCO', 'Garkheda', 'Jalna Road', 'Osmanpura', 'Kranti Chowk', 'Cannaught Place', 'Town Centre', 'Beed Bypass', 'Harsul', 'Mukundwadi', 'N-7', 'N-8', 'Chikalthana', 'Waluj', 'Padegaon', 'Shahaganj', 'Station Road', 'Gulmandi'],
    ),
    ServiceCity(
      id: 'navi-mumbai',
      name: 'Navi Mumbai',
      state: 'Maharashtra',
      areas: ['Vashi', 'Nerul', 'Belapur', 'Kharghar', 'Panvel', 'Airoli', 'Ghansoli', 'Kopar Khairane', 'Sanpada', 'Juinagar', 'Seawoods', 'Ulwe', 'Dronagiri', 'Kamothe', 'Kalamboli', 'Taloja', 'Turbhe', 'Mahape', 'Rabale', 'CBD Belapur', 'Palm Beach Road'],
    ),
    ServiceCity(
      id: 'kalyan-dombivli',
      name: 'Kalyan-Dombivli',
      state: 'Maharashtra',
      areas: ['Kalyan West', 'Kalyan East', 'Dombivli East', 'Dombivli West', 'Titwala', 'Shahad', 'Ulhasnagar Border', 'Khadakpada', 'Bail Bazar', 'Thakurli', 'Kopar', 'Manpada Kalyan', 'Mharal', 'Netivali', 'Chinchpada', 'Reti Bunder'],
    ),
    ServiceCity(
      id: 'vasai-virar',
      name: 'Vasai-Virar',
      state: 'Maharashtra',
      areas: ['Vasai West', 'Vasai East', 'Virar West', 'Virar East', 'Nalasopara West', 'Nalasopara East', 'Naigaon', 'Global City', 'Agashi', 'Sandor', 'Manikpur', 'Bolinj', 'Chikhaldongri'],
    ),
    ServiceCity(
      id: 'mira-bhayandar',
      name: 'Mira-Bhayandar',
      state: 'Maharashtra',
      areas: ['Mira Road East', 'Mira Road West', 'Bhayandar East', 'Bhayandar West', 'Kashimira', 'Shanti Nagar', 'Penkarpada', 'Silver Park', 'Naya Nagar', 'Jesal Park', 'Uttan'],
    ),
    ServiceCity(
      id: 'bhiwandi',
      name: 'Bhiwandi',
      state: 'Maharashtra',
      areas: ['Bhiwandi City', 'Kalyan Road', 'Anjurphata', 'Temghar', 'Narpoli', 'Nizampur', 'Kalher'],
    ),
    ServiceCity(
      id: 'ulhasnagar',
      name: 'Ulhasnagar',
      state: 'Maharashtra',
      areas: ['Ulhasnagar 1', 'Ulhasnagar 2', 'Ulhasnagar 3', 'Ulhasnagar 4', 'Ulhasnagar 5', 'Camp Area', 'Shahad'],
    ),
    ServiceCity(
      id: 'panvel',
      name: 'Panvel',
      state: 'Maharashtra',
      areas: ['Old Panvel', 'New Panvel', 'Khanda Colony', 'Sector 5', 'Sector 15', 'Sector 19', 'Kamothe', 'Kalamboli', 'Taloja', 'Rasayani', 'Khopoli Road', 'Orion Mall Area'],
    ),
    ServiceCity(
      id: 'solapur',
      name: 'Solapur',
      state: 'Maharashtra',
      areas: ['Hotgi Road', 'Railway Lines', 'Jule Solapur', 'Ashok Chowk', 'Sidheshwar Temple Area', 'Vijapur Road', 'Akkalkot Road', 'Park Chowk', 'Modi', 'Shelgi'],
    ),
    ServiceCity(
      id: 'kolhapur',
      name: 'Kolhapur',
      state: 'Maharashtra',
      areas: ['Rajarampuri', 'Shahupuri', 'Tarabai Park', 'Kawala Naka', 'Laxmipuri', 'Nagala Park', 'Rankala', 'Shivaji University Area', 'Temporary Market', 'Jawahar Nagar'],
    ),
    ServiceCity(
      id: 'amravati',
      name: 'Amravati',
      state: 'Maharashtra',
      areas: ['Rajapeth', 'Irwin Square', 'Camp Area', 'Badnera Road', 'Rahatgaon', 'Navsari', 'Freizpura', 'VMV Road', 'Saturna', 'Kathora'],
    ),
    ServiceCity(
      id: 'nanded',
      name: 'Nanded',
      state: 'Maharashtra',
      areas: ['Vazirabad', 'Taroda Naka', 'CIDCO Nanded', 'Anand Nagar', 'Shivaji Nagar', 'Hingoli Gate', 'Station Road', 'Wadi', 'Vishnupuri', 'Old Mondha'],
    ),
    ServiceCity(
      id: 'sangli',
      name: 'Sangli',
      state: 'Maharashtra',
      areas: ['Vishrambag', 'Miraj', 'Gaonbhag', 'Market Yard', 'College Corner', 'Kupwad', 'Madhavnagar', 'Rajwada', 'Station Road'],
    ),
    ServiceCity(
      id: 'jalgaon',
      name: 'Jalgaon',
      state: 'Maharashtra',
      areas: ['MJ College Road', 'Mehrun', 'Ring Road', 'Station Road', 'Ramdas Colony', 'Mehrun Lake Area', 'Avhane', 'Kusumba', 'Pimprala'],
    ),
    ServiceCity(
      id: 'akola',
      name: 'Akola',
      state: 'Maharashtra',
      areas: ['Ramdaspeth', 'Old City', 'Civil Lines', 'Murtizapur Road', 'Kaulkhed', 'Gaurakshan', 'Akot Road', 'Washim Road', 'Shivaji Park'],
    ),
    ServiceCity(
      id: 'latur',
      name: 'Latur',
      state: 'Maharashtra',
      areas: ['Ausa Road', 'Signal Camp', 'Gandhi Chowk', 'Shivaji Chowk', 'Barshi Road', 'MIDC Latur', 'Ambejogai Road', 'Vasarni', 'Khadgaon'],
    ),
    ServiceCity(
      id: 'dhule',
      name: 'Dhule',
      state: 'Maharashtra',
      areas: ['Old Dhule', 'Deopur', 'Station Road', 'Chalisgaon Road', 'Mohadi Road', 'Walwadi', 'Nakane Road', 'Agarwal Colony'],
    ),
    ServiceCity(
      id: 'ahmednagar',
      name: 'Ahmednagar',
      state: 'Maharashtra',
      areas: ['Savedi', 'Pipeline Road', 'Station Road', 'MIDC Ahmednagar', 'Burudgaon Road', 'Delhi Gate', 'Nalegaon', 'Kedgaon', 'Bolhegaon'],
    ),
    ServiceCity(
      id: 'chandrapur',
      name: 'Chandrapur',
      state: 'Maharashtra',
      areas: ['Civil Lines', 'Ramnagar', 'Bajaj Nagar', 'Durgapur', 'Pathanpura', 'Mul Road', 'Ballarpur Road', 'Ghuggus Road', 'Tukum'],
    ),
    ServiceCity(
      id: 'parbhani',
      name: 'Parbhani',
      state: 'Maharashtra',
      areas: ['Jintur Road', 'Station Road', 'Shivaji Nagar', 'Pedgaon', 'Dhar', 'Vasant Nagar', 'Old Mondha'],
    ),
    ServiceCity(
      id: 'ichalkaranji',
      name: 'Ichalkaranji',
      state: 'Maharashtra',
      areas: ['Shahapur', 'Kabnur', 'Yadrav', 'Station Road', 'Market Yard', 'Gandhinagar', 'Jaysingpur Road'],
    ),
    ServiceCity(
      id: 'jalna',
      name: 'Jalna',
      state: 'Maharashtra',
      areas: ['Old Jalna', 'Ramnagar', 'Station Road', 'Ambad Road', 'Mantha Road', 'Deulgaon Raja Road'],
    ),
    ServiceCity(
      id: 'ambarnath',
      name: 'Ambarnath',
      state: 'Maharashtra',
      areas: ['Ambarnath East', 'Ambarnath West', 'Badlapur', 'Kulgaon', 'Morivali', 'Chikhloli', 'Shivaji Nagar'],
    ),
    ServiceCity(
      id: 'bhusawal',
      name: 'Bhusawal',
      state: 'Maharashtra',
      areas: ['Station Area', 'Old Bhusawal', 'Jamner Road', 'Deepnagar', 'Hathgaon', 'Yawal Road'],
    ),
    ServiceCity(
      id: 'beed',
      name: 'Beed',
      state: 'Maharashtra',
      areas: ['Nagar Road', 'Jalna Road', 'Station Road', 'Barshi Road', 'Nath Nagar', 'Peth Beed'],
    ),
    ServiceCity(
      id: 'gondia',
      name: 'Gondia',
      state: 'Maharashtra',
      areas: ['Civil Lines', 'Balaghat Road', 'Station Road', 'Fulchur', 'Tirora Road', 'Kudwa'],
    ),
    ServiceCity(
      id: 'satara',
      name: 'Satara',
      state: 'Maharashtra',
      areas: ['Powai Naka', 'Godoli', 'Shahupuri', 'Camp Satara', 'Koregaon Road', 'Ajinkyatara', 'Saidapur', 'Karanje', 'Gogave'],
    ),
    ServiceCity(
      id: 'barshi',
      name: 'Barshi',
      state: 'Maharashtra',
      areas: ['Shivaji Chowk', 'Station Road', 'Osmanabad Road', 'Latur Road', 'Market Yard', 'Vairag'],
    ),
    ServiceCity(
      id: 'yavatmal',
      name: 'Yavatmal',
      state: 'Maharashtra',
      areas: ['Dhamangaon Road', 'Pusad Road', 'Station Road', 'Lohara', 'Wadgaon', 'Arni Road'],
    ),
    ServiceCity(
      id: 'achalpur',
      name: 'Achalpur',
      state: 'Maharashtra',
      areas: ['Old Achalpur', 'Paratwada', 'Amravati Road', 'Betul Road', 'Station Area'],
    ),
    ServiceCity(
      id: 'osmanabad',
      name: 'Osmanabad',
      state: 'Maharashtra',
      areas: ['Tuljapur Road', 'Station Road', 'Barshi Road', 'Kallam Road', 'Shivaji Nagar', 'Udgir Road'],
    ),
    ServiceCity(
      id: 'nandurbar',
      name: 'Nandurbar',
      state: 'Maharashtra',
      areas: ['Station Road', 'Khandbara Road', 'Akkalkuwa Road', 'Sakri Road', 'Old City', 'Market Area'],
    ),
    ServiceCity(
      id: 'wardha',
      name: 'Wardha',
      state: 'Maharashtra',
      areas: ['Civil Lines', 'Ramnagar', 'Sewagram', 'Hinganghat Road', 'Arvi Road', 'Bajajwadi'],
    ),
    ServiceCity(
      id: 'udgir',
      name: 'Udgir',
      state: 'Maharashtra',
      areas: ['Station Road', 'Latur Road', 'Bidar Road', 'Market Yard', 'Old Udgir', 'Nanded Road'],
    ),
    ServiceCity(
      id: 'hinganghat',
      name: 'Hinganghat',
      state: 'Maharashtra',
      areas: ['Station Road', 'Wardha Road', 'Market Area', 'MIDC', 'Old City'],
    ),
    ServiceCity(
      id: 'ratnagiri',
      name: 'Ratnagiri',
      state: 'Maharashtra',
      areas: ['Nachane', 'Mirjole', 'Thiba Palace Area', 'Station Road', 'Ganapatipule Road', 'Zadgaon'],
    ),
    ServiceCity(
      id: 'malegaon',
      name: 'Malegaon',
      state: 'Maharashtra',
      areas: ['Camp Malegaon', 'Soygaon', 'Dabhadi', 'Chavani', 'Market Area', 'Satana Road', 'Manmad Road'],
    ),
    ServiceCity(
      id: 'pimpri-chinchwad',
      name: 'Pimpri-Chinchwad',
      state: 'Maharashtra',
      areas: ['Pimpri', 'Chinchwad', 'Nigdi', 'Akurdi', 'Bhosari', 'Moshi', 'Chakan Road', 'Thergaon', 'Rahatani', 'Pimple Saudagar', 'Pimple Nilakh', 'Pimple Gurav', 'Sangvi', 'Dapodi', 'Kasarwadi', 'Phugewadi', 'Walduni', 'Ravet', 'Tathawade', 'Punawale', 'Walhekarwadi'],
    ),
    ServiceCity(
      id: 'imphal',
      name: 'Imphal',
      state: 'Manipur',
      areas: ['Thangal Bazar', 'Paona Bazar', 'Lamphelpat', 'Singjamei', 'Keisampat'],
    ),
    ServiceCity(
      id: 'shillong',
      name: 'Shillong',
      state: 'Meghalaya',
      areas: ['Police Bazar', 'Laitumkhrah', 'Lachumiere', 'Mawprem', 'Nongthymmai'],
    ),
    ServiceCity(
      id: 'aizawl',
      name: 'Aizawl',
      state: 'Mizoram',
      areas: ['Zarkawt', 'Bara Bazar', 'Dawrpui', 'Chaltlang', 'Electric Veng'],
    ),
    ServiceCity(
      id: 'kohima',
      name: 'Kohima',
      state: 'Nagaland',
      areas: ['Main Town', 'High School Area', 'Officer\'s Hill', 'PR Hill', 'Tinsey'],
    ),
    ServiceCity(
      id: 'dimapur',
      name: 'Dimapur',
      state: 'Nagaland',
      areas: ['Circular Road', 'Bank Colony', 'Duncan', 'Notun Bosti', 'Super Market'],
    ),
    ServiceCity(
      id: 'bhubaneswar',
      name: 'Bhubaneswar',
      state: 'Odisha',
      areas: ['Saheed Nagar', 'Patia', 'Chandrasekharpur', 'Jayadev Vihar', 'Khandagiri', 'Old Town'],
    ),
    ServiceCity(
      id: 'cuttack',
      name: 'Cuttack',
      state: 'Odisha',
      areas: ['Buxi Bazar', 'College Square', 'Badambadi', 'CDA', 'Choudhury Bazar'],
    ),
    ServiceCity(
      id: 'rourkela',
      name: 'Rourkela',
      state: 'Odisha',
      areas: ['Sector 19', 'Civil Township', 'Udit Nagar', 'Koelnagar', 'Basanti Colony'],
    ),
    ServiceCity(
      id: 'ludhiana',
      name: 'Ludhiana',
      state: 'Punjab',
      areas: ['Sarabha Nagar', 'Model Town', 'Civil Lines', 'BRS Nagar', 'Ferozepur Road', 'PAU'],
    ),
    ServiceCity(
      id: 'amritsar',
      name: 'Amritsar',
      state: 'Punjab',
      areas: ['Ranjit Avenue', 'Lawrence Road', 'Hall Bazaar', 'GT Road', 'White Avenue'],
    ),
    ServiceCity(
      id: 'jalandhar',
      name: 'Jalandhar',
      state: 'Punjab',
      areas: ['Model Town', 'Civil Lines', 'Nakodar Road', 'Guru Nanak Pura', 'Rama Mandi'],
    ),
    ServiceCity(
      id: 'mohali',
      name: 'Mohali',
      state: 'Punjab',
      areas: ['Phase 3B2', 'Sector 70', 'Sector 59', 'Aerocity', 'Phase 7', 'Phase 11'],
    ),
    ServiceCity(
      id: 'patiala',
      name: 'Patiala',
      state: 'Punjab',
      areas: ['Urban Estate', 'Lehal', 'Tripuri', 'Model Town', 'Rajpura Road'],
    ),
    ServiceCity(
      id: 'jaipur',
      name: 'Jaipur',
      state: 'Rajasthan',
      areas: ['Malviya Nagar', 'Vaishali Nagar', 'C Scheme', 'Raja Park', 'Mansarovar', 'Jagatpura', 'Tonk Road', 'Bani Park', 'Ajmer Road', 'Sitapura', 'Vidhyadhar Nagar', 'Jhotwara'],
    ),
    ServiceCity(
      id: 'udaipur',
      name: 'Udaipur',
      state: 'Rajasthan',
      areas: ['Hiran Magri', 'Fatehpura', 'Sukhadia Circle', 'Surajpole', 'Ashok Nagar'],
    ),
    ServiceCity(
      id: 'jodhpur',
      name: 'Jodhpur',
      state: 'Rajasthan',
      areas: ['Sardarpura', 'Ratanada', 'Pal Road', 'Chopasni', 'Basni'],
    ),
    ServiceCity(
      id: 'kota',
      name: 'Kota',
      state: 'Rajasthan',
      areas: ['Talwandi', 'Vigyan Nagar', 'Dadabari', 'Mahaveer Nagar', 'Kunhari'],
    ),
    ServiceCity(
      id: 'ajmer',
      name: 'Ajmer',
      state: 'Rajasthan',
      areas: ['Civil Lines', 'Vaishali Nagar', 'Panchsheel', 'Foysagar Road', 'Madar Gate'],
    ),
    ServiceCity(
      id: 'gangtok',
      name: 'Gangtok',
      state: 'Sikkim',
      areas: ['MG Marg', 'Tadong', 'Development Area', 'Deorali', 'Tibet Road'],
    ),
    ServiceCity(
      id: 'chennai',
      name: 'Chennai',
      state: 'Tamil Nadu',
      areas: ['T Nagar', 'Anna Nagar', 'Adyar', 'Velachery', 'OMR', 'Porur', 'Tambaram', 'Nungambakkam', 'Mylapore', 'Kodambakkam', 'Chromepet', 'Sholinganallur', 'Ambattur'],
    ),
    ServiceCity(
      id: 'coimbatore',
      name: 'Coimbatore',
      state: 'Tamil Nadu',
      areas: ['RS Puram', 'Saibaba Colony', 'Peelamedu', 'Gandhipuram', 'Race Course', 'Saravanampatti'],
    ),
    ServiceCity(
      id: 'madurai',
      name: 'Madurai',
      state: 'Tamil Nadu',
      areas: ['Anna Nagar', 'KK Nagar', 'Tallakulam', 'Goripalayam', 'Simmakkal', 'Thirunagar'],
    ),
    ServiceCity(
      id: 'tiruchirappalli',
      name: 'Tiruchirappalli',
      state: 'Tamil Nadu',
      areas: ['Thillai Nagar', 'Cantonment', 'Srirangam', 'Woraiyur', 'KK Nagar'],
    ),
    ServiceCity(
      id: 'salem-tn',
      name: 'Salem',
      state: 'Tamil Nadu',
      areas: ['Fairlands', 'Hasthampatti', 'Suramangalam', 'Alagapuram', 'Shevapet'],
    ),
    ServiceCity(
      id: 'hyderabad',
      name: 'Hyderabad',
      state: 'Telangana',
      areas: ['Hitech City', 'Gachibowli', 'Madhapur', 'Banjara Hills', 'Jubilee Hills', 'Kukatpally', 'Secunderabad', 'Ameerpet', 'Kondapur', 'Miyapur', 'LB Nagar', 'Dilsukhnagar', 'Uppal'],
    ),
    ServiceCity(
      id: 'warangal',
      name: 'Warangal',
      state: 'Telangana',
      areas: ['Hanamkonda', 'Kazipet', 'Subedari', 'Hunter Road', 'Nakkalagutta'],
    ),
    ServiceCity(
      id: 'karimnagar',
      name: 'Karimnagar',
      state: 'Telangana',
      areas: ['Mukarampura', 'Choppadandi Road', 'Collectorate', 'Bus Stand Area'],
    ),
    ServiceCity(
      id: 'agartala',
      name: 'Agartala',
      state: 'Tripura',
      areas: ['Battala', 'Krishnanagar', 'Melarmath', 'Airport Road', 'GB Bazar'],
    ),
    ServiceCity(
      id: 'lucknow',
      name: 'Lucknow',
      state: 'Uttar Pradesh',
      areas: ['Gomti Nagar', 'Hazratganj', 'Aliganj', 'Indira Nagar', 'Aminabad', 'Alambagh', 'Chowk', 'Mahanagar', 'Rajajipuram', 'Ashiyana', 'Jankipuram'],
    ),
    ServiceCity(
      id: 'noida',
      name: 'Noida',
      state: 'Uttar Pradesh',
      areas: ['Sector 18', 'Sector 62', 'Sector 50', 'Sector 137', 'Sector 76', 'Sector 63', 'Greater Noida West', 'Knowledge Park', 'Alpha 1', 'Pari Chowk'],
    ),
    ServiceCity(
      id: 'kanpur',
      name: 'Kanpur',
      state: 'Uttar Pradesh',
      areas: ['Swaroop Nagar', 'Kakadeo', 'Civil Lines', 'Kalyanpur', 'Barra', 'Rawatpur'],
    ),
    ServiceCity(
      id: 'varanasi',
      name: 'Varanasi',
      state: 'Uttar Pradesh',
      areas: ['Lanka', 'Sigra', 'Bhelupur', 'Assi', 'Godowlia', 'Mahmoorganj'],
    ),
    ServiceCity(
      id: 'agra',
      name: 'Agra',
      state: 'Uttar Pradesh',
      areas: ['Tajganj', 'Civil Lines', 'Sikandra', 'Kamla Nagar', 'Dayal Bagh', 'Fatehabad Road'],
    ),
    ServiceCity(
      id: 'ghaziabad',
      name: 'Ghaziabad',
      state: 'Uttar Pradesh',
      areas: ['Indirapuram', 'Vaishali', 'Kaushambi', 'Raj Nagar Extension', 'Crossings Republik', 'Vasundhara'],
    ),
    ServiceCity(
      id: 'prayagraj',
      name: 'Prayagraj',
      state: 'Uttar Pradesh',
      areas: ['Civil Lines', 'George Town', 'Katra', 'Colonelganj', 'Naini', 'Allahpur'],
    ),
    ServiceCity(
      id: 'meerut',
      name: 'Meerut',
      state: 'Uttar Pradesh',
      areas: ['Civil Lines', 'Shastri Nagar', 'Ganga Nagar', 'Transport Nagar', 'Pallavpuram'],
    ),
    ServiceCity(
      id: 'dehradun',
      name: 'Dehradun',
      state: 'Uttarakhand',
      areas: ['Rajpur Road', 'Clock Tower', 'Prem Nagar', 'Ballupur', 'Sahastradhara', 'ISBT'],
    ),
    ServiceCity(
      id: 'haridwar',
      name: 'Haridwar',
      state: 'Uttarakhand',
      areas: ['Har Ki Pauri', 'Shivalik Nagar', 'Jwalapur', 'BHEL', 'Kankhal'],
    ),
    ServiceCity(
      id: 'nainital',
      name: 'Nainital',
      state: 'Uttarakhand',
      areas: ['Mallital', 'Tallital', 'Sukhatal', 'Ayarpatta', 'Thandi Sadak'],
    ),
    ServiceCity(
      id: 'kolkata',
      name: 'Kolkata',
      state: 'West Bengal',
      areas: ['Salt Lake', 'Park Street', 'New Town', 'Ballygunge', 'Howrah', 'Behala', 'Dum Dum', 'Garia', 'Rajarhat', 'Tollygunge', 'Esplanade', 'Lake Town', 'Jadavpur'],
    ),
    ServiceCity(
      id: 'siliguri',
      name: 'Siliguri',
      state: 'West Bengal',
      areas: ['Hill Cart Road', 'Sevoke Road', 'Pradhan Nagar', 'Hakim Para', 'Matigara'],
    ),
    ServiceCity(
      id: 'durgapur',
      name: 'Durgapur',
      state: 'West Bengal',
      areas: ['City Centre', 'Benachity', 'Muchipara', 'Bidhannagar', 'A-Zone'],
    ),
    ServiceCity(
      id: 'asansol',
      name: 'Asansol',
      state: 'West Bengal',
      areas: ['Burnpur', 'Court More', 'Apcar Garden', 'Hutton Road', 'Kalyanpur'],
    ),
    ServiceCity(
      id: 'delhi',
      name: 'Delhi',
      state: 'Delhi',
      areas: ['Connaught Place', 'Saket', 'Dwarka', 'Rohini', 'Laxmi Nagar', 'South Extension', 'Karol Bagh', 'Mayur Vihar', 'Vasant Kunj', 'Pitampura', 'Chanakyapuri', 'Hauz Khas'],
    ),
    ServiceCity(
      id: 'chandigarh',
      name: 'Chandigarh',
      state: 'Chandigarh',
      areas: ['Sector 17', 'Sector 22', 'Sector 35', 'Sector 43', 'Industrial Area', 'Manimajra', 'Sector 8', 'Sector 9', 'Sector 26', 'Sector 34', 'IT Park'],
    ),
    ServiceCity(
      id: 'puducherry',
      name: 'Puducherry',
      state: 'Puducherry',
      areas: ['White Town', 'Lawspet', 'Oulgaret', 'Villianur', 'Mudaliarpet', 'Gorimedu'],
    ),
    ServiceCity(
      id: 'port-blair',
      name: 'Port Blair',
      state: 'Andaman and Nicobar Islands',
      areas: ['Aberdeen Bazaar', 'Junglighat', 'Dollygunj', 'Bathu Basti', 'Goal Ghar'],
    ),
    ServiceCity(
      id: 'kavaratti',
      name: 'Kavaratti',
      state: 'Lakshadweep',
      areas: ['Kavaratti Town', 'Jetty Area', 'Secretariat Area'],
    ),
    ServiceCity(
      id: 'leh',
      name: 'Leh',
      state: 'Ladakh',
      areas: ['Main Bazaar', 'Changspa', 'Skara', 'Choglamsar', 'Spituk'],
    ),
    ServiceCity(
      id: 'kargil',
      name: 'Kargil',
      state: 'Ladakh',
      areas: ['Main Market', 'Baroo', 'Aquarium Road'],
    ),
    ServiceCity(
      id: 'jammu',
      name: 'Jammu',
      state: 'Jammu and Kashmir',
      areas: ['Gandhi Nagar', 'Trikuta Nagar', 'Channi Himmat', 'Bahu Plaza', 'Raghunath Bazaar'],
    ),
    ServiceCity(
      id: 'srinagar',
      name: 'Srinagar',
      state: 'Jammu and Kashmir',
      areas: ['Lal Chowk', 'Rajbagh', 'Jawahar Nagar', 'Bemina', 'Hazratbal', 'Dal Gate'],
    ),
    ServiceCity(
      id: 'silvassa',
      name: 'Silvassa',
      state: 'Dadra and Nagar Haveli and Daman and Diu',
      areas: ['Town Centre', 'Amli', 'Vapi Road', 'Khanvel Road'],
    ),
    ServiceCity(
      id: 'daman',
      name: 'Daman',
      state: 'Dadra and Nagar Haveli and Daman and Diu',
      areas: ['Nani Daman', 'Moti Daman', 'Devka Beach', 'Seaface'],
    ),
  ];

  static List<String> get allStates {
    final statesSet = <String>{};
    for (final city in cities) {
      statesSet.add(city.state);
    }
    final sorted = statesSet.toList()..sort();
    return sorted;
  }

  static List<ServiceCity> byState(String state) {
    if (state.isEmpty) return cities;
    return cities.where((c) => c.state.toLowerCase() == state.toLowerCase()).toList();
  }

  static ServiceCity? byId(String id) {
    for (final city in cities) {
      if (city.id == id) return city;
    }
    return null;
  }

  static List<ServiceCity> search(String query, {String? state}) {
    final q = query.trim().toLowerCase();
    var list = cities;
    if (state != null && state.isNotEmpty) {
      list = byState(state);
    }
    if (q.isEmpty) return list;
    return list
        .where(
          (c) =>
              c.name.toLowerCase().contains(q) ||
              c.state.toLowerCase().contains(q) ||
              c.id.contains(q) ||
              c.areas.any((a) => a.toLowerCase().contains(q)),
        )
        .toList();
  }
}

class ServiceCity {
  const ServiceCity({
    required this.id,
    required this.name,
    required this.state,
    required this.areas,
  });

  final String id;
  final String name;
  final String state;
  final List<String> areas;
}
