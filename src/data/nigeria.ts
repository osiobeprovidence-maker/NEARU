export interface NigeriaState {
  name: string;
  code: string;
  cities: string[];
}

export const NIGERIA_STATES: NigeriaState[] = [
  {
    name: "Abia",
    code: "AB",
    cities: ["Aba", "Umuahia", "Ohafia", "Arochukwu", "Bende", "Ikwuano", "Isiala Ngwa North", "Isiala Ngwa South", "Isuikwuato", "Obi Ngwa", "Osisioma Ngwa", "Ugwunagbo", "Ukwa East", "Ukwa West", "Umu Nneochi"],
  },
  {
    name: "Adamawa",
    code: "AD",
    cities: ["Yola", "Mubi", "Jimeta", "Numan", "Girei", "Song", "Michika", "Madagali", "Maiha", "Shelleng", "Demsa", "Fufore", "Ganaye", "Giribe", "Jada", "Lamurde", "Longo", "Mayo-Belwa", "Toungo", "Yola North", "Yola South"],
  },
  {
    name: "Akwa Ibom",
    code: "AK",
    cities: ["Uyo", "Eket", "Ikot Ekpene", "Abak", "Etinan", "Ikot Abasi", "Ini", "Ibiono Ibom", "Ibesikpo Asutan", "Mkpat Enin", "Nsit Atai", "Nsit Ibom", "Nsit Ubium", "Obot Akara", "Okobo", "Oron", "Udung Uko", "Ukanafun", "Ure Offot", "Uruan", "Urue-Offong/Oruko"],
  },
  {
    name: "Anambra",
    code: "AN",
    cities: ["Awka", "Onitsha", "Nnewi", "Ekwulobia", "Aguata", "Anambra East", "Anambra West", "Anaocha", "Awka North", "Awka South", "Ayamelum", "Dunukofia", "Ekwusigo", "Idemili North", "Idemili South", "Ihiala", "Ikwu", "Njikoka", "Nnewi North", "Nnewi South", "Ogbaru", "Onitsha North", "Onitsha South", "Orumba North", "Orumba South", "Oyi"],
  },
  {
    name: "Bauchi",
    code: "BA",
    cities: ["Bauchi", "Azare", "Misau", "Ningi", "Tafawa Balewa", "Jama'are", "Katagum", "Itas/Gadau", "Shira", "Gamawa", "Galambi", "Bogoro", "Dass", "Tafawa Balewa", "Alkaleri", "Darazo", "Kirfi", "Warji", "Zaki"],
  },
  {
    name: "Bayelsa",
    code: "BY",
    cities: ["Yenagoa", "Brass", "Nembe", "Sagbama", "Ekeremor", "Kolokuma/Opokuma", "Ogbia", "Southern Ijaw", "Yenagoa"],
  },
  {
    name: "Benue",
    code: "BE",
    cities: ["Makurdi", "Otukpo", "Gboko", "Vandeikya", "Katsina-Ala", "Aleer", "Agatu", "Apa", "Buruku", "Guma", "Gwer East", "Gwer West", "Konshisha", "Logo", "Ogbadibo", "Ohimini", "Oju", "Okpokwu", "Oturkpo", "Tarka", "Ukum", "Ushongo", "Vandeikya"],
  },
  {
    name: "Borno",
    code: "BO",
    cities: ["Maiduguri", "Bama", "Biu", "Dikwa", "Gwoza", "Jere", "Kaga", "Kala/Balge", "Konduga", "Kukawa", "Mafa", "Magumeri", "Marte", "Monguno", "Ngala", "Nganzai", "Shani"],
  },
  {
    name: "Cross River",
    code: "CR",
    cities: ["Calabar", "Ikom", "Obudu", "Ogoja", "Akpabuyo", "Bakassi", "Bekwarra", "Biase", "Boki", "Calabar Municipal", "Calabar South", "Etung", "Ikom", "Obanliku", "Obudu", "Ogoja", "Yakuur", "Yala"],
  },
  {
    name: "Delta",
    code: "DE",
    cities: ["Warri", "Asaba", "Sapele", "Ughelli", "Agbor", "Effurun", "Udu", "Ethiope East", "Ethiope West", "Ika North East", "Ika South", "Ishielu", "Ika South", "Ndokwa East", "Ndokwa West", "Okpe", "Oshimili North", "Oshimili South", "Patani", "Ughelli North", "Ughelli South", "Ukwuani", "Uvwie", "Warri North", "Warri South", "Warri South West"],
  },
  {
    name: "Ebonyi",
    code: "EB",
    cities: ["Abakaliki", "Afikpo", "Ishielu", "Ikwo", "Onicha", "Ohaukwu", "Abakaliki", "Afikpo North", "Afikpo South", "Ebonyi", "Ezza North", "Ezza South", "Ikwo", "Ishielu", "Ivo", "Izzi", "Ohaozara", "Ohaukwu", "Onicha"],
  },
  {
    name: "Edo",
    code: "ED",
    cities: ["Benin City", "Auchi", "Igarra", "Ekpoma", "Uromi", "Ubiaja", "Akoko-Edo", "Egor", "Esan Central", "Esan North-East", "Esan South-East", "Esan West", "Etsako Central", "Etsako East", "Etsako West", "Igorhon", "Oredo", "Orhionmwon", "Ovia North-East", "Ovia South-West", "Owan East", "Owan West", "Uhunmwonde"],
  },
  {
    name: "Ekiti",
    code: "EK",
    cities: ["Ado-Ekiti", "Ikere-Ekiti", "Aramoko-Ekiti", "Efon-Alaaye", "Emure-Ekiti", "Igbemo-Ekiti", "Ise-Ekiti", "Ekiti East", "Ekiti South-West", "Ekiti West", "Emure", "Gbonyin", "Ido-Osi", "Ijero", "Ikere", "Ikole", "Ilejemeje", "Irepodun/Ifelodun", "Ise/Orun", "Moba", "Oye"],
  },
  {
    name: "Enugu",
    code: "EN",
    cities: ["Enugu", "Nsukka", "Agbani", "Awgu", "Udi", "Ezeagu", "Enugu East", "Enugu North", "Enugu South", "Igbo-Etiti", "Igbo-Eze North", "Igbo-Eze South", "Isi-Uzo", "Nkanu East", "Nkanu West", "Nsukka", "Oji River", "Udenu", "Udi", "Uzo-Uwani"],
  },
  {
    name: "FCT",
    code: "FC",
    cities: ["Abuja", "Gwagwalada", "Kuje", "Bwari", "Abaji", "Kwali", "Municipal Area Council"],
  },
  {
    name: "Gombe",
    code: "GO",
    cities: ["Gombe", "Billiri", "Kaltungo", "Yamaltu/Deba", "Akko", "Balanga", "Benishangul", "Dukku", "Funakaye", "Gombe", "Kaltungo", "Kwami", "Nafada", "Shongom", "Yamaltu/Deba"],
  },
  {
    name: "Imo",
    code: "IM",
    cities: ["Owerri", "Orlu", "Okigwe", "Oguta", "Mbaitoli", "Nkwerre", "Nwangele", "Ideato North", "Ideato South", "Ihitte/Uboma", "Ikeduru", "Isu", "Mbaitoli", "Ngor-Okpala", "Njaba", "Nkwerre", "Nwangele", "Obowo", "Oguta", "Ohaji/Egbema", "Okigwe", "Orlu", "Orsu", "Oru East", "Oru West", "Owerri Municipal", "Owerri North", "Owerri West", "Unuimo"],
  },
  {
    name: "Jigawa",
    code: "JI",
    cities: ["Dutse", "Hadejia", "Kazaure", "Ringim", "Gumel", "Birnin Kudu", "Buji", "Gagarawa", "Garki", "Gumel", "Gwiwa", "Hadejia", "Jahun", "Kafin Hausa", "Kaugama", "Kazaure", "Kiri Kasama", "Maigatari", "Malam Madori", "Miga", "Roni", "Sule Tankarkar", "Taura", "Yankwashi"],
  },
  {
    name: "Kaduna",
    code: "KD",
    cities: ["Kaduna", "Zaria", "Kafanchan", "Saminaka", "Birnin Gwari", "Chikun", "Giwa", "Igabi", "Ikara", "Jaba", "Jema'a", "Kachia", "Kaduna North", "Kaduna South", "Kagarko", "Kajuru", "Kaura", "Kauru", "Kubau", "Kudan", "Lere", "Makarfi", "Sabon Gari", "Sanga", "Soba", "Zangon Kataf", "Zaria"],
  },
  {
    name: "Kano",
    code: "KN",
    cities: ["Kano", "Dawakin Tofa", "Ungogo", "Kumbotso", "Gwale", "Fagge", "Kano Municipal", "Tarauni", "Nassarawa", "Bunkure", "Dala", "Gardo", "Gezawa", "Gwarzo", "Kabo", "Kibiya", "Kiru", "Kura", "Madobi", "Makoda", "Minjibir", "Rano", "Rimin Gado", "Shanono", "Sumaila", "Takai", "Tofa", "Tsanyawa", "Tudun Wada", "Warawa", "Wudil"],
  },
  {
    name: "Katsina",
    code: "KT",
    cities: ["Katsina", "Dutsin-Ma", "Funtua", "Malumfashi", "Bakori", "Batagarawa", "Batsari", "Baure", "Bindawa", "Charanchi", "Dandume", "Danja", "Dan Musa", "Daura", "Dutsin-Ma", "Faskari", "Funtua", "Ingawa", "Jibia", "Kafur", "Kaita", "Kankara", "Kankia", "Katsina", "Kurfi", "Kusada", "Mai'Adua", "Malumfashi", "Mani", "Mashi", "Matazu", "Musawa", "Rimi", "Sabuwa", "Safana", "Sandamu", "Zango"],
  },
  {
    name: "Kebbi",
    code: "KE",
    cities: ["Birnin Kebbi", "Argungu", "Yauri", "Ngaski", "Anka", "Augie", "Bagudo", "Birnin Kebbi", "Bunza", "Dandi", "Fakai", "Gwandu", "Jega", "Kalgo", "Koko/Besse", "Maiyama", "Ngaski", "Sakaba", "Shanga", "Suru", "Wasagu/Danko", "Yauri", "Zuru"],
  },
  {
    name: "Kogi",
    code: "KG",
    cities: ["Lokoja", "Okene", "Idah", "Kabba", "Ankpa", "Bassa", "Dekina", "Ibaji", "Idah", "Igalamela Odolu", "Ijumu", "Kabba/Bunu", "Kogi", "Lokoja", "Mopa-Muro", "Ofu", "Ogori/Magongo", "Okehi", "Okene", "Olamaboro", "Omala", "Yagba East", "Yagba West"],
  },
  {
    name: "Kwara",
    code: "KW",
    cities: ["Ilorin", "Offa", "Omu-Aran", "Patigi", "Arepata", "Asa", "Baruten", "Edu", "Ekiti", "Ilorin East", "Ilorin South", "Ilorin West", "Irepodun", "Isin", "Kaiama", "Moro", "Offa", "Oke-Ero", "Oyun", "Patigi"],
  },
  {
    name: "Lagos",
    code: "LA",
    cities: ["Lagos Island", "Lagos Mainland", "Ikeja", "Surulere", "Yaba", "Victoria Island", "Lekki", "Ajah", "Ikoyi", "Ikorodu", "Epe", "Badagry", "Mushin", "Oshodi-Isolo", "Alimosho", "Amuwo-Odofin", "Apapa", "Eti-Osa", "Ibeju-Lekki", "Ifako-Ijaiye", "Ikeja", "Kosofe", "Lagos Island", "Lagos Mainland", "Ojo", "Oshodi-Isolo", "Shomolu", "Surulere"],
  },
  {
    name: "Nasarawa",
    code: "NA",
    cities: ["Lafia", "Akwanga", "Doma", "Keffi", "Nasarawa", "Toto", "Akwanga", "Awe", "Doma", "Karu", "Keana", "Keffi", "Kokona", "Lafia", "Nasarawa", "Nasarawa Egon", "Obi", "Toto", "Wamba"],
  },
  {
    name: "Niger",
    code: "NI",
    cities: ["Minna", "Bida", "Kontagora", "Suleja", "Agaie", "Agwara", "Bida", "Borgu", "Bosso", "Chanchaga", "Edati", "Gbako", "Gurara", "Katcha", "Kontagora", "Lapai", "Lavun", "Magama", "Mariga", "Mashegu", "Mokwa", "Muya", "Paikoro", "Rafi", "Rijau", "Shiroro", "Suleja", "Tafa", "Wushishi"],
  },
  {
    name: "Ogun",
    code: "OG",
    cities: ["Abeokuta", "Ijebu-Ode", "Sagamu", "Ilaro", "Ota", "Ado-Odo/Ota", "Ewekoro", "Ifo", "Ijebu East", "Ijebu North", "Ijebu Ode", "Ikenne", "Imeko Afon", "Ipokia", "Obafemi-Owode", "Odeda", "Odogbolu", "Ogun Waterside", "Remo North", "Shagamu"],
  },
  {
    name: "Ondo",
    code: "ON",
    cities: ["Akure", "Ondo", "Owo", "Ikare-Akoko", "Oka-Akoko", "Akoko North-East", "Akoko North-West", "Akoko South-East", "Akoko South-West", "Akure North", "Akure South", "Ese-Odo", "Idanre", "Ifedore", "Ilaje", "Ile-Oluji/Okeigbo", "Irele", "Odigbo", "Okitipupa", "Ondo East", "Ondo West", "Ose", "Owo"],
  },
  {
    name: "Osun",
    code: "OS",
    cities: ["Osogbo", "Ile-Ife", "Oyo", "Iwo", "Ede", "Ilesa", "Atakumosa East", "Atakumosa West", "Ayedire", "Ayedaade", "Boluwaduro", "Boripe", "Ede North", "Ede South", "Egbedore", "Ejigbo", "Ife Central", "Ife East", "Ife North", "Ife South", "Ifedayo", "Ifelodun", "Ila", "Ilesa East", "Ilesa West", "Irepodun", "Irewole", "Isokan", "Iwo", "Obokun", "Odo-Otin", "Ola-Oluwa", "Olorunda", "Oriade", "Orolu", "Osogbo"],
  },
  {
    name: "Oyo",
    code: "OY",
    cities: ["Ibadan", "Ogbomoso", "Oyo", "Iseyin", "Saki", "Afijio", "Akinyele", "Atiba", "Atisbo", "Egbeda", "Ibadan North", "Ibadan North-East", "Ibadan North-West", "Ibadan South-East", "Ibadan South-West", "Ibarapa Central", "Ibarapa East", "Ibarapa North", "Ido", "Irepo", "Iseyin", "Itesiwaju", "Iwajowa", "Kajola", "Lagelu", "Ogo Oluwa", "Ogbomoso North", "Ogbomoso South", "Oyo East", "Oyo West", "Saki East", "Saki West", "Surulere"],
  },
  {
    name: "Plateau",
    code: "PL",
    cities: ["Jos", "Bukuru", "Shendam", "Mangu", "Barkin Ladi", "Bassa", "Bokkos", "Jos East", "Jos North", "Jos South", "Kanam", "Kanke", "Langtang North", "Langtang South", "Mangu", "Mikang", "Pankshin", "Qua'an Pan", "Riyom", "Shendam", "Wase"],
  },
  {
    name: "Rivers",
    code: "RI",
    cities: ["Port Harcourt", "Obio-Akpor", "Ikwerre", "Emohua", "Degema", "Bonny", "Okrika", "Ogu/Bolo", "Tai", "Gokana", "Khana", "Andoni", "Asari-Toru", "Akuku-Toru", "Brass", "Eleme", "Emohua", "Ikwerre", "Khana", "Obio-Akpor", "Ogba/Egbema/Ndoni", "Ogu/Bolo", "Okrika", "Omuma", "Opobo/Nkoro", "Oyigbo", "Port Harcourt", "Tai"],
  },
  {
    name: "Sokoto",
    code: "SO",
    cities: ["Sokoto", "Wurno", "Tambuwal", "Gwadabawa", "Gudu", "Gwadabawa", "Illela", "Isa", "Kebbe", "Kware", "Rabah", "Sabon Birni", "Shagari", "Silame", "Sokoto North", "Sokoto South", "Tambuwal", "Tangaza", "Tureta", "Wamako", "Wurno", "Yabo"],
  },
  {
    name: "Taraba",
    code: "TA",
    cities: ["Jalingo", "Wukari", "Bali", "Gassol", "Ibi", "Ardo Kola", "Bali", "Donga", "Gashaka", "Gassol", "Ibi", "Jalingo", "Karim Lamido", "Kurmi", "Sardauna", "Takum", "Ussa", "Wukari", "Yorro"],
  },
  {
    name: "Yobe",
    code: "YO",
    cities: ["Damaturu", "Potiskum", "Gujba", "Nguru", "Bade", "Bursari", "Damaturu", "Fika", "Fune", "Geidam", "Gujba", "Gulani", "Jakusko", "Karasuwa", "Machina", "Nangere", "Nguru", "Tarmuwa", "Yunusari", "Yusufari"],
  },
  {
    name: "Zamfara",
    code: "ZA",
    cities: ["Gusau", "Kaura Namoda", "Talata Mafara", "Anka", "Bakura", "Birnin Magaji/Kiyaw", "Bukkuyum", "Bungudu", "Gummi", "Gusau", "Kaura Namoda", "Maradun", "Maru", "Shinkafi", "Talata Mafara", "Tsafe", "Zurmi"],
  },
];

export const COUNTRIES = ["Nigeria"];
