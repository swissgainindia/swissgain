import json
import re

current_file = 'server/utils/cities.ts'

with open(current_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Additional massive list of Indian towns and districts for Phase 3
additional = [
    "Aland", "Almora", "Amalapuram", "Ambah", "Ambasamudram", "Ambejogai", "Amreli",
    "Anakapalle", "Anandpur Sahib", "Anjar", "Anjangaon", "Ankleshwar", "Arakkonam",
    "Arani", "Aruppukkottai", "Ashoknagar", "Ashtamichira", "Attur", "Aurangabad", 
    "Baddi", "Badin", "Baduria", "Bagaha", "Bageshwar", "Bagpat", "Bahadurgarh",
    "Baharampur", "Baheri", "Bahraich", "Bajpur", "Balangir", "Baleshwar", "Ballia",
    "Balrampur", "Banda", "Bandikui", "Banganapalle", "Banswara", "Bapatla", "Baramati",
    "Baramula", "Baraut", "Bargarh", "Barpeta", "Barshi", "Basoda", "Basti", "Batala",
    "Bhadrak", "Bhadravati", "Bhandara", "Bhavani", "Bawan", "Bawana", "Beawar", 
    "Belgaum", "Bettiah", "Bhadu", "Bhadohi", "Bhalukpong", "Bhawanipatna", "Bhilai",
    "Bhilwara", "Bhimavaram", "Bhinmal", "Bhiwadi", "Bhiwandi", "Bhiwani", "Bhongir",
    "Bhusawal", "Bida", "Bijnor", "Bikaner", "Bilara", "Bilasipara", "Bobbili",
    "Bodhan", "Bokaro", "Bongaigaon", "Budaun", "Budge Budge", "Bulandshahr", "Bundi",
    "Buxar", "Byasanagar", "Cambay", "Challakere", "Chandausi", "Chandrapur", "Charkhi Dadri",
    "Chengannur", "Chennai", "Chhatarpur", "Chhindwara", "Chidambaram", "Chikmagalur",
    "Chiknayakanhalli", "Chilakaluripet", "Chinsurah", "Chirala", "Chirmiri", "Chitradurga",
    "Chittur-Thathamangalam", "Chopda", "Chopan", "Chotila", "Churu", "Cuddalore",
    "Cumbum", "Dabra", "Dadri", "Dahod", "Daltonganj", "Damoh", "Darbhanga", "Darjeeling",
    "Datia", "Daund", "Dausa", "Davangere", "Deesa", "Dehradun", "Dehri", "Deoghar",
    "Deoria", "Dewas", "Dhamtari", "Dhanbad", "Dhar", "Dharampur", "Dharamsala",
    "Dharapuram", "Dharmavaram", "Dharwad", "Dhenkanal", "Dholka", "Dhule", "Dhuri",
    "Dibrugarh", "Dimapur", "Dindigul", "Diphu", "Dumka", "Dumdum", "Durg", "Durgapur",
    "Eluru", "English Bazar", "Erode", "Etah", "Etawah", "Faridabad", "Faridkot",
    "Farrukhabad", "Fatehabad", "Fatehpur", "Fazilka", "Firozabad", "Firozpur",
    "Forbesganj", "Gadag-Betageri", "Gadchiroli", "Gadwal", "Gandhidham", "Gandhinagar",
    "Gangarampur", "Gangavathi", "Gangtok", "Ganjam", "Garhwa", "Gauripur", "Gaya",
    "Ghatampur", "Ghatal", "Ghazipur", "Giridih", "Goa Velha", "Goalpara", "Gobichettipalayam",
    "Godda", "Godhra", "Gohana", "Gokak", "Golaghat", "Gomoh", "Gondiya", "Gooty",
    "Gopalganj", "Gorakhpur", "Greater Noida", "Gudivada", "Gudur", "Gumia", "Guna",
    "Guntakal", "Guntur", "Gurdaspur", "Gurgaon", "Guruvayoor", "Gwalior", "Haflong",
    "Hajipur", "Haldia", "Haldwani", "Hamirpur", "Hansi", "Hanumangarh", "Hapur",
    "Harda", "Hardoi", "Haridwar", "Harsawa", "Hassan", "Hastinapur", "Hathras",
    "Hazaribag", "Hilsa", "Himatnagar", "Hindupur", "Hinganghat", "Hingoli", "Hisar",
    "Hodál", "Hojai", "Hoshiarpur", "Hospet", "Howrah", "Hubli", "Hugli", "Hunsur",
    "Hussainabad", "Ichalkaranji", "Ilkal", "Imphal", "Indore", "Indragarh", "Irinjalakuda",
    "Islampur", "Itanagar", "Itarsi", "Jabalpur", "Jagdalpur", "Jaggaiahpet", "Jagraon",
    "Jagtial", "Jahanabad", "Jaipur", "Jais", "Jaisalmer", "Jaitu", "Jajapur", "Jajmau",
    "Jalalabad", "Jalalpore", "Jalandhar", "Jaleswar", "Jalgaon", "Jalna", "Jalor",
    "Jalpaiguri", "Jamalpur", "Jammalamadugu", "Jammu", "Jamnagar", "Jamshedpur",
    "Jamtara", "Jamui", "Jandiala", "Jangaon", "Janjgir", "Jashpurnagar", "Jaspur",
    "Jaunpur", "Jehanabad", "Jhabua", "Jhajjar", "Jhalawar", "Jhansi", "Jhargram",
    "Jharsuguda", "Jhumri Tilaiya", "Jind", "Joda", "Jodhpur", "Jorhat", "Junagadh",
    "Kadapa", "Kadi", "Kadiri", "Kagaznagar", "Kailasahar", "Kaithal", "Kakching",
    "Kakinada", "Kalyan", "Kalyani", "Kamareddy", "Kanchipuram", "Kandukur", "Kangra",
    "Kanhangad", "Kanjikkuzhi", "Kanker", "Kannur", "Kanpur", "Kantabanji", "Kapadvanj",
    "Kapurthala", "Karad", "Karaikal", "Karaikudi", "Karanjia", "Karimganj", "Karimnagar",
    "Karjat", "Karnal", "Karsiyang", "Karur", "Karwar", "Kasaragod", "Kashipur",
    "Kathua", "Katihar", "Kavali", "Kavaratti", "Kayamkulam", "Kendrapara", "Kendujhar",
    "Keshod", "Khagaria", "Khambhat", "Khammam", "Khandwa", "Khanna", "Kharagpur",
    "Kharar", "Kheri", "Khopoli", "Khurda", "Kishanganj", "Kishangarh", "Kochi",
    "Kodungallur", "Kohima", "Kokrajhar", "Kolar", "Kolhapur", "Kolkata", "Kollam",
    "Kondagaon", "Konnagar", "Koothuparamba", "Koraput", "Korba", "Koratla", "Kota",
    "Kot Kapura", "Kothagudem", "Kothamangalam", "Kottayam", "Kovvur", "Kozhikode",
    "Krishnanagar", "Kuchaman", "Kulgam", "Kullu", "Kulti", "Kumbakonam", "Kumta",
    "Kundapura", "Kunnamkulam", "Kurali", "Kurnool", "Kyathampalle", "Lachung",
    "Ladnu", "Ladwa", "Lahar", "Laharpur", "Lakheri", "Lakhimpur", "Lakhisarai",
    "Lakshmeshwar", "Lal Gopalganj Nindaura", "Lalganj", "Lalgudi", "Lalitpur", "Lalsot",
    "Lanka", "Lar", "Lathi", "Latur", "Lilong", "Limbdi", "Lingsugur", "Loha",
    "Lohardaga", "Lonar", "Lonavla", "Longowal", "Loni", "Losal", "Lucknow", "Ludhiana",
    "Lumding", "Lunawada", "Lunglei", "Macherla", "Machilipatnam", "Madanapalle",
    "Maddur", "Madhepura", "Madhubani", "Madhugiri", "Madhupur", "Madikeri", "Madurai",
    "Magadi", "Mahad", "Mahbubnagar", "Mahalingapura", "Maharajganj", "Maharajpur",
    "Mahasamund", "Mahbubnagar", "Mahe", "Mahemdabad", "Mahendragarh", "Mahesana",
    "Mahidpur", "Mahnar Bazar", "Mahuva", "Maihar", "Mainaguri", "Makhdumpur", "Makrana",
    "Mal", "Malaj Khand", "Malappuram", "Malavalli", "Malegaon", "Malerkotla", "Malkangiri",
    "Malkapur", "Malout", "Malpura", "Malur", "Manachanallur", "Manasa", "Manavadar",
    "Manawar", "Mancherial", "Mandalgarh", "Mandamarri", "Mandapeta", "Mandawa", "Mandi",
    "Mandi Dabwali", "Mandideep", "Mandla", "Mandsaur", "Mandvi", "Mandya", "Manendragarh",
    "Maner", "Mangaldoi", "Mangaluru", "Mangalvedhe", "Manglaur", "Mangrol", "Mangrulpir",
    "Manihari", "Manjlegaon", "Mankachar", "Manmad", "Mansa", "Manuguru", "Manvi",
    "Manwath", "Mapusa", "Margao", "Margherita", "Marhaura", "Mariani", "Marigaon",
    "Markapur", "Marmagao", "Masaurhi", "Mathabhanga", "Mathura", "Mattannur", "Mauganj",
    "Mavelikkara", "Mavoor", "Mayang Imphal", "Medak", "Medininagar", "Medinipur",
    "Meerut", "Mehkar", "Mehemdabad", "Memari", "Merta City", "Mhaswad", "Mhow Cantonment",
    "Mhowgaon", "Mihijam", "Mira-Bhayandar", "Mirganj", "Miryalaguda", "Modasa", "Modinagar",
    "Moga", "Mohali", "Mokameh", "Mokokchung", "Monoharpur", "Moradabad", "Morena",
    "Morinda", "Morshi", "Morvi", "Motihari", "Motipur", "Mount Abu", "Mudalagi",
    "Mudabidri", "Muddebihal", "Mudhol", "Mukerian", "Mukhed", "Muktsar", "Mul",
    "Mulbagal", "Multai", "Mumbai", "Mundargi", "Mundi", "Mungeli", "Munger", "Muradnagar",
    "Murbad", "Murshidabad", "Murtizapur", "Murwara", "Musabani", "Mussoorie", "Muvattupuzha",
    "Muzaffarpur", "Mysore", "Nabadwip", "Nabarangapur", "Nabha", "Nadbai", "Nadiad",
    "Nagaon", "Nagapattinam", "Nagar", "Nagari", "Nagarkurnool", "Nagaur", "Nagda",
    "Nagercoil", "Nagina", "Nagla", "Nagpur", "Nahan", "Naharlagun", "Naidupet",
    "Naihati", "Naila Janjgir", "Nainital", "Nainpur", "Najibabad", "Nakodar", "Naksalbari",
    "Nalbari", "Namagiripettai", "Namakkal", "Nanded-Waghala", "Nandgaon", "Nandivaram-Guduvancheri",
    "Nandura", "Nandurbar", "Nandyal", "Nangal", "Nanjangud", "Nanjikottai", "Nanpara",
    "Narasapur", "Narasaraopet", "Naraura", "Narayanpet", "Nargund", "Narkatiaganj",
    "Narkhed", "Narnaul", "Narsinghgarh", "Narsinghpur", "Narsipatnam", "Narwana", "Nashik",
    "Nasirabad", "Natham", "Nathdwara", "Naugachhia", "Nanjangud", "Navalgund", "Navi Mumbai",
    "Navsari", "Nawabganj", "Nawada", "Nawanshahr", "Nawapur", "Nedumangad", "Neem-Ka-Thana",
    "Neemuch", "Nehtaur", "Nelamangala", "Nellikuppam", "Nellore", "Nepanagar", "New Delhi",
    "Neyveli", "Neyyattinkara", "Nidadavole", "Nilambur", "Nilanga", "Nimbahera", "Nirmal",
    "Niwari", "Nizamabad", "Nohar", "Noida", "Nokha", "Nongstoin", "Noorpur", "North Lakhimpur",
    "Nowgong", "Nowrozabad", "Nuzvid", "O' Valley", "Oddanchatram", "Obra", "Ongole",
    "Orai", "Osmanabad", "Ottappalam", "Ozar", "P.N.Patti", "Pachora", "Pachore",
    "Pacode", "Padmanabhapuram", "Padra", "Padrauna", "Paithan", "Pakaur", "Palacole",
    "Palai", "Palakkad", "Palampur", "Palani", "Palanpur", "Palasa Kasibugga", "Palghar",
    "Pali", "Palia Kalan", "Palitana", "Palladam", "Pallapatti", "Pallikonda", "Palwal",
    "Palwancha", "Panagar", "Panagudi", "Panaji", "Panamattom", "Panchkula", "Panchla",
    "Pandharkaoda", "Pandharpur", "Pandhurna", "Pandua", "Panipat", "Panna", "Panniyannur",
    "Panruti", "Panvel", "Pappinisseri", "Paradip", "Paramakudi", "Parangipettai", "Parasi",
    "Paravoor", "Parbhani", "Pardi", "Parlakhemundi", "Parli", "Partur", "Parvathipuram",
    "Pasan", "Paschim Punropara", "Pasighat", "Patan", "Pathanamthitta", "Pathankot",
    "Pathardi", "Pathri", "Patiala", "Patna", "Patratu", "Pattamundai", "Patti", "Pattran",
    "Pattukkottai", "Patur", "Pauni", "Pauri", "Pavagada", "Pedana", "Peddapuram",
    "Pehowa", "Pen", "Perambalur", "Peravurani", "Peringathur", "Perinthalmanna", "Periyakulam",
    "Periyasemur", "Pernampattu", "Perumbavoor", "Petlad", "Phagwara", "Phalodi", "Phaltan",
    "Phillaur", "Phulabani", "Phulera", "Phulpur", "Phusro", "Pihani", "Pilani", "Pilibanga",
    "Pilibhit", "Pilkhuwa", "Pindwara", "Pinjore", "Pipar City", "Pipariya", "Piro",
    "Pithampur", "Pithapuram", "Pithoragarh", "Pollachi", "Polur", "Pondicherry", "Ponnani",
    "Ponneri", "Ponnur", "Porbandar", "Porsa", "Port Blair", "Powayan", "Prantij", "Pratapgarh",
    "Prithvipur", "Proddatur", "Pudukkottai", "Pudupattinam", "Pukhrayan", "Pulgaon", "Puliyankudi",
    "Punalur", "Punch", "Pune", "Punjaipugalur", "Punganur", "Puranpur", "Purna", "Purnia",
    "Purqazi", "Purulia", "Purwa", "Pusad", "Puttur", "Putu", "Qadian", "Quilandy",
    "Rabkavi Banhatti", "Radhanpur", "Rae Bareli", "Rafiganj", "Raghogarh-Vijaypur", "Raghunathpur",
    "Rahatgarh", "Rahuri", "Raiganj", "Raigarh", "Raikot", "Raipur", "Rairangpur", "Raisen",
    "Raisinghnagar", "Rajagangapur", "Rajahmundry", "Rajakhera", "Rajaldesar", "Rajam",
    "Rajampet", "Rajapalayam", "Rajauri", "Rajgarh", "Rajgir", "Rajkot", "Rajnandgaon",
    "Rajpipla", "Rajpura", "Rajsamand", "Rajula", "Rajura", "Ramachandrapuram", "Ramagundam",
    "Ramanagaram", "Ramanathapuram", "Ramdurg", "Rameshwaram", "Ramganj Mandi", "Ramngarh",
    "Ramnagar", "Ramgarh", "Rampur", "Rampur Maniharan", "Rampurhat", "Ramura", "Ranaghat",
    "Ranavav", "Ranchi", "Ranebennuru", "Rangia", "Rania", "Ranibennur", "Ranipet", "Rapar",
    "Rasipuram", "Rasra", "Ratangarh", "Rath", "Ratia", "Ratlam", "Ratnagiri", "Rau", "Raurkela",
    "Raver", "Rawatbhata", "Rawatsar", "Raxaul Bazar", "Rayachoti", "Rayadurg", "Rayagada",
    "Reengus", "Rehli", "Renigunta", "Renukoot", "Reoti", "Repalle", "Revelganj", "Rewa", "Rewari",
    "Rishikesh", "Risod", "Robertsganj", "Robertson Pet", "Rohtak", "Ron", "Roorkee", "Rosera",
    "Rudauli", "Rudrapur", "Rupnagar", "Sabalgarh", "Sadabad", "Sadalagi", "Sadasivpet", "Sadri",
    "Sadulpur", "Sadulshahar", "Safidon", "Safipur", "Sagar", "Sagara", "Sagwara", "Saharanpur",
    "Saharsa", "Sahaspur", "Sahaswan", "Sahawar", "Sahibganj", "Sahjanwa", "Saidpur", "Saiha",
    "Sailu", "Sainthia", "Sakaleshapura", "Sakti", "Salaya", "Salem", "Salur", "Samalkha",
    "Samalkot", "Samana", "Samastipur", "Sambalpur", "Sambhal", "Sambhar", "Samdhan", "Samthar",
    "Sanand", "Sanawad", "Sanchore", "Sandi", "Sandila", "Sanduru", "Sangamner", "Sangareddy",
    "Sangaria", "Sangli", "Sangole", "Sangrur", "Sankarankovil", "Sankari", "Sankeshwara", "Santipur",
    "Sarangpur", "Sardarshahar", "Sardhana", "Sarni", "Sarsawan", "Sasaram", "Sasvad", "Satana",
    "Satara", "Sathyamangalam", "Satna", "Sattenapalle", "Sattur", "Saunda", "Saundatti-Yellamma",
    "Sausar", "Savanur", "Savarkundla", "Savner", "Sawai Madhopur", "Sawantwadi", "Sedam", "Sehore",
    "Sendhwa", "Seohara", "Seoni", "Seoni-Malwa", "Shahabad", "Shahade", "Shahbad", "Shahdol",
    "Shahganj", "Shahjahanpur", "Shahpur", "Shahpura", "Shajapur", "Shamgarh", "Shamli",
    "Shamsabad", "Shegaon", "Sheikhpura", "Shendurjana", "Shenkottai", "Sheoganj", "Sheohar",
    "Sheopur", "Sherghati", "Sherkot", "Shiggaon", "Shikaripur", "Shikarpur", "Shikohabad", "Shillong",
    "Shimla", "Shirdi", "Shirpur-Warwade", "Shirur", "Shishgarh", "Shivamogga", "Shivpuri", "Sholavandan",
    "Sholingur", "Shoranur", "Surapura", "Shrigonda", "Shrirampur", "Shrirangapattana", "Shujalpur",
    "Siana", "Sibsagar", "Siddipet", "Sidhi", "Sidhpur", "Sidlaghatta", "Sihor", "Sihora",
    "Sikanderpur", "Sikandra Rao", "Sikandrabad", "Sikar", "Silao", "Silapathar", "Silchar", "Siliguri",
    "Sillod", "Silvassa", "Simdega", "Sindagi", "Sindhagi", "Sindhnur", "Singrauli", "Sinnar",
    "Sira", "Sircilla", "Sirhind Fatehgarh Sahib", "Sirkali", "Sirohi", "Sironj", "Sirsa", "Sirsaganj",
    "Sirsi", "Siruguppa", "Sitamarhi", "Sitapur", "Sitarganj", "Sivaganga", "Sivagiri", "Sivakasi",
    "Siwan", "Sohagpur", "Sohna", "Sojat", "Solan", "Solapur", "Sonamukhi", "Sonepur", "Songadh",
    "Sonipat", "Sopore", "Soro", "Soron", "Soyagaon", "Sri Madhopur", "Srikakulam", "Srikalahasti",
    "Srinagar", "Srinivaspur", "Srirampore", "Srisailam Project (Right Flank Colony)", "Srivilliputhur",
    "Sugauli", "Sujangarh", "Sujanpur", "Sullurpeta", "Sultanganj", "Sultanpur", "Sumerpur", "Sunam",
    "Sundargarh", "Sundarnagar", "Supaul", "Surandai", "Surapura", "Surat", "Suratgarh", "Suri",
    "Suriyampalayam", "Suryapet", "Tadepalligudem", "Tadipatri", "Takhatgarh", "Taki", "Talaja",
    "Talcher", "Talegaon Dabhade", "Talikota", "Taliparamba", "Talode", "Tamluk", "Tanda",
    "Tandur", "Tanuku", "Tarakeswar", "Tarana", "Taranagar", "Taraori", "Tarbha", "Tarikere", "Tarn Taran",
    "Tasgaon", "Tehri", "Tekkalakote", "Tenali", "Tenkasi", "Tenu dam-cum-Kathhara", "Terdal", "Tezpur",
    "Thakurdwara", "Thammampatti", "Thana Bhawan", "Thane", "Thanesar", "Thangadh", "Thanjavur",
    "Tharad", "Tharamangalam", "Tharangambadi", "Theni Allinagaram", "Thirumangalam", "Thirupuvanam",
    "Thiruthuraipoondi", "Thiruvalla", "Thiruvallur", "Thiruvananthapuram", "Thiruvarur", "Thodupuzha",
    "Thoubal", "Thrissur", "Thuraiyur", "Tikamgarh", "Tilda Newra", "Tilhar", "Tindivanam", "Tinsukia",
    "Tiptur", "Tirora", "Tiruchendur", "Tiruchengode", "Tiruchirappalli", "Tirukalukundram",
    "Tirukkoyilur", "Tirunelveli", "Tirupathur", "Tirupati", "Tiruppur", "Tiruttani", "Tiruvannamalai",
    "Tiruvethipuram", "Tiruvuru", "Tirwaganj", "Titlagarh", "Tittakudi", "Todabhim", "Todaraisingh",
    "Tohana", "Tonk", "Tuensang", "Tuljapur", "Tulsipur", "Tumkur", "Tumsar", "Tundla", "Tuni",
    "Tura", "Uchgaon", "Udaipur", "Udaipurwati", "Udgir", "Udhagamandalam", "Udhampur",
    "Udumalaipettai", "Udupi", "Ujhani", "Ujjain", "Umarga", "Umaria", "Umarkhed", "Umbergaon",
    "Umred", "Umreth", "Una", "Unjha", "Unnamalaikadai", "Unnao", "Upleta", "Uran", "Uran Islampur",
    "Uravakonda", "Urmar Tanda", "Usilampatti", "Uthamapalayam", "Uthiramerur", "Utraula",
    "Vadakkuvalliyur", "Vadalur", "Vadgaon Kasba", "Vadipatti", "Vadnagar", "Vadodara",
    "Vaijapur", "Vaikom", "Valparai", "Valsad", "Vandavasi", "Vaniyambadi", "Vapi", "Varanasi",
    "Varkala", "Vasai-Virar", "Vatakara", "Vedaranyam", "Vellakoil", "Vellore", "Venkatagiri",
    "Veraval", "Vidisha", "Vijainagar", "Vijapur", "Vijayapura", "Vijayawada", "Vijaypur", "Vikarabad",
    "Vikramasingapuram", "Viluppuram", "Vinukonda", "Viramgam", "Viravanallur", "Virudhunagar",
    "Visakhapatnam", "Visnagar", "Viswanatham", "Vita", "Vizianagaram", "Vrindavan", "Vyara",
    "Wadgaon Road", "Wadhwan", "Wadi", "Wai", "Wanaparthy", "Wani", "Wankaner", "Wara Seoni",
    "Warangal", "Wardha", "Warhapur", "Warisaliganj", "Warora", "Warud", "Washim", "Wokha",
    "Yadgir", "Yamunanagar", "Yanam", "Yavatmal", "Yawal", "Yellandu", "Yemmiganur",
    "Yerraguntla", "Yevla", "Zaidpur", "Zamania", "Zira", "Zirakpur", "Zunheboto"
]

# extract existing cities
# Find the array content
start_idx = content.find('export const cities = [')
end_idx = content.find('];', start_idx) + 2

array_text = content[start_idx:end_idx]
# parse current cities
current_cities = []
for match in re.finditer(r'"([^"]+)"', array_text):
    current_cities.append(match.group(1))

# Combine and deduplicate
all_cities_set = set()
unique_cities = []

for city in current_cities:
    city_formatted = city.strip().title()
    # Filter out anything with weird characters
    if not re.match(r'^[A-Za-z0-9 \-]+$', city_formatted):
        continue
    if city_formatted not in all_cities_set:
        all_cities_set.add(city_formatted)
        unique_cities.append(city_formatted)

for city in additional:
    city_formatted = city.strip().title()
    if not re.match(r'^[A-Za-z0-9 \-]+$', city_formatted):
        continue
    if city_formatted not in all_cities_set:
        all_cities_set.add(city_formatted)
        unique_cities.append(city_formatted)

unique_cities.sort()

# Limit strictly to 1000
unique_cities = unique_cities[:1000]

# Generate new formatted array
formatted_cities = "export const cities = [\n  "
lines = []
current_line = []
for c in unique_cities:
    current_line.append(f'"{c}"')
    if len(current_line) == 10:
        lines.append(", ".join(current_line))
        current_line = []

if current_line:
    lines.append(", ".join(current_line))

formatted_cities += ",\n  ".join(lines)
formatted_cities += "\n];"

new_content = content[:start_idx] + formatted_cities + content[end_idx:]

with open(current_file, 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"Updated cities.ts. Total cities: {len(unique_cities)}")
