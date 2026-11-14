import type { Question } from '../types';

// Alternatives are accepted ways to say the answer, not multiple-choice distractors.
// IDs are authored explicitly so reordering a group never changes a saved question ID.
type QuestionText = [
  id: string,
  story: string,
  prompt: string,
  expectedAnswer: string,
  alternatives: string[],
  emoji: string,
  title: string,
  description: string
];

const groups: { category: Question['category']; level: number; items: QuestionText[] }[] = [
  {
    category: 'mendengar',
    level: 1,
    items: [
      [
        'mendengar-1-01',
        '[NamaAnak] membawa sebuah apel untuk bekal di taman.',
        'Buah apa yang dibawa untuk bekal?',
        'apel',
        ['buah apel'],
        '🍱',
        'Isi bekal',
        'Ingat buah yang disebut saat cerita dimulai.'
      ],
      [
        'mendengar-1-02',
        'Hujan turun. [NamaOrtu] membuka payung berwarna merah.',
        'Apa warna payung yang dibuka?',
        'merah',
        ['warna merah'],
        '☔',
        'Payung hujan',
        'Dengarkan kata warna sesudah kata payung.'
      ],
      [
        'mendengar-1-03',
        '[NamaOrtu] memotret [HewanPeliharaan] menggunakan kamera.',
        'Alat apa yang dipakai untuk memotret [HewanPeliharaan]?',
        'kamera',
        ['sebuah kamera', 'alat kamera'],
        '📷',
        'Foto hewan kesayangan',
        'Ingat alat yang disebut sesudah kata menggunakan.'
      ],
      [
        'mendengar-1-04',
        'Di pesta keluarga, [NamaTeman] memegang balon kuning.',
        'Apa warna balon yang dipegang [NamaTeman]?',
        'kuning',
        ['warna kuning'],
        '🎈',
        'Balon pesta',
        'Coba ingat warna benda yang dipegang teman.'
      ],
      [
        'mendengar-1-05',
        'Bel sepeda di halaman berbunyi kring, kring.',
        'Bagaimana bunyi bel sepeda itu?',
        'kring, kring',
        ['kring', 'kring kring'],
        '🔔',
        'Dengarkan bunyinya',
        'Tirukan suara yang kamu dengar dalam cerita.'
      ],
      [
        'mendengar-1-06',
        'Sesudah berjalan bersama keluarga, Sari minum air putih.',
        'Apa yang diminum Sari?',
        'air putih',
        ['air', 'segelas air putih'],
        '🥤',
        'Sesudah berjalan',
        'Ingat nama minuman, bukan kegiatan Sari.'
      ],
      [
        'mendengar-1-07',
        'Raka menyusun puzzle bergambar gajah.',
        'Hewan apa yang ada pada gambar puzzle?',
        'gajah',
        ['seekor gajah'],
        '🧩',
        'Gambar puzzle',
        'Ingat hewan yang disebut bersama puzzle.'
      ],
      [
        'mendengar-1-08',
        'Di kertas Lila ada satu bentuk lingkaran besar.',
        'Bentuk apa yang ada di kertas Lila?',
        'lingkaran',
        ['lingkaran besar', 'bentuk lingkaran'],
        '🔵',
        'Bentuk di kertas',
        'Yang ditanyakan bentuknya, bukan ukurannya.'
      ],
      [
        'mendengar-1-09',
        'Bersama kakek, Bima menanam biji bunga matahari.',
        'Biji bunga apa yang ditanam Bima?',
        'bunga matahari',
        ['matahari', 'biji bunga matahari'],
        '🌱',
        'Kebun kecil',
        'Ingat nama bunga setelah kata biji.'
      ],
      [
        'mendengar-1-10',
        'Di perpustakaan, Nisa memilih buku tentang kereta.',
        'Buku pilihan Nisa bercerita tentang apa?',
        'kereta',
        ['kereta api', 'tentang kereta'],
        '📚',
        'Buku pilihan',
        'Bayangkan gambar kendaraan pada buku itu.'
      ],
      [
        'mendengar-1-11',
        'Pagi hari, seekor burung berkicau di pohon depan rumah.',
        'Kapan burung itu berkicau?',
        'pagi hari',
        ['pagi', 'pada pagi hari'],
        '🌤️',
        'Waktu berkicau',
        'Ingat waktu yang disebut paling awal.'
      ],
      [
        'mendengar-1-12',
        'Sebelum tidur, Danu menarik selimut ungu ke atas kakinya.',
        'Apa warna selimut Danu?',
        'ungu',
        ['warna ungu'],
        '🛏️',
        'Selimut tidur',
        'Cari kata warna di dekat kata selimut.'
      ],
      [
        'mendengar-1-13',
        'Ibu menyentuhkan es berbungkus kain ke tangan Rani sebentar. Rani berkata, terasa dingin.',
        'Bagaimana rasa es itu menurut Rani?',
        'dingin',
        ['terasa dingin'],
        '🧊',
        'Rasa di tangan',
        'Ingat kata yang diucapkan Rani.'
      ],
      [
        'mendengar-1-14',
        'Saat bermain musik, Tono memukul drum mainan.',
        'Alat musik apa yang dimainkan Tono?',
        'drum mainan',
        ['drum', 'gendang mainan'],
        '🥁',
        'Musik mainan',
        'Ingat benda yang dipukul saat bermain musik.'
      ],
      [
        'mendengar-1-15',
        '[NamaAnak] mencuci tangan sebelum makan siang.',
        'Apa yang dilakukan [NamaAnak] sebelum makan siang?',
        'mencuci tangan',
        ['cuci tangan', 'membasuh tangan'],
        '🧼',
        'Sebelum makan',
        'Ingat kegiatan yang disebut sebelum waktu makan.'
      ],
      [
        'mendengar-1-16',
        '[NamaOrtu] melipat kertas menjadi perahu.',
        'Kertas itu dilipat menjadi apa?',
        'perahu',
        ['perahu kertas', 'sebuah perahu'],
        '⛵',
        'Lipatan kertas',
        'Ingat hasil lipatannya, bukan bahannya.'
      ],
      [
        'mendengar-1-17',
        'Sesudah pulang, Wulan menaruh sepatu di rak.',
        'Di mana Wulan menaruh sepatunya?',
        'di rak',
        ['rak', 'di rak sepatu'],
        '👟',
        'Sepatu rapi',
        'Bayangkan tempat sepatu disimpan saat pulang.'
      ],
      [
        'mendengar-1-18',
        'Seekor semut berjalan di atas daun.',
        'Hewan kecil apa yang berjalan di atas daun?',
        'semut',
        ['seekor semut'],
        '🍃',
        'Tamu di daun',
        'Ingat nama hewan, bukan tempatnya berjalan.'
      ],
      [
        'mendengar-1-19',
        'Mira menempel stiker berbentuk bintang pada sampul bukunya.',
        'Apa bentuk stiker Mira?',
        'bintang',
        ['bentuk bintang', 'stiker bintang'],
        '⭐',
        'Stiker buku',
        'Ingat bentuk yang disebut setelah kata stiker.'
      ],
      [
        'mendengar-1-20',
        '[NamaTeman] menggambar laut memakai krayon biru.',
        'Apa warna krayon untuk menggambar laut?',
        'biru',
        ['warna biru', 'krayon biru'],
        '🖍️',
        'Warna laut',
        'Dengarkan warna alat gambar yang digunakan.'
      ]
    ]
  },
  {
    category: 'mendengar',
    level: 2,
    items: [
      [
        'mendengar-2-01',
        'Tas piknik berwarna hijau. Botol minum di dalamnya berwarna jingga.',
        'Apa warna botol minum, bukan tasnya?',
        'jingga',
        ['oranye', 'warna jingga'],
        '🍶',
        'Dua warna',
        'Pisahkan warna tas dari warna botol.'
      ],
      [
        'mendengar-2-02',
        'Kemarin cuaca mendung. Hari ini matahari bersinar cerah.',
        'Bagaimana cuaca kemarin?',
        'mendung',
        ['cuaca mendung', 'langit mendung'],
        '🌥️',
        'Kemarin dan hari ini',
        'Ingat bagian cerita sebelum kata hari ini.'
      ],
      [
        'mendengar-2-03',
        'Boneka diletakkan di sofa. Mobil mainan disimpan di dalam kotak.',
        'Mainan apa yang disimpan di dalam kotak?',
        'mobil mainan',
        ['mobil', 'mainan mobil'],
        '📦',
        'Tempat mainan',
        'Cocokkan setiap mainan dengan tempatnya.'
      ],
      [
        'mendengar-2-04',
        '[NamaAnak] meminjam buku ikan. [NamaTeman] meminjam buku kupu-kupu.',
        'Siapa yang meminjam buku kupu-kupu?',
        '[NamaTeman]',
        ['teman bernama [NamaTeman]', '[NamaTeman] yang meminjamnya'],
        '🦋',
        'Dua peminjam',
        'Ingat buku yang dipilih orang kedua dalam cerita.'
      ],
      [
        'mendengar-2-05',
        'Pada permainan bunyi, bel berbunyi lebih dulu. Sesudah itu terdengar tepuk tangan.',
        'Bunyi apa yang terdengar sesudah bel?',
        'tepuk tangan',
        ['suara tepuk tangan', 'tepukan tangan'],
        '👏',
        'Urutan bunyi',
        'Ingat bunyi kedua, bukan bunyi pertama.'
      ],
      [
        'mendengar-2-06',
        'Pagi hari, nenek menyiram tanaman tomat. Sore hari, nenek menyiram tanaman cabai.',
        'Tanaman apa yang disiram pada sore hari?',
        'cabai',
        ['tanaman cabai', 'cabe'],
        '🪴',
        'Waktu menyiram',
        'Hubungkan sore hari dengan tanaman yang disebut sesudahnya.'
      ],
      [
        'mendengar-2-07',
        'Sebelum istirahat, kelas bernyanyi. Sesudah istirahat, kelas menggambar.',
        'Apa kegiatan kelas sesudah istirahat?',
        'menggambar',
        ['kegiatan menggambar', 'membuat gambar'],
        '🎨',
        'Jadwal kelas',
        'Cari kegiatan setelah jeda istirahat.'
      ],
      [
        'mendengar-2-08',
        'Di piring ada dua potong pepaya dan tiga potong melon.',
        'Ada berapa potong pepaya?',
        'dua',
        ['2', 'dua potong', '2 potong pepaya'],
        '🍈',
        'Dua jenis buah',
        'Ingat jumlah pepaya saja, tidak perlu menjumlahkan buah.'
      ],
      [
        'mendengar-2-09',
        'Dita memainkan tamborin. Arman memainkan seruling.',
        'Alat musik apa yang dimainkan Arman?',
        'seruling',
        ['suling', 'alat musik seruling'],
        '🎶',
        'Pemain musik',
        'Pasangkan nama Arman dengan alat musiknya.'
      ],
      [
        'mendengar-2-10',
        'Di pasar bersama ayah, Ina membeli wortel, bukan kentang.',
        'Sayur apa yang dibeli Ina?',
        'wortel',
        ['sayur wortel', 'sebuah wortel'],
        '🥕',
        'Belanja sayur',
        'Perhatikan sayur yang dibeli, bukan yang ditolak.'
      ],
      [
        'mendengar-2-11',
        'Dalam dongeng, tokoh bernama [HewanPeliharaan] minum dari mangkuk, lalu berbaring di atas alas.',
        'Apa yang dilakukan [HewanPeliharaan] sebelum berbaring?',
        'minum',
        ['minum dari mangkuk', 'meminum air'],
        '🐾',
        'Sebelum berbaring',
        'Kembali ke kegiatan pertama hewan dalam cerita.'
      ],
      [
        'mendengar-2-12',
        'Awalnya Fajar memakai topi hitam. Ia menggantinya dengan topi putih.',
        'Apa warna topi yang dipakai Fajar setelah berganti?',
        'putih',
        ['warna putih', 'topi putih'],
        '🧢',
        'Topi pengganti',
        'Ingat topi terakhir, bukan topi semula.'
      ],
      [
        'mendengar-2-13',
        'Kertas persegi diberikan kepada Nuri. Kertas segitiga diberikan kepada Bayu.',
        'Apa bentuk kertas yang diterima Nuri?',
        'persegi',
        ['bujur sangkar', 'bentuk persegi'],
        '🔷',
        'Kertas untuk siapa',
        'Cocokkan nama Nuri dengan bentuk kertasnya.'
      ],
      [
        'mendengar-2-14',
        'Keluarga pergi ke kebun binatang naik bus, lalu pulang naik kereta.',
        'Kendaraan apa yang dipakai saat pulang?',
        'kereta',
        ['kereta api', 'naik kereta'],
        '🚆',
        'Pergi dan pulang',
        'Bedakan perjalanan berangkat dan perjalanan kembali.'
      ],
      [
        'mendengar-2-15',
        '[NamaOrtu] membuat roti untuk sarapan dan sup untuk makan siang.',
        'Makanan apa yang dibuat untuk sarapan?',
        'roti',
        ['roti untuk sarapan', 'makanan roti'],
        '🍞',
        'Dua waktu makan',
        'Ingat pasangan makanan dan waktu makan yang pertama.'
      ],
      [
        'mendengar-2-16',
        'Saat mendongeng, suara kelinci dibuat pelan. Suara beruang dibuat berat.',
        'Tokoh mana yang suaranya pelan?',
        'kelinci',
        ['tokoh kelinci', 'si kelinci'],
        '🐰',
        'Suara tokoh',
        'Ingat sifat suara masing-masing tokoh dongeng.'
      ],
      [
        'mendengar-2-17',
        'Riri menyukai aroma jeruk. Kakaknya menyukai aroma melati.',
        'Aroma apa yang disukai kakak Riri?',
        'melati',
        ['aroma melati', 'bunga melati'],
        '🌼',
        'Aroma kesukaan',
        'Yang ditanyakan kesukaan kakak, bukan Riri.'
      ],
      [
        'mendengar-2-18',
        'Mereka melihat pelangi dari teras, bukan dari jendela.',
        'Dari mana mereka melihat pelangi?',
        'teras',
        ['dari teras', 'di teras rumah'],
        '🌈',
        'Tempat melihat',
        'Perhatikan tempat yang dipakai, bukan tempat yang disebut setelah bukan.'
      ],
      [
        'mendengar-2-19',
        '[NamaAnak] menaruh sendok di sebelah kanan piring dan gelas di sebelah kiri piring.',
        'Benda apa yang ada di sebelah kiri piring?',
        'gelas',
        ['gelas minum', 'sebuah gelas'],
        '🍽️',
        'Kiri dan kanan',
        'Cocokkan sisi kiri dengan benda yang disebut.'
      ],
      [
        'mendengar-2-20',
        'Ikan pada lukisan berukuran kecil. Kapal pada lukisan berukuran besar.',
        'Benda apa yang digambar besar?',
        'kapal',
        ['gambar kapal', 'kapal pada lukisan'],
        '🖼️',
        'Ukuran pada lukisan',
        'Ingat pasangan benda dan ukuran, bukan ukuran benda sungguhan.'
      ]
    ]
  },
  {
    category: 'mendengar',
    level: 3,
    items: [
      [
        'mendengar-3-01',
        '[NamaAnak] mengambil buku, duduk di karpet, lalu membuka halaman pertama.',
        'Apa yang dilakukan tepat setelah mengambil buku?',
        'duduk di karpet',
        ['duduk', 'ia duduk di karpet'],
        '📖',
        'Langkah di tengah',
        'Ada tiga kegiatan. Ingat kegiatan yang berada di tengah.'
      ],
      [
        'mendengar-3-02',
        'Lonceng berbunyi, disusul ketukan pintu, lalu terdengar siulan.',
        'Bunyi apa yang terdengar tepat sebelum siulan?',
        'ketukan pintu',
        ['suara ketukan pintu', 'pintu diketuk'],
        '🚪',
        'Tiga bunyi',
        'Putar kembali urutan bunyinya dalam pikiran.'
      ],
      [
        'mendengar-3-03',
        'Kue pisang dibawa Ema, puding dibawa Joko, dan jagung rebus dibawa Uli.',
        'Siapa yang membawa puding?',
        'Joko',
        ['Joko yang membawa puding', 'dibawa Joko'],
        '🍮',
        'Bekal bersama',
        'Cocokkan makanan di tengah daftar dengan pembawanya.'
      ],
      [
        'mendengar-3-04',
        'Di meja ada pensil hijau, penghapus merah, dan penggaris biru.',
        'Apa warna penghapus di meja?',
        'merah',
        ['warna merah', 'penghapus merah'],
        '✏️',
        'Tiga alat tulis',
        'Jangan tertukar antara warna pensil, penghapus, dan penggaris.'
      ],
      [
        'mendengar-3-05',
        'Ibu meminta tiga apel dan satu pir. Toko kehabisan pir, jadi ibu hanya membawa pulang tiga apel.',
        'Buah apa yang tidak jadi dibawa pulang?',
        'pir',
        ['buah pir', 'satu pir'],
        '🛍️',
        'Daftar yang berubah',
        'Bandingkan buah yang diminta dengan buah yang tersedia.'
      ],
      [
        'mendengar-3-06',
        '[NamaTeman] meletakkan bola di bawah meja, lalu memindahkannya ke dalam keranjang. Meja tetap di tempatnya.',
        'Di mana bola berada pada akhir cerita?',
        'di dalam keranjang',
        ['di keranjang', 'keranjang'],
        '🏀',
        'Ikuti bolanya',
        'Ikuti benda yang berpindah, bukan meja yang tetap diam.'
      ],
      [
        'mendengar-3-07',
        'Senin kelas membuat kolase. Selasa kelas berkebun. Rabu kelas bermain musik.',
        'Kegiatan apa yang dilakukan pada Selasa?',
        'berkebun',
        ['kegiatan berkebun', 'kelas berkebun'],
        '📅',
        'Tiga hari',
        'Pasangkan hari kedua dengan kegiatan yang diceritakan.'
      ],
      [
        'mendengar-3-08',
        'Kupu-kupu hinggap di mawar, lebah mendekati melati, dan capung berhenti di pagar.',
        'Serangga apa yang berhenti di pagar?',
        'capung',
        ['seekor capung', 'si capung'],
        '🌸',
        'Pengunjung kebun',
        'Ingat tempat masing-masing serangga berada.'
      ],
      [
        'mendengar-3-09',
        'Pita merah dipakai untuk hadiah. Pita biru disimpan. Pita kuning dipasang pada layang-layang.',
        'Pita warna apa yang hanya disimpan?',
        'biru',
        ['pita biru', 'warna biru'],
        '🎀',
        'Tiga pita',
        'Yang ditanyakan pita yang belum dipakai untuk apa pun.'
      ],
      [
        'mendengar-3-10',
        'Dalam dongeng, kura-kura membawa peta, rusa membawa air, dan burung hantu membawa lentera.',
        'Siapa yang membawa peta dalam dongeng?',
        'kura-kura',
        ['kura kura', 'si kura-kura'],
        '🗺️',
        'Bekal tokoh dongeng',
        'Hubungkan tiap tokoh dengan benda bawaannya.'
      ],
      [
        'mendengar-3-11',
        '[NamaOrtu] berpesan, taruh baju di lemari, handuk di gantungan, dan kaus kaki di laci.',
        'Benda apa yang harus ditaruh di laci?',
        'kaus kaki',
        ['kaos kaki', 'sepasang kaus kaki'],
        '🧦',
        'Pesan merapikan',
        'Ingat tempat untuk tiap jenis pakaian.'
      ],
      [
        'mendengar-3-12',
        'Rombongan keluarga melihat kolam lebih dulu, lalu rumah kupu-kupu, dan terakhir taman bunga.',
        'Tempat apa yang dikunjungi kedua?',
        'rumah kupu-kupu',
        ['rumah kupu kupu', 'tempat kupu-kupu'],
        '🏞️',
        'Rute kunjungan',
        'Bayangkan tiga tempat itu dalam urutan perjalanan.'
      ],
      [
        'mendengar-3-13',
        'Sup Lani tidak pedas. Sup kakak pedas. Untuk adik disiapkan bubur hangat.',
        'Bagaimana rasa sup Lani?',
        'tidak pedas',
        ['supnya tidak pedas', 'sup Lani tidak pedas'],
        '🥣',
        'Mangkuk berbeda',
        'Fokus pada sup milik Lani, bukan milik kakak.'
      ],
      [
        'mendengar-3-14',
        'Tari membawa tiga kerang putih, dua batu abu-abu, dan satu daun cokelat untuk kolase.',
        'Berapa batu abu-abu yang dibawa Tari?',
        'dua',
        ['2', 'dua batu', '2 batu'],
        '🪨',
        'Bahan kolase',
        'Ingat jumlah batu saja di antara tiga jenis bahan.'
      ],
      [
        'mendengar-3-15',
        'Pada latihan gerak, guru berkata, tepuk tangan dua kali, sentuh bahu, lalu angkat kedua tangan.',
        'Bagian tubuh apa yang disentuh sebelum tangan diangkat?',
        'bahu',
        ['kedua bahu', 'bahunya'],
        '🙌',
        'Dengar gerakannya',
        'Ingat gerakan setelah tepukan dan sebelum angkatan tangan.'
      ],
      [
        'mendengar-3-16',
        'Gambar [HewanPeliharaan] diberi latar hijau. Bingkai gambarnya putih dan tulisan namanya cokelat.',
        'Apa warna latar pada gambar [HewanPeliharaan]?',
        'hijau',
        ['warna hijau', 'latar hijau'],
        '🐾',
        'Gambar berbingkai',
        'Pisahkan warna latar dari warna bingkai dan tulisan nama.'
      ],
      [
        'mendengar-3-17',
        'Kiki ingin jus mangga, tetapi mangga habis. Ia memilih jus jambu. Adiknya memilih jus alpukat.',
        'Jus apa yang akhirnya dipilih Kiki?',
        'jus jambu',
        ['jambu', 'minuman jambu'],
        '🍹',
        'Pilihan pengganti',
        'Ingat pilihan akhir Kiki, bukan keinginan awal atau pilihan adik.'
      ],
      [
        'mendengar-3-18',
        'Di akuarium, ikan bergaris berenang di atas. Ikan berbintik berenang di tengah. Ikan polos berenang di bawah.',
        'Seperti apa ikan yang berenang di tengah?',
        'berbintik',
        ['ikan berbintik', 'memiliki bintik-bintik'],
        '🐟',
        'Penghuni akuarium',
        'Cocokkan corak ikan dengan tempat berenangnya.'
      ],
      [
        'mendengar-3-19',
        '[NamaAnak] membawa saputangan, [NamaOrtu] membawa tikar, dan [NamaTeman] membawa bola saat piknik.',
        'Siapa yang membawa tikar saat piknik?',
        '[NamaOrtu]',
        ['orang tua bernama [NamaOrtu]', '[NamaOrtu] yang membawa tikar'],
        '🧺',
        'Bawaan piknik',
        'Ingat pembawa benda yang dipakai sebagai alas duduk.'
      ],
      [
        'mendengar-3-20',
        'Lampu panggung berubah dari biru menjadi merah, lalu menjadi hijau saat lagu berakhir.',
        'Apa warna lampu tepat sebelum berubah menjadi hijau?',
        'merah',
        ['warna merah', 'lampu merah'],
        '💡',
        'Lampu berubah',
        'Ingat warna di tengah urutan, bukan warna terakhir.'
      ]
    ]
  },
  {
    category: 'mendengar',
    level: 4,
    items: [
      [
        'mendengar-4-01',
        'Untuk pertunjukan boneka, Sinta mengurus tirai dan Rudi mengurus musik. Awalnya Lala akan menjadi narator, tetapi ia bertukar tugas dengan Beni yang semula memegang boneka.',
        'Siapa yang menjadi narator setelah bertukar tugas?',
        'Beni',
        ['Beni menjadi narator', 'Beni yang bercerita'],
        '🎭',
        'Tugas bertukar',
        'Ingat tugas awal dua anak yang saling bertukar.'
      ],
      [
        'mendengar-4-02',
        '[NamaAnak] menaruh kartu kelinci di amplop merah dan kartu ikan di amplop biru. Kartu burung tidak dimasukkan ke amplop; kartu itu tetap di meja.',
        'Kartu bergambar apa yang tetap di meja?',
        'burung',
        ['kartu burung', 'kartu bergambar burung'],
        '✉️',
        'Kartu yang tersisa',
        'Dua kartu masuk amplop, satu kartu tidak.'
      ],
      [
        'mendengar-4-03',
        'Kelas mula-mula akan menanam bayam pada Jumat. Karena bibit belum datang, kegiatan menanam dipindah ke Sabtu. Kegiatan melukis tetap pada Kamis.',
        'Mengapa kegiatan menanam dipindah ke Sabtu?',
        'bibit belum datang',
        ['karena bibit belum datang', 'bibitnya belum tiba'],
        '🌱',
        'Alasan jadwal berubah',
        'Ingat alasan yang disebut, bukan hanya hari penggantinya.'
      ],
      [
        'mendengar-4-04',
        'Dalam permainan toko, Dodi membeli dua roti dan satu kotak susu. Nena membeli satu roti dan dua kotak susu. Penjual memasukkan belanjaan Dodi ke tas kain dan belanjaan Nena ke keranjang.',
        'Ada berapa kotak susu di dalam keranjang Nena?',
        'dua',
        ['2', 'dua susu', 'dua kotak susu'],
        '🛒',
        'Belanja dua pembeli',
        'Pasangkan nama pembeli, wadah, dan jumlah susunya.'
      ],
      [
        'mendengar-4-05',
        'Guru membunyikan marakas, drum, lalu bel. Ia mengulang urutan itu sekali lagi, tetapi pada pengulangan, bunyi terakhir diganti tepuk tangan.',
        'Bunyi apa yang menutup urutan saat diulang?',
        'tepuk tangan',
        ['tepukan tangan', 'suara tepuk tangan'],
        '🪇',
        'Urutan dengan pengganti',
        'Perhatikan bagian yang berubah saat urutan diulang.'
      ],
      [
        'mendengar-4-06',
        'Di taman bersama keluarga, [NamaTeman] duduk di bangku dekat kolam. [NamaAnak] duduk di tikar dekat bunga. [NamaOrtu] berdiri di samping tikar sambil memegang bekal.',
        'Siapa yang duduk dekat kolam?',
        '[NamaTeman]',
        ['teman bernama [NamaTeman]', '[NamaTeman] duduk di sana'],
        '🏞️',
        'Posisi saat piknik',
        'Bedakan orang di bangku, orang di tikar, dan orang yang berdiri.'
      ],
      [
        'mendengar-4-07',
        'Pada rak atas ada kotak benang. Rak tengah berisi kain dan rak bawah berisi kertas. Kain dipinjam untuk membuat boneka, lalu dikembalikan ke rak semula.',
        'Ke rak mana kain dikembalikan?',
        'rak tengah',
        ['ke rak tengah', 'di rak tengah'],
        '🧵',
        'Kembali ke tempatnya',
        'Ingat letak kain sebelum dipinjam.'
      ],
      [
        'mendengar-4-08',
        'Ayah membacakan dongeng tentang siput yang mencari daun. Di dekat batu, siput bertemu katak. Di dekat kolam, siput bertemu capung. Daun ditemukan di bawah semak.',
        'Di dekat apa siput bertemu katak?',
        'batu',
        ['di dekat batu', 'dekat sebuah batu'],
        '🐌',
        'Pertemuan di perjalanan',
        'Jangan tertukar antara tempat pertemuan dan tempat daun ditemukan.'
      ],
      [
        'mendengar-4-09',
        'Resep salad buah keluarga memakai melon, pepaya, dan pisang. Hari itu pepaya diganti mangga. Yogurt disajikan terpisah agar setiap orang bisa memilih.',
        'Buah apa yang digantikan oleh mangga?',
        'pepaya',
        ['buah pepaya', 'pepaya yang diganti'],
        '🥗',
        'Bahan pengganti',
        'Ingat bahan semula, bukan buah yang menggantikannya.'
      ],
      [
        'mendengar-4-10',
        'Kartu pos untuk nenek bergambar gunung dan ditulis dengan pena biru. Kartu untuk paman bergambar pantai dan ditulis dengan pena hitam. Keduanya dimasukkan ke amplop putih.',
        'Apa gambar pada kartu yang ditulis dengan pena hitam?',
        'pantai',
        ['gambar pantai', 'pemandangan pantai'],
        '📮',
        'Dua kartu pos',
        'Hubungkan warna pena dengan penerima dan gambar kartunya.'
      ],
      [
        'mendengar-4-11',
        'Nina berlatih tiga gerakan: rentangkan tangan, tekuk lutut, lalu berdiri tegak. Sesudah itu ia hanya mengulang gerakan pertama dan terakhir.',
        'Gerakan apa yang tidak diulang Nina?',
        'menekuk lutut',
        ['tekuk lutut', 'gerakan menekuk lutut'],
        '🤸',
        'Gerakan yang dilewati',
        'Ingat gerakan tengah dalam latihan awal.'
      ],
      [
        'mendengar-4-12',
        '[NamaOrtu] mengantar [HewanPeliharaan] ke dokter hewan. Dokter mencatat nama hewan lebih dulu, lalu berat tubuhnya, dan terakhir jadwal pemeriksaan berikutnya. Sesudah itu mereka pulang.',
        'Apa yang dicatat dokter setelah nama hewan dan sebelum jadwal pemeriksaan?',
        'berat tubuh',
        ['berat tubuhnya', 'berat badan', 'berat [HewanPeliharaan]'],
        '🩺',
        'Catatan dokter hewan',
        'Bayangkan tiga hal yang dicatat dokter dalam satu urutan.'
      ],
      [
        'mendengar-4-13',
        'Dalam lomba membuat menara balok, kelompok A memakai balok kayu. Kelompok B memakai balok busa. Menara kayu paling tinggi, tetapi menara busa mendapat pita karena paling rapi.',
        'Menara dari bahan apa yang mendapat pita?',
        'busa',
        ['balok busa', 'menara busa'],
        '🏗️',
        'Dua hasil yang berbeda',
        'Bedakan penghargaan untuk kerapian dari ukuran tinggi.'
      ],
      [
        'mendengar-4-14',
        'Ira mencatat bunyi di halaman: gemerisik daun saat angin bertiup, kicau burung saat matahari muncul, dan tetes air sesudah tanaman disiram.',
        'Bunyi apa yang dicatat sesudah tanaman disiram?',
        'tetes air',
        ['suara tetes air', 'tetesan air'],
        '💧',
        'Catatan bunyi',
        'Hubungkan bunyi dengan kejadian yang menyertainya.'
      ],
      [
        'mendengar-4-15',
        'Semua anak membawa alat gambar. Adit membawa cat air dan kuas, Rena membawa pensil warna, sedangkan Oki membawa krayon dan buku gambar.',
        'Siapa yang membawa kuas?',
        'Adit',
        ['Adit yang membawa kuas', 'kuas dibawa Adit'],
        '🖌️',
        'Perlengkapan menggambar',
        'Ingat anak yang membawa dua alat untuk memakai cat.'
      ],
      [
        'mendengar-4-16',
        'Rencana keluarga adalah sarapan, berkunjung ke museum, lalu makan siang. Museum ternyata belum buka, jadi mereka ke taman sebelum makan siang. Sarapan tetap dilakukan di rumah.',
        'Tempat apa yang dikunjungi sebagai pengganti museum?',
        'taman',
        ['ke taman', 'taman sebagai pengganti'],
        '🏛️',
        'Rencana cadangan',
        'Pisahkan rencana awal dari tempat yang benar-benar didatangi.'
      ],
      [
        'mendengar-4-17',
        'Untuk percobaan warna, guru menyiapkan air biru di gelas besar, air kuning di gelas kecil, dan air bening di kendi. Yang dituangkan pertama adalah air dari gelas kecil.',
        'Apa warna air yang dituangkan pertama?',
        'kuning',
        ['air kuning', 'warna kuning'],
        '🧪',
        'Wadah dan warna',
        'Ingat isi wadah yang disebut pada akhir cerita.'
      ],
      [
        'mendengar-4-18',
        '[NamaOrtu] berpesan agar buku cerita masuk kantong depan tas, botol masuk kantong samping tas, dan jaket dibawa di tangan. [NamaAnak] mengulang pesan itu sebelum berangkat.',
        'Benda apa yang tidak dimasukkan ke tas atau kantong?',
        'jaket',
        ['jaket yang dibawa di tangan', 'baju jaket'],
        '🎒',
        'Pesan sebelum berangkat',
        'Ingat benda yang tempatnya berbeda dari dua benda lain.'
      ],
      [
        'mendengar-4-19',
        'Pada peta kebun, tanda bulat menunjukkan kolam. Tanda segitiga menunjukkan gazebo, dan tanda persegi menunjukkan kebun sayur. Guru menunjuk tanda segitiga saat menjelaskan tempat istirahat.',
        'Tempat apa yang ditunjuk guru?',
        'gazebo',
        ['gazebo tempat istirahat', 'tempat istirahat berupa gazebo'],
        '🗺️',
        'Arti tanda peta',
        'Cocokkan bentuk yang ditunjuk dengan keterangan petanya.'
      ],
      [
        'mendengar-4-20',
        'Pada acara kelas, puisi dibacakan sebelum lagu. Sesudah lagu ada istirahat minum. Tari selendang ditampilkan paling akhir, setelah istirahat minum.',
        'Acara apa yang berlangsung tepat sebelum istirahat minum?',
        'lagu',
        ['menyanyikan lagu', 'penampilan lagu'],
        '🎤',
        'Susunan acara',
        'Susun kembali acara, termasuk waktu istirahatnya.'
      ]
    ]
  },
  {
    category: 'mendengar',
    level: 5,
    items: [
      [
        'mendengar-5-01',
        'Untuk pameran, ada lukisan laut milik Ayu, kolase daun milik Rafi, dan model rumah milik Nala. Semula kolase akan dipajang di tengah. Guru kemudian menaruh model rumah di tengah dan kolase di dekat pintu. Lukisan laut tetap di dekat jendela.',
        'Karya siapa yang akhirnya dipajang di tengah?',
        'Nala',
        ['karya Nala', 'model rumah milik Nala'],
        '🏠',
        'Pemilik dan letak akhir',
        'Hubungkan karya yang pindah ke tengah dengan nama pembuatnya.'
      ],
      [
        'mendengar-5-02',
        '[NamaAnak] dan [NamaTeman] menyiapkan piknik bersama [NamaOrtu]. [NamaAnak] diminta membawa piring dan tisu; [NamaTeman] membawa cangkir dan sendok. Karena tisu sudah ada di keranjang, [NamaAnak] hanya mengambil piring. Tidak ada tugas lain yang berubah.',
        'Siapa yang tetap bertugas membawa sendok?',
        '[NamaTeman]',
        ['teman bernama [NamaTeman]', 'sendok dibawa [NamaTeman]'],
        '🥄',
        'Tugas yang tetap',
        'Abaikan perubahan pada tisu, lalu ingat pembawa sendok sejak awal.'
      ],
      [
        'mendengar-5-03',
        'Pada permainan bunyi, guru mengetuk meja sekali, bertepuk dua kali, lalu menggoyang marakas. Saat mengulang, guru mengganti ketukan meja dengan bunyi bel. Tepukan dan marakas tetap sama.',
        'Berapa kali tepukan terdengar dalam satu urutan pengulangan?',
        'dua',
        ['2', 'dua kali', '2 kali'],
        '👏',
        'Bagian yang tidak berubah',
        'Hanya bunyi pertama yang diganti; ingat jumlah pada bagian berikutnya.'
      ],
      [
        'mendengar-5-04',
        'Di kebun kelas, pot merah berisi kemangi, pot putih berisi tomat, dan pot biru berisi bayam. Pot tomat dipindah dari teras ke dekat pagar. Pot bayam tetap di teras, sedangkan pot kemangi dibawa ke dekat jendela.',
        'Apa warna pot yang dipindah ke dekat pagar?',
        'putih',
        ['pot putih', 'warna putih'],
        '🪴',
        'Isi pot dan perpindahan',
        'Ingat tanaman yang pindah ke pagar, lalu warna pot tanaman itu.'
      ],
      [
        'mendengar-5-05',
        'Keluarga berencana ke toko buku setelah sarapan, lalu ke rumah nenek. Toko buku tutup pagi itu. Mereka langsung ke rumah nenek dan baru membeli buku sore hari setelah pulang dari sana. Mereka tetap sarapan di rumah sendiri.',
        'Ke mana keluarga pergi tepat setelah sarapan pada hari itu?',
        'rumah nenek',
        ['ke rumah nenek', 'mengunjungi nenek'],
        '📚',
        'Rencana dan kenyataan',
        'Ikuti perjalanan yang benar-benar dilakukan, bukan urutan rencananya.'
      ],
      [
        'mendengar-5-06',
        'Dina membuat cap daun dengan cat hijau di kertas kuning. Eko memakai cat kuning di kertas putih. Fani memakai cat biru di kertas hijau. Karya Eko dijemur lebih dulu karena paling cepat selesai.',
        'Apa warna kertas karya yang dijemur lebih dulu?',
        'putih',
        ['kertas putih', 'warna putih'],
        '🍃',
        'Cat bukan kertas',
        'Cari pembuat karya yang selesai dulu, lalu ingat warna kertasnya.'
      ],
      [
        'mendengar-5-07',
        'Guru membagi tugas: kelompok awan menyiapkan kursi, kelompok bintang menyiapkan buku, dan kelompok bulan menyiapkan alas duduk. Sesudah kursi siap, kelompok awan membantu kelompok bulan. Kelompok bintang tetap mengerjakan tugas awal.',
        'Kelompok apa yang tetap menyiapkan buku?',
        'kelompok bintang',
        ['bintang', 'kelompok bernama bintang'],
        '🌟',
        'Kelompok dan tugas',
        'Bedakan kelompok yang berpindah tugas dari kelompok yang tidak berubah.'
      ],
      [
        'mendengar-5-08',
        'Dalam dongeng, berang-berang menyimpan pita di kotak bambu, kancing di kantong kain, dan bulu di keranjang. Ia meminjamkan kotak bambu kepada kelinci tanpa mengeluarkan isinya. Kantong kain dan keranjang tetap di rumahnya.',
        'Benda apa yang ikut terbawa saat kelinci meminjam kotak bambu?',
        'pita',
        ['seutas pita', 'pita di dalam kotak'],
        '🎋',
        'Wadah beserta isinya',
        'Ingat isi kotak sebelum kotak itu dipinjamkan.'
      ],
      [
        'mendengar-5-09',
        'Nenek bercerita bahwa saat kecil ia suka bermain congklak pada sore hari dan membaca pada malam hari. Sekarang nenek membaca pada pagi hari, lalu merawat bunga pada sore hari. Hari ini ia membacakan cerita sesudah merawat bunga.',
        'Permainan apa yang disukai nenek saat kecil?',
        'congklak',
        ['bermain congklak', 'dakon'],
        '🕰️',
        'Dulu dan sekarang',
        'Pisahkan kebiasaan masa kecil dari kegiatan nenek sekarang.'
      ],
      [
        'mendengar-5-10',
        'Di rak musik ada tamborin berlabel matahari, seruling berlabel bulan, dan drum berlabel awan. Pak guru mengambil alat berlabel bulan untuk pembuka lagu. Sesudah lagu selesai, alat itu disimpan di kotak panjang, bukan di rak semula.',
        'Alat musik apa yang akhirnya disimpan di kotak panjang?',
        'seruling',
        ['suling', 'seruling berlabel bulan'],
        '🎵',
        'Label sebuah alat',
        'Hubungkan label yang diambil dengan nama alat, bukan bentuk kotaknya.'
      ],
      [
        'mendengar-5-11',
        'Makanan [HewanPeliharaan] dipindah ke wadah baru berwarna biru. Wadah lama yang abu-abu dicuci oleh [NamaOrtu]. Sendok putih tetap di meja. Sesudah kering, wadah abu-abu disimpan di lemari, sedangkan wadah biru tetap dipakai.',
        'Apa warna wadah yang disimpan di lemari?',
        'abu-abu',
        ['abu abu', 'warna abu-abu', 'wadah lama yang abu-abu'],
        '🐾',
        'Wadah lama dan baru',
        'Ikuti wadah yang dicuci sampai tempat penyimpanan akhirnya.'
      ],
      [
        'mendengar-5-12',
        'Pengumuman awal menyebut kegiatan membaca di ruang melati dan kegiatan melukis di ruang anggrek. Kemudian guru menukar kedua ruang itu karena meja lukis membutuhkan tempat lebih luas. Waktu mulai kedua kegiatan tidak berubah.',
        'Di ruang mana kegiatan membaca berlangsung setelah pengumuman kedua?',
        'ruang anggrek',
        ['anggrek', 'di ruang anggrek'],
        '📢',
        'Pengumuman diperbarui',
        'Tukar tempat kedua kegiatan, tetapi jangan mengubah waktunya.'
      ],
      [
        'mendengar-5-13',
        'Tiga kartu cerita diurutkan: menanam biji, menyiram tunas, lalu memetik tomat. Guru menyisipkan kartu bunga muncul tepat sebelum kartu memetik tomat. Ia tidak memindahkan ketiga kartu lama.',
        'Kartu apa yang berada tepat sesudah menyiram tunas pada urutan baru?',
        'bunga muncul',
        ['kartu bunga muncul', 'muncul bunga'],
        '🌼',
        'Satu kartu tambahan',
        'Bayangkan letak kartu baru di sela-sela urutan lama.'
      ],
      [
        'mendengar-5-14',
        'Untuk kunjungan perpustakaan, Lusi ditugasi membawa daftar buku, Malik membawa kartu anggota, dan Tia membawa tas kain. Di pintu, Malik menitipkan kartu anggota kepada Lusi sebentar. Setelah masuk, kartu itu dikembalikan kepada Malik.',
        'Siapa yang memegang kartu anggota pada akhir cerita?',
        'Malik',
        ['Malik memegangnya', 'kartu dipegang Malik'],
        '🪪',
        'Titipan dikembalikan',
        'Ikuti perpindahan kartu sampai pengembalian terakhir.'
      ],
      [
        'mendengar-5-15',
        'Dalam rekaman alam, mula-mula terdengar hujan, lalu kicau burung, lalu gemerisik daun. Guru memutar ulang hanya dua bunyi terakhir dengan urutan yang sama. Bunyi hujan tidak diputar lagi.',
        'Bunyi apa yang terdengar pertama pada pemutaran ulang?',
        'kicau burung',
        ['burung berkicau', 'suara burung'],
        '🎧',
        'Potongan rekaman',
        'Hilangkan bunyi pertama dari urutan awal, lalu dengarkan sisanya.'
      ],
      [
        'mendengar-5-16',
        'Makan siang awalnya nasi, tahu, dan sup wortel. Karena tahu habis, koki menggantinya dengan tempe. Sup tetap sama, tetapi nasi disajikan di piring, bukan di mangkuk seperti rencana awal.',
        'Makanan apa yang menggantikan tahu?',
        'tempe',
        ['lauk tempe', 'tempe sebagai pengganti'],
        '🍚',
        'Dua jenis perubahan',
        'Bedakan perubahan lauk dari perubahan wadah nasi.'
      ],
      [
        'mendengar-5-17',
        '[NamaAnak] menggambar perahu kecil di bawah pelangi. [NamaTeman] menggambar layang-layang di atas bukit. [NamaOrtu] meminta gambar yang memiliki pelangi untuk dipasang di pintu, sedangkan gambar lainnya dipasang di dinding.',
        'Gambar milik siapa yang dipasang di pintu?',
        '[NamaAnak]',
        ['gambar [NamaAnak]', 'milik [NamaAnak]'],
        '🌈',
        'Ciri gambar dan pemilik',
        'Temukan gambar dengan ciri yang diminta, lalu ingat pembuatnya.'
      ],
      [
        'mendengar-5-18',
        'Untuk menghias kelas, ada enam bunga kertas merah dan empat bunga kertas putih. Bunga merah dipasang pada jendela. Bunga putih disimpan untuk papan nama. Guru sempat menyebut lima bunga putih, lalu segera membetulkan menjadi empat.',
        'Berapa bunga kertas putih menurut keterangan yang sudah dibetulkan?',
        'empat',
        ['4', 'empat bunga', '4 bunga putih'],
        '🌺',
        'Dengarkan pembetulan',
        'Pakai jumlah yang ditegaskan setelah guru membetulkan ucapannya.'
      ],
      [
        'mendengar-5-19',
        'Dalam cerita petualangan, panda membawa kompas dan koala membawa peta. Saat beristirahat, panda menitipkan kompasnya kepada koala, tetapi tetap membawa botol sendiri. Sebelum berjalan lagi, koala mengembalikan kompas dan tetap menyimpan peta.',
        'Benda penunjuk jalan apa yang tetap disimpan koala sepanjang cerita?',
        'peta',
        ['sebuah peta', 'peta milik koala'],
        '🐨',
        'Titipan dan milik sendiri',
        'Bedakan benda yang dipinjam sebentar dari benda bawaan awal koala.'
      ],
      [
        'mendengar-5-20',
        'Pada gladi pertunjukan, urutannya adalah tari pita, lagu hujan, lalu puisi kebun. Saat pentas sungguhan, lagu hujan menjadi pembuka. Tari pita tampil sesudah puisi kebun. Semua penampilan tetap ada, masing-masing satu kali.',
        'Penampilan apa yang menjadi penutup saat pentas sungguhan?',
        'tari pita',
        ['tarian pita', 'penampilan tari pita'],
        '🎬',
        'Gladi dan pentas',
        'Gunakan urutan pentas yang baru, bukan susunan saat latihan.'
      ]
    ]
  },
  {
    category: 'logika',
    level: 1,
    items: [
      [
        'logika-1-01',
        'Di meja ada pisang, mangga, dan sebuah sepatu. Dua benda adalah buah.',
        'Benda mana yang bukan buah?',
        'sepatu',
        ['sebuah sepatu', 'sepatu bukan buah'],
        '🍌',
        'Cari yang berbeda',
        'Pikirkan benda mana yang dipakai, bukan dimakan.'
      ],
      [
        'logika-1-02',
        '[NamaAnak] punya satu balok. [NamaOrtu] memberi satu balok lagi.',
        'Berapa balok [NamaAnak] sekarang?',
        'dua',
        ['2', 'dua balok', '2 balok'],
        '🧱',
        'Balok bertambah',
        'Gunakan satu jari untuk setiap balok yang datang.'
      ],
      [
        'logika-1-03',
        'Lampu mainan menyala bergantian: merah, biru, merah, biru, merah.',
        'Warna apa yang menyala berikutnya jika pola diteruskan?',
        'biru',
        ['warna biru', 'lampu biru'],
        '🚥',
        'Dua warna bergantian',
        'Lihat warna yang selalu muncul sesudah merah.'
      ],
      [
        'logika-1-04',
        'Ada gelas kosong dan kendi berisi air. [NamaOrtu] menuang air dari kendi ke gelas.',
        'Apakah gelas itu masih kosong atau sudah berisi?',
        'sudah berisi',
        ['berisi air', 'tidak kosong lagi', 'sudah terisi'],
        '🫗',
        'Isi gelas',
        'Bayangkan ke mana air berpindah saat dituang.'
      ],
      [
        'logika-1-05',
        'Sebuah batu besar dan batu kecil diletakkan berdampingan. Batu besar tidak muat di kotak, tetapi batu kecil muat.',
        'Batu mana yang bisa dimasukkan ke kotak itu?',
        'batu kecil',
        ['yang kecil', 'batu berukuran kecil'],
        '📦',
        'Pilih ukuran',
        'Gunakan keterangan tentang ukuran yang muat.'
      ],
      [
        'logika-1-06',
        'Roda mainan harus bisa menggelinding. Ada potongan berbentuk lingkaran dan potongan berbentuk persegi.',
        'Bentuk mana yang cocok menjadi roda?',
        'lingkaran',
        ['bentuk lingkaran', 'yang bulat'],
        '🛞',
        'Roda mainan',
        'Bayangkan bentuk yang tidak mempunyai sudut tajam untuk menghalangi putaran.'
      ],
      [
        'logika-1-07',
        '[NamaTeman] memegang payung tertutup saat gerimis. Ia ingin memakai payung untuk menaungi kepala.',
        'Payung itu perlu dibuka atau tetap ditutup?',
        'dibuka',
        ['buka payungnya', 'membuka payung'],
        '☔',
        'Siapkan payung',
        'Bayangkan bentuk payung yang bisa menjadi atap kecil.'
      ],
      [
        'logika-1-08',
        'Dua keping puzzle harus disatukan. Satu keping sudah terpasang dan satu keping masih di tangan.',
        'Berapa keping lagi yang perlu dipasang?',
        'satu',
        ['1', 'satu keping', '1 keping'],
        '🧩',
        'Puzzle belum selesai',
        'Hitung hanya keping yang belum berada di tempatnya.'
      ],
      [
        'logika-1-09',
        'Ada boneka di atas kursi dan bola di bawah kursi. [NamaAnak] diminta mengambil benda yang berada di bawah kursi.',
        'Benda apa yang harus diambil?',
        'bola',
        ['sebuah bola', 'bola di bawah kursi'],
        '🪑',
        'Atas dan bawah',
        'Cocokkan letak yang diminta dengan letak kedua benda.'
      ],
      [
        'logika-1-10',
        'Bima hendak menyisir rambut. Di depannya ada sisir dan sendok.',
        'Benda mana yang sesuai untuk merapikan rambut?',
        'sisir',
        ['sebuah sisir', 'memakai sisir'],
        '🪮',
        'Alat yang sesuai',
        'Pikirkan kegunaan masing-masing benda.'
      ],
      [
        'logika-1-11',
        'Di sebuah gambar ada ayam, bebek, dan bus. Ayam dan bebek adalah hewan.',
        'Gambar mana yang merupakan kendaraan?',
        'bus',
        ['gambar bus', 'kendaraan bus'],
        '🚌',
        'Hewan atau kendaraan',
        'Cari benda yang membawa penumpang.'
      ],
      [
        'logika-1-12',
        'Satu kaus kaki dipakai di satu kaki. Dua kaki [NamaAnak] belum memakai kaus kaki.',
        'Berapa kaus kaki yang diperlukan untuk kedua kaki?',
        'dua',
        ['2', 'dua kaus kaki', 'sepasang kaus kaki'],
        '🧦',
        'Satu untuk setiap kaki',
        'Pasangkan setiap kaki dengan satu kaus kaki.'
      ],
      [
        'logika-1-13',
        'Ada dua kelompok gambar: sisi dingin dan sisi hangat. Kartu baru bergambar semangkuk sup yang masih hangat.',
        'Sup hangat masuk sisi dingin atau sisi hangat?',
        'sisi hangat',
        ['hangat', 'di sisi hangat'],
        '🥣',
        'Kelompok suhu',
        'Cocokkan sifat benda dengan nama kelompoknya.'
      ],
      [
        'logika-1-14',
        'Kelinci mainan di depan kura-kura mainan dalam satu barisan. Hanya ada dua mainan itu.',
        'Mainan mana yang berada paling belakang?',
        'kura-kura',
        ['kura kura', 'kura-kura mainan'],
        '🐢',
        'Barisan pendek',
        'Bayangkan dua mainan menghadap arah yang sama.'
      ],
      [
        'logika-1-15',
        'Sebuah kertas basah diletakkan di tempat kering agar airnya menguap.',
        'Setelah airnya menguap semua, kertas menjadi basah atau kering?',
        'kering',
        ['menjadi kering', 'kertas kering'],
        '📄',
        'Perubahan pada kertas',
        'Pikirkan apa yang tersisa ketika air sudah tidak ada.'
      ],
      [
        'logika-1-16',
        '[NamaAnak] ingin menggambar garis biru. Tersedia krayon biru dan krayon cokelat.',
        'Krayon warna apa yang perlu dipilih?',
        'biru',
        ['krayon biru', 'warna biru'],
        '🖍️',
        'Cocokkan tujuan',
        'Samakan warna alat dengan warna garis yang diinginkan.'
      ],
      [
        'logika-1-17',
        'Ada satu biskuit di piring. Biskuit itu dipindahkan seluruhnya ke kotak.',
        'Ada berapa biskuit yang tersisa di piring?',
        'nol',
        ['0', 'tidak ada', 'kosong', 'habis'],
        '🍪',
        'Piring sesudah dipindah',
        'Ikuti satu-satunya biskuit sampai tempat barunya.'
      ],
      [
        'logika-1-18',
        'Potongan pita A lebih panjang daripada pita B. Kedua pita tidak dilipat.',
        'Pita mana yang lebih pendek?',
        'pita B',
        ['B', 'yang B'],
        '🎀',
        'Dua pita',
        'Jika satu lebih panjang, pikirkan sifat pita yang satunya.'
      ],
      [
        'logika-1-19',
        'Di kebun gambar, bunga disusun besar, kecil, besar, kecil.',
        'Ukuran bunga berikutnya apa jika susunan berulang?',
        'besar',
        ['bunga besar', 'ukuran besar'],
        '🌻',
        'Pola ukuran',
        'Ulangi pasangan dua ukuran dari awal.'
      ],
      [
        'logika-1-20',
        'Sebuah buku terbuka. [NamaOrtu] ingin menyimpannya dalam keadaan tertutup.',
        'Apa yang perlu dilakukan pada buku sebelum disimpan?',
        'menutup buku',
        ['ditutup', 'tutup bukunya', 'menutupnya'],
        '📕',
        'Siap disimpan',
        'Bandingkan keadaan buku sekarang dengan keadaan yang diinginkan.'
      ]
    ]
  },
  {
    category: 'logika',
    level: 2,
    items: [
      [
        'logika-2-01',
        'Ada tiga stroberi di mangkuk. Satu stroberi dipindah ke piring, tidak ada yang ditambahkan.',
        'Berapa stroberi yang tetap di mangkuk?',
        'dua',
        ['2', 'dua stroberi', '2 stroberi'],
        '🍓',
        'Satu berpindah',
        'Mulai dengan tiga, lalu sisihkan satu dari hitungan.'
      ],
      [
        'logika-2-02',
        'Kalung manik mengikuti pola bulat, bulat, bintang, bulat, bulat, bintang.',
        'Bentuk apa yang dipasang berikutnya?',
        'bulat',
        ['manik bulat', 'bentuk bulat', 'lingkaran'],
        '📿',
        'Pola tiga manik',
        'Cari kelompok tiga bentuk yang terus diulang.'
      ],
      [
        'logika-2-03',
        'Menara merah terdiri dari empat balok. Menara kuning terdiri dari dua balok. Semua balok sama tinggi.',
        'Menara mana yang lebih tinggi?',
        'menara merah',
        ['merah', 'yang merah'],
        '🏗️',
        'Bandingkan menara',
        'Dengan balok yang sama, bandingkan jumlah baloknya.'
      ],
      [
        'logika-2-04',
        'Hanya ada dua kotak, biru dan putih. Kartu bulan berada di salah satu kotak, dan kotak biru kosong.',
        'Di kotak warna apa kartu bulan berada?',
        'putih',
        ['kotak putih', 'di kotak putih'],
        '🌙',
        'Satu tempat tersisa',
        'Singkirkan kotak yang sudah diketahui kosong.'
      ],
      [
        'logika-2-05',
        '[NamaAnak] memiliki dua buku cerita. [NamaTeman] meminjamkan dua buku cerita lagi.',
        'Berapa buku cerita yang sekarang dipegang [NamaAnak]?',
        'empat',
        ['4', 'empat buku', '4 buku cerita'],
        '📚',
        'Buku bertambah',
        'Gabungkan dua kelompok buku, tanpa mengurangi apa pun.'
      ],
      [
        'logika-2-06',
        'Semua boneka untuk pementasan memakai topi. Boneka kelinci ikut dalam pementasan itu.',
        'Apakah boneka kelinci juga memakai topi?',
        'ya',
        ['iya', 'ya, memakai topi', 'boneka kelinci memakai topi'],
        '🎩',
        'Aturan semua boneka',
        'Gunakan aturan yang berlaku bagi setiap peserta pementasan.'
      ],
      [
        'logika-2-07',
        'Untuk membuat cap bintang harus memakai stempel berbentuk bintang. Ada stempel hati, bintang, dan daun.',
        'Stempel mana yang menghasilkan cap yang diminta?',
        'stempel bintang',
        ['bintang', 'yang berbentuk bintang'],
        '⭐',
        'Bentuk cap',
        'Hubungkan bentuk permukaan stempel dengan jejak yang dihasilkannya.'
      ],
      [
        'logika-2-08',
        'Urutan gerak berulang adalah lompat, tepuk, diam. Anak-anak sudah melakukan lompat, tepuk, diam, lompat, tepuk.',
        'Gerakan apa yang dilakukan berikutnya?',
        'diam',
        ['berdiam', 'berhenti diam'],
        '🕺',
        'Ulangi tiga gerak',
        'Temukan bagian yang belum lengkap pada kelompok gerak terakhir.'
      ],
      [
        'logika-2-09',
        'Nenek menyiapkan tiga cangkir untuk tiga orang, satu cangkir tiap orang. Satu orang lagi datang.',
        'Berapa cangkir tambahan yang diperlukan?',
        'satu',
        ['1', 'satu cangkir', '1 cangkir'],
        '☕',
        'Tamu tambahan',
        'Hitung tamu yang belum punya cangkir saja.'
      ],
      [
        'logika-2-10',
        'Jalan bergambar panah ke kiri menuju taman. Jalan bergambar panah ke kanan menuju kolam. Keluarga ingin ke kolam.',
        'Panah ke arah mana yang perlu mereka ikuti?',
        'kanan',
        ['ke kanan', 'panah kanan'],
        '➡️',
        'Pilih rute',
        'Cocokkan tujuan keluarga dengan keterangan kedua panah.'
      ],
      [
        'logika-2-11',
        'Kantong A berisi lima kancing. Kantong B berisi tiga kancing.',
        'Kantong mana yang berisi lebih sedikit kancing?',
        'kantong B',
        ['B', 'yang B'],
        '🔘',
        'Lebih sedikit',
        'Bandingkan jumlahnya, bukan nama kantongnya.'
      ],
      [
        'logika-2-12',
        'Bunga kertas hanya boleh dimasukkan ke vas mainan jika tangkainya terpasang. Bunga Rani belum memiliki tangkai.',
        'Apa yang perlu dipasang sebelum bunga Rani dimasukkan ke vas?',
        'tangkai',
        ['tangkai bunga', 'memasang tangkai'],
        '💐',
        'Syarat yang belum ada',
        'Cari bagian yang diperlukan oleh aturan, tetapi belum dimiliki bunga.'
      ],
      [
        'logika-2-13',
        'Di dalam kantong hanya ada kelereng merah dan hijau. Kelereng yang diambil bukan merah.',
        'Apa warna kelereng yang diambil?',
        'hijau',
        ['warna hijau', 'kelereng hijau'],
        '🟢',
        'Dua kemungkinan',
        'Hapus warna yang sudah dinyatakan bukan jawabannya.'
      ],
      [
        'logika-2-14',
        'Tiga anak duduk berurutan: Rani, Budi, Sela. Semua menghadap ke arah yang sama.',
        'Siapa yang duduk di tengah?',
        'Budi',
        ['Budi di tengah', 'anak bernama Budi'],
        '🪑',
        'Tempat di tengah',
        'Cari nama yang memiliki satu teman di setiap sisinya.'
      ],
      [
        'logika-2-15',
        'Balok busa mengapung dalam percobaan ini. Batu tenggelam. Guru memasukkan satu balok busa lagi ke air.',
        'Balok busa tambahan itu akan mengapung atau tenggelam menurut hasil percobaan?',
        'mengapung',
        ['akan mengapung', 'terapung'],
        '🛁',
        'Bahan yang sama',
        'Gunakan hasil percobaan benda dengan bahan yang sama.'
      ],
      [
        'logika-2-16',
        'Ada empat pot. Dua pot sudah disiram. Setiap pot hanya perlu disiram sekali.',
        'Berapa pot lagi yang perlu disiram?',
        'dua',
        ['2', 'dua pot', '2 pot'],
        '🚿',
        'Tugas yang belum selesai',
        'Hitung pot yang belum mendapat giliran saja.'
      ],
      [
        'logika-2-17',
        '[NamaAnak] menggambar [HewanPeliharaan] pada kertas persegi. Di sebelahnya ada bingkai berbentuk lingkaran. [NamaAnak] mencari benda yang memiliki empat sisi lurus.',
        'Benda mana yang cocok dengan ciri itu?',
        'kertas',
        ['kertas gambar', 'kertas persegi', 'kertas bergambar [HewanPeliharaan]'],
        '🔷',
        'Perhatikan sisi',
        'Bandingkan tepi dua bentuk yang disebut.'
      ],
      [
        'logika-2-18',
        'Dalam permainan siang dan malam, kartu matahari berarti berdiri dan kartu bulan berarti duduk. Guru mengangkat kartu bulan.',
        'Apa yang harus dilakukan para pemain?',
        'duduk',
        ['duduk sesuai aturan', 'para pemain duduk'],
        '🌜',
        'Aturan kartu',
        'Cocokkan gambar yang diangkat dengan gerak dalam aturan.'
      ],
      [
        'logika-2-19',
        'Dua tali disambung ujung ke ujung tanpa dipotong. Setiap tali panjangnya sama.',
        'Hasil sambungan lebih panjang, sama panjang, atau lebih pendek daripada satu tali semula?',
        'lebih panjang',
        ['menjadi lebih panjang', 'panjangnya bertambah'],
        '🪢',
        'Menyambung tali',
        'Bayangkan dua tali berjajar memanjang, bukan ditumpuk.'
      ],
      [
        'logika-2-20',
        'Pada kartu angka tertulis satu, dua, tiga, empat secara berurutan.',
        'Angka berapa yang menyusul jika setiap langkah bertambah satu?',
        'lima',
        ['5', 'angka lima'],
        '🔢',
        'Langkah angka',
        'Lanjutkan hitungan dengan satu langkah yang sama.'
      ]
    ]
  },
  {
    category: 'logika',
    level: 3,
    items: [
      [
        'logika-3-01',
        '[NamaAnak] menyiapkan empat jeruk. Dua diberikan kepada [NamaTeman], lalu [NamaOrtu] menambahkan satu jeruk ke piring [NamaAnak].',
        'Berapa jeruk di piring [NamaAnak] pada akhir cerita?',
        'tiga',
        ['3', 'tiga jeruk', '3 jeruk'],
        '🍊',
        'Berkurang lalu bertambah',
        'Kerjakan perpindahan jeruk satu per satu sesuai urutan.'
      ],
      [
        'logika-3-02',
        'Menara A lebih tinggi daripada menara B. Menara B lebih tinggi daripada menara C.',
        'Menara mana yang paling pendek?',
        'menara C',
        ['C', 'yang C'],
        '🏙️',
        'Urutkan tiga tinggi',
        'Susun ketiga menara dari yang tinggi ke yang rendah.'
      ],
      [
        'logika-3-03',
        'Tiga kotak berwarna merah, biru, dan hijau. Satu kotak menyimpan pita. Kotak merah kosong dan kotak hijau berisi kertas saja.',
        'Kotak warna apa yang menyimpan pita?',
        'biru',
        ['kotak biru', 'di kotak biru'],
        '🎁',
        'Singkirkan dua kotak',
        'Periksa tempat yang tidak mungkin berisi pita satu per satu.'
      ],
      [
        'logika-3-04',
        'Satu anak mendapat dua stiker. Ada tiga anak yang masing-masing mendapat jumlah yang sama.',
        'Berapa stiker yang diperlukan untuk ketiga anak?',
        'enam',
        ['6', 'enam stiker', '6 stiker'],
        '🏷️',
        'Kelompok sama banyak',
        'Buat tiga kelompok kecil dengan dua stiker di setiap kelompok.'
      ],
      [
        'logika-3-05',
        'Pola bunyi berulang adalah tepuk, tepuk, hentak. Sekarang sudah terdengar tepuk, tepuk, hentak, tepuk.',
        'Dua bunyi apa yang menyusul, secara berurutan?',
        'tepuk lalu hentak',
        ['tepuk, hentak', 'tepuk dan kemudian hentak'],
        '👣',
        'Lengkapi satu kelompok',
        'Cari posisi bunyi terakhir dalam kelompok yang terdiri dari tiga bunyi.'
      ],
      [
        'logika-3-06',
        'Setiap buku bergambar hewan diberi titik hijau. Semua buku bertitik hijau disimpan di rak bawah. Buku baru bergambar jerapah.',
        'Di rak mana buku jerapah harus disimpan?',
        'rak bawah',
        ['di rak bawah', 'rak bagian bawah'],
        '🦒',
        'Dua aturan berantai',
        'Tentukan tanda buku lebih dulu, lalu gunakan aturan tempat untuk tanda itu.'
      ],
      [
        'logika-3-07',
        'Tiga anak berbaris menghadap depan. Tia berada di depan Udin. Udin berada di depan Vina. Tidak ada anak lain dalam barisan.',
        'Siapa yang berdiri paling depan?',
        'Tia',
        ['Tia paling depan', 'anak bernama Tia'],
        '🚶',
        'Sambungkan urutan',
        'Gabungkan dua petunjuk posisi menjadi satu barisan.'
      ],
      [
        'logika-3-08',
        'Ada lima pot bunga. Tiga pot sudah dipasangi label. [NamaAnak] memasang label pada satu pot lagi yang belum berlabel.',
        'Berapa pot yang masih belum berlabel?',
        'satu',
        ['1', 'satu pot', '1 pot'],
        '🪴',
        'Label yang kurang',
        'Hitung label yang sudah terpasang sekarang, lalu bandingkan dengan seluruh pot.'
      ],
      [
        'logika-3-09',
        'Kartu yang dicari berwarna kuning dan berbentuk segitiga. Kartu A kuning berbentuk lingkaran, kartu B kuning berbentuk segitiga, kartu C biru berbentuk segitiga.',
        'Kartu mana yang memenuhi kedua ciri?',
        'kartu B',
        ['B', 'yang B'],
        '🟨',
        'Dua ciri sekaligus',
        'Jangan memilih kartu yang hanya cocok warna atau hanya cocok bentuknya.'
      ],
      [
        'logika-3-10',
        'Sebuah kue dipotong menjadi empat bagian sama besar. Dua bagian disimpan. Bagian yang lain dibagikan kepada tamu, satu bagian untuk setiap tamu.',
        'Berapa orang yang mendapat bagian kue?',
        'dua',
        ['2', 'dua orang', '2 orang'],
        '🥮',
        'Simpan sebagian dahulu',
        'Pisahkan bagian yang disimpan sebelum memasangkan sisa potongan dengan tamu.'
      ],
      [
        'logika-3-11',
        'Dari rumah ke taman perlu melewati jembatan. Dari taman ke perpustakaan perlu melewati kebun. Keluarga berjalan dari rumah ke perpustakaan melalui taman.',
        'Apa yang dilewati lebih dulu, jembatan atau kebun?',
        'jembatan',
        ['melewati jembatan', 'jembatan lebih dulu'],
        '🌉',
        'Sambungkan rute',
        'Mulailah perjalanan dari rumah, lalu susun dua bagian jalannya.'
      ],
      [
        'logika-3-12',
        'Ada tiga pilihan camilan: roti isi keju, roti isi selai, dan pisang. Miko memilih roti, tetapi tidak memilih isian keju.',
        'Isi roti apa yang dipilih Miko?',
        'selai',
        ['roti isi selai', 'isian selai'],
        '🥪',
        'Dua petunjuk camilan',
        'Gunakan jenis makanan dan isian yang tidak dipilih untuk mempersempit pilihan.'
      ],
      [
        'logika-3-13',
        'Sebuah boneka dimasukkan ke dalam tas. Tas itu kemudian dimasukkan ke lemari tanpa mengeluarkan isinya.',
        'Apakah boneka sekarang juga berada di dalam lemari?',
        'ya',
        ['iya', 'ya, di dalam lemari', 'boneka berada dalam lemari'],
        '🧸',
        'Benda di dalam benda',
        'Ikuti tas bersama isi yang tetap berada di dalamnya.'
      ],
      [
        'logika-3-14',
        'Ada tiga mangkuk di meja, lalu dua mangkuk lagi ditambahkan. Setiap mangkuk perlu satu sendok. Di meja baru ada tiga sendok.',
        'Berapa sendok tambahan yang dibutuhkan?',
        'dua',
        ['2', 'dua sendok', '2 sendok'],
        '🥄',
        'Pasangan yang belum lengkap',
        'Hitung semua mangkuk setelah tambahan datang, lalu pasangkan dengan sendok yang ada.'
      ],
      [
        'logika-3-15',
        'Di kelas, berkebun selalu sesudah membaca. Bernyanyi selalu sebelum membaca. Hari ini ketiganya dilakukan satu kali.',
        'Kegiatan apa yang berada di tengah urutan?',
        'membaca',
        ['kegiatan membaca', 'membaca buku'],
        '🎵',
        'Sebelum dan sesudah',
        'Satukan kedua aturan menjadi urutan tiga kegiatan.'
      ],
      [
        'logika-3-16',
        'Lima balok sama besar dibagi ke dua menara. Menara pertama memakai dua balok, dan semua balok sisanya masuk menara kedua.',
        'Berapa balok pada menara kedua?',
        'tiga',
        ['3', 'tiga balok', '3 balok'],
        '🧱',
        'Bagian dari keseluruhan',
        'Pisahkan balok menara pertama dari jumlah semua balok.'
      ],
      [
        'logika-3-17',
        'Dalam permainan, jika bel berbunyi pemain berhenti. Jika drum berbunyi pemain berjalan. Sekarang drum berhenti dan bel mulai berbunyi.',
        'Apa yang harus dilakukan pemain sekarang?',
        'berhenti',
        ['berhenti berjalan', 'diam di tempat'],
        '🔔',
        'Aturan yang sedang berlaku',
        'Gunakan bunyi saat ini, bukan bunyi yang sudah berhenti.'
      ],
      [
        'logika-3-18',
        'Kartu angka membentuk urutan dua, empat, enam. Setiap angka bertambah dua dari angka sebelumnya.',
        'Angka berapa yang datang sesudah enam?',
        'delapan',
        ['8', 'angka delapan'],
        '🔢',
        'Melangkah dua',
        'Tambahkan langkah yang sama pada angka terakhir.'
      ],
      [
        'logika-3-19',
        'Pita A lebih pendek dari pita B. Pita C sama panjang dengan pita B.',
        'Apakah pita C lebih panjang atau lebih pendek daripada pita A?',
        'lebih panjang',
        ['pita C lebih panjang', 'C lebih panjang dari A'],
        '🎗️',
        'Panjang yang setara',
        'Bayangkan pita B dan C sejajar ujungnya, lalu bandingkan dengan A.'
      ],
      [
        'logika-3-20',
        '[NamaAnak] membuat aturan bahwa benda dari kain masuk keranjang dan benda dari kayu masuk kotak. Ada saputangan kain dan balok kayu yang belum dirapikan.',
        'Ke mana saputangan harus dimasukkan?',
        'keranjang',
        ['ke keranjang', 'di dalam keranjang'],
        '🧺',
        'Kelompok berdasarkan bahan',
        'Tentukan bahan saputangan, lalu cocokkan dengan aturan wadahnya.'
      ]
    ]
  },
  {
    category: 'logika',
    level: 4,
    items: [
      [
        'logika-4-01',
        'Enam kancing dibagi sama banyak ke tiga kantong. Tidak ada kancing yang tersisa di luar kantong.',
        'Berapa kancing di setiap kantong?',
        'dua',
        ['2', 'dua kancing', '2 kancing'],
        '👝',
        'Bagikan dengan adil',
        'Bagikan satu kancing ke setiap kantong berulang kali sampai habis.'
      ],
      [
        'logika-4-02',
        'Ayu, Beni, dan Cici masing-masing membawa satu benda berbeda: bola, buku, atau boneka. Ayu membawa buku. Beni tidak membawa bola.',
        'Benda apa yang dibawa Cici?',
        'bola',
        ['sebuah bola', 'Cici membawa bola'],
        '🎒',
        'Cocokkan tiga bawaan',
        'Coret benda Ayu, lalu tentukan pilihan Beni sebelum mencari milik Cici.'
      ],
      [
        'logika-4-03',
        '[NamaAnak] punya beberapa stiker. Sesudah mendapat dua stiker dari [NamaOrtu], jumlahnya menjadi tujuh.',
        'Berapa stiker yang dimiliki [NamaAnak] sebelum mendapat tambahan?',
        'lima',
        ['5', 'lima stiker', '5 stiker'],
        '🏷️',
        'Mencari jumlah awal',
        'Dari jumlah akhir, pisahkan stiker yang baru datang.'
      ],
      [
        'logika-4-04',
        'Empat kartu disusun dari kiri ke kanan. Matahari harus paling kiri, bulan paling kanan. Bintang harus di sebelah kiri awan.',
        'Gambar apa yang berada pada kartu kedua dari kiri?',
        'bintang',
        ['gambar bintang', 'kartu bintang'],
        '🌠',
        'Isi dua tempat tengah',
        'Isi kedua ujung lebih dulu, lalu gunakan aturan untuk dua kartu sisanya.'
      ],
      [
        'logika-4-05',
        'Suara alat mainan berulang dalam kelompok: bel, drum, drum, tepuk. Satu kelompok lengkap sudah berbunyi, lalu bel dan drum berbunyi lagi.',
        'Bunyi apa yang terdengar berikutnya?',
        'drum',
        ['bunyi drum', 'suara drum'],
        '🥁',
        'Pola empat bunyi',
        'Hitung posisi bunyi yang sudah terdengar dalam kelompok kedua.'
      ],
      [
        'logika-4-06',
        'Kartu lolos permainan jika bergambar hewan dan memiliki bingkai hijau. Kartu A bergambar ikan dengan bingkai merah. Kartu B bergambar daun dengan bingkai hijau. Kartu C bergambar kucing dengan bingkai hijau.',
        'Kartu mana yang lolos permainan?',
        'kartu C',
        ['C', 'yang C'],
        '🃏',
        'Dua syarat harus cocok',
        'Periksa gambar dan bingkai setiap kartu secara bersamaan.'
      ],
      [
        'logika-4-07',
        'Ada delapan kursi untuk delapan orang. Tiga orang sudah duduk dan dua orang lagi baru saja duduk. Tidak ada orang yang berdiri kembali.',
        'Berapa kursi yang masih kosong?',
        'tiga',
        ['3', 'tiga kursi', '3 kursi'],
        '🪑',
        'Dua rombongan duduk',
        'Gabungkan semua yang sudah duduk, lalu bandingkan dengan jumlah kursi.'
      ],
      [
        'logika-4-08',
        'Buku diletakkan di atas kotak. Bola ada di dalam kotak. Kotak dipindah dari meja ke lantai sambil tetap membawa buku dan bola pada posisi yang sama.',
        'Apakah bola ada di dalam kotak atau di atas kotak setelah dipindah?',
        'di dalam kotak',
        ['dalam kotak', 'tetap di dalam kotak'],
        '📦',
        'Tempat berubah, hubungan tetap',
        'Bedakan letak kotak di ruangan dari letak bola terhadap kotak.'
      ],
      [
        'logika-4-09',
        'Pada jadwal berulang, hari pertama membaca, hari kedua melukis, hari ketiga berkebun, lalu kembali membaca. Hari ini adalah hari ketiga.',
        'Kegiatan apa yang dijadwalkan besok?',
        'membaca',
        ['membaca buku', 'kegiatan membaca'],
        '🗓️',
        'Kembali ke awal',
        'Sesudah bagian terakhir dari siklus, mulai lagi dari bagian pertama.'
      ],
      [
        'logika-4-10',
        'Dua kotak berisi jumlah balok yang sama. [NamaAnak] memindahkan satu balok dari kotak A ke kotak B tanpa mengubah balok lain.',
        'Kotak mana yang sekarang memiliki lebih banyak balok?',
        'kotak B',
        ['B', 'yang B'],
        '⚖️',
        'Dari sama menjadi berbeda',
        'Satu kotak kehilangan balok ketika kotak lainnya menerima balok itu.'
      ],
      [
        'logika-4-11',
        'Tiga pita diurutkan dari paling pendek ke paling panjang: kuning, merah, biru. Pita hijau lebih panjang dari merah tetapi lebih pendek dari biru.',
        'Pita warna apa yang paling panjang setelah pita hijau ditambahkan?',
        'biru',
        ['pita biru', 'warna biru'],
        '🎀',
        'Sisipkan satu pita',
        'Tempatkan pita baru di antara dua pita yang disebut, tanpa mengubah urutan lama.'
      ],
      [
        'logika-4-12',
        'Untuk satu perahu kertas diperlukan satu lembar kertas. [NamaTeman] ingin membuat lima perahu. Ia memiliki tiga lembar dan menerima satu lembar tambahan.',
        'Berapa lembar kertas lagi yang masih diperlukan?',
        'satu',
        ['1', 'satu lembar', '1 lembar kertas'],
        '⛵',
        'Cukupkah bahannya',
        'Jumlahkan kertas yang sudah dimiliki, lalu bandingkan dengan target perahu.'
      ],
      [
        'logika-4-13',
        'Setiap kotak berlabel daun berisi biji. Semua kotak berisi biji harus disimpan di rak atas. Kotak P berlabel daun. Kotak Q berlabel bunga dan isinya belum diketahui.',
        'Kotak mana yang pasti harus disimpan di rak atas berdasarkan petunjuk itu?',
        'kotak P',
        ['P', 'yang P'],
        '🌿',
        'Pasti atau belum tahu',
        'Hubungkan label dengan isi dan tempat simpan; jangan menebak isi kotak yang belum diketahui.'
      ],
      [
        'logika-4-14',
        'Dalam barisan tiga mainan, bus bukan yang pertama atau terakhir. Kereta berada di depan bus. Pesawat adalah mainan yang tersisa.',
        'Mainan apa yang berada paling belakang?',
        'pesawat',
        ['pesawat mainan', 'mainan pesawat'],
        '✈️',
        'Letak dari dua petunjuk',
        'Tentukan tempat bus, lalu tempat kereta, sebelum mengisi tempat kosong.'
      ],
      [
        'logika-4-15',
        'Guru memiliki sembilan pensil. Ia menyimpan tiga untuk kelas besok. Pensil yang lain dibagikan satu per anak kepada enam anak.',
        'Apakah pensil untuk enam anak itu cukup tepat atau masih kurang?',
        'cukup tepat',
        ['pas', 'cukup tanpa sisa', 'cukup, tidak kurang'],
        '✏️',
        'Sisihkan dahulu',
        'Pisahkan simpanan besok, lalu hitung pensil yang boleh dibagikan hari ini.'
      ],
      [
        'logika-4-16',
        'Aturan permainan adalah: bila kartu matahari muncul, semua berdiri; bila kartu hujan muncul, semua duduk; bila kartu angin muncul, posisi tidak berubah. Pemain sedang duduk, lalu muncul matahari dan setelah itu angin.',
        'Apakah pemain berdiri atau duduk pada akhir urutan?',
        'berdiri',
        ['tetap berdiri', 'pemain berdiri'],
        '🌬️',
        'Aturan mempertahankan posisi',
        'Ikuti perubahan pertama, lalu periksa apakah kartu kedua mengubah posisi itu.'
      ],
      [
        'logika-4-17',
        'Pot A disiram setiap hari. Pot B disiram hanya pada hari Senin dan Kamis. Hari ini hari Kamis, dan keduanya belum disiram.',
        'Pot mana saja yang perlu disiram hari ini?',
        'pot A dan pot B',
        ['keduanya', 'A dan B', 'kedua pot'],
        '💦',
        'Dua jadwal bertemu',
        'Periksa apakah hari ini cocok dengan jadwal masing-masing pot.'
      ],
      [
        'logika-4-18',
        'Kelereng disimpan dalam cangkir. Cangkir ada di dalam keranjang. Keranjang dipindah ke teras tanpa mengeluarkan apa pun.',
        'Apakah kelereng ikut berada di teras?',
        'ya',
        ['iya', 'ya, kelereng ikut ke teras', 'kelereng ada di teras'],
        '🧺',
        'Tiga lapis tempat',
        'Ikuti wadah paling luar bersama semua benda yang ada di dalamnya.'
      ],
      [
        'logika-4-19',
        'Ada delapan bunga kertas: lima merah dan sisanya putih. Satu bunga putih disimpan. Semua bunga putih yang lain dipajang.',
        'Berapa bunga putih yang dipajang?',
        'dua',
        ['2', 'dua bunga', '2 bunga putih'],
        '🌺',
        'Dua kali menyisihkan',
        'Cari jumlah bunga putih dahulu, lalu pisahkan bunga yang disimpan.'
      ],
      [
        'logika-4-20',
        'Untuk bermain papan, pion harus dipilih dan dadu harus tersedia. Pion [NamaAnak] sudah dipilih. Dadu ada di lemari terkunci, dan kunci lemari dipegang [NamaOrtu]. Mereka akan mengambil dadu bersama.',
        'Benda apa yang perlu dibawa [NamaOrtu] agar lemari dadu bisa dibuka?',
        'kunci lemari',
        ['kunci', 'kunci untuk lemari'],
        '🎲',
        'Langkah sebelum mengambil',
        'Telusuri apa yang menghalangi mereka mengambil perlengkapan yang belum tersedia.'
      ]
    ]
  },
  {
    category: 'logika',
    level: 5,
    items: [
      [
        'logika-5-01',
        'Lina, Made, dan Sari masing-masing membuat satu karya berbeda: topeng, perahu, atau bunga. Lina tidak membuat perahu atau bunga. Made tidak membuat bunga.',
        'Karya apa yang dibuat Sari?',
        'bunga',
        ['bunga kertas', 'Sari membuat bunga'],
        '🎨',
        'Tentukan satu demi satu',
        'Cari karya Lina lebih dulu, kemudian gunakan benda yang masih tersisa untuk Made.'
      ],
      [
        'logika-5-02',
        '[NamaAnak] memiliki beberapa balok. Ia meminjamkan dua balok kepada [NamaTeman], lalu menerima tiga balok baru dari [NamaOrtu]. Sekarang ia memegang tujuh balok.',
        'Berapa balok yang dipegang [NamaAnak] sebelum semua perubahan itu?',
        'enam',
        ['6', 'enam balok', '6 balok'],
        '🧱',
        'Berjalan mundur',
        'Dari jumlah akhir, batalkan tambahan terakhir, lalu batalkan peminjaman awal.'
      ],
      [
        'logika-5-03',
        'Empat gambar harus diurutkan. Biji berada sebelum tunas. Bunga berada sesudah tunas tetapi sebelum buah. Setiap gambar dipakai tepat satu kali.',
        'Gambar apa yang berada di urutan ketiga?',
        'bunga',
        ['gambar bunga', 'kartu bunga'],
        '🌱',
        'Gabungkan semua urutan',
        'Tempatkan keempat tahap sesuai seluruh petunjuk, bukan satu petunjuk saja.'
      ],
      [
        'logika-5-04',
        'Ada sembilan manik. Tiga manik dipakai untuk gelang pertama. Sisanya dibagi sama banyak untuk gelang kedua dan ketiga, tanpa ada manik tersisa.',
        'Berapa manik untuk gelang ketiga?',
        'tiga',
        ['3', 'tiga manik', '3 manik'],
        '📿',
        'Sisakan lalu bagi',
        'Pisahkan manik gelang pertama sebelum membagi dua kelompok yang sama.'
      ],
      [
        'logika-5-05',
        'Di peta permainan, semua jalan bertanda daun menuju kolam. Semua jalan yang menuju kolam melewati jembatan. Jalan yang dipilih [NamaTeman] bertanda daun.',
        'Apakah [NamaTeman] pasti melewati jembatan jika mengikuti jalan itu sampai tujuan?',
        'ya',
        ['iya', 'ya, pasti melewati jembatan', 'pasti lewat jembatan'],
        '🗺️',
        'Ikuti rantai petunjuk',
        'Tentukan tujuan jalan bertanda daun, lalu apa yang dilewati menuju tujuan itu.'
      ],
      [
        'logika-5-06',
        'Rak mempunyai empat tempat berurutan dari kiri ke kanan. Buku merah paling kiri. Buku hijau tepat di kanan buku merah. Buku kuning tepat di kiri buku biru. Semua tempat terisi satu buku.',
        'Buku warna apa yang menempati tempat ketiga dari kiri?',
        'kuning',
        ['buku kuning', 'warna kuning'],
        '📚',
        'Pasangan yang berdampingan',
        'Isi pasangan pertama, lalu letakkan pasangan kedua pada dua tempat kosong.'
      ],
      [
        'logika-5-07',
        'Kalung berpola satu manik merah, satu manik biru, dua manik kuning, lalu pola itu diulang. Enam manik pertama sudah dipasang sesuai pola.',
        'Apa warna manik ketujuh?',
        'kuning',
        ['manik kuning', 'warna kuning'],
        '🟡',
        'Hitung posisi pola',
        'Satu kelompok berisi empat manik. Lanjutkan hitungan ke kelompok kedua.'
      ],
      [
        'logika-5-08',
        'Tiga kotak A, B, dan C masing-masing berisi satu benda berbeda: kerang, batu, atau daun. Batu ada di B. Daun tidak ada di A.',
        'Kotak mana yang berisi kerang?',
        'kotak A',
        ['A', 'yang A'],
        '🐚',
        'Isi semua kotak',
        'Tentukan tempat daun setelah memakai informasi tentang batu, lalu lihat tempat yang tersisa.'
      ],
      [
        'logika-5-09',
        'Dua piring masing-masing berisi empat potong melon. Satu potong dipindahkan dari piring kiri ke piring kanan. Tidak ada melon yang dimakan.',
        'Berapa jumlah potongan melon pada kedua piring jika digabung?',
        'delapan',
        ['8', 'delapan potong', '8 potong melon'],
        '🍈',
        'Pindah bukan bertambah',
        'Perhatikan apakah ada potongan yang masuk dari luar atau keluar dari dua piring.'
      ],
      [
        'logika-5-10',
        'Urutan hari pada jadwal adalah Selasa, Rabu, Kamis, Jumat. Musik hanya bisa dijadwalkan Selasa atau Kamis. Musik harus berlangsung sesudah melukis pada Rabu dan sebelum berkebun pada Jumat.',
        'Pada hari apa musik harus dijadwalkan?',
        'Kamis',
        ['hari Kamis', 'pada Kamis'],
        '📆',
        'Pilih hari yang memenuhi aturan',
        'Uji kedua pilihan hari dengan syarat sebelum dan sesudah kegiatan lain.'
      ],
      [
        'logika-5-11',
        'Kartu untuk kotak khusus harus berbentuk lingkaran, berwarna biru, dan tidak bergaris. Kartu A lingkaran biru bergaris. Kartu B lingkaran merah polos. Kartu C lingkaran biru polos.',
        'Kartu mana yang boleh masuk kotak khusus?',
        'kartu C',
        ['C', 'yang C'],
        '🔵',
        'Periksa tiga syarat',
        'Sebuah kartu harus memenuhi semuanya; cocok dua syarat saja belum cukup.'
      ],
      [
        'logika-5-12',
        'Tomi lebih cepat menyelesaikan puzzle daripada Uli. Wati lebih cepat daripada Tomi. Vino selesai setelah Uli. Tidak ada yang selesai bersamaan.',
        'Siapa yang menyelesaikan puzzle paling akhir?',
        'Vino',
        ['Vino paling akhir', 'anak bernama Vino'],
        '🧩',
        'Empat waktu selesai',
        'Susun nama dari yang selesai lebih cepat sampai yang selesai lebih lambat.'
      ],
      [
        'logika-5-13',
        '[NamaAnak] ingin membuat dua menara yang masing-masing terdiri dari empat balok. Ia mempunyai lima balok dan mendapat dua balok tambahan.',
        'Berapa balok lagi yang diperlukan untuk menyelesaikan kedua menara?',
        'satu',
        ['1', 'satu balok', '1 balok'],
        '🏗️',
        'Target dan persediaan',
        'Hitung kebutuhan dua menara, lalu bandingkan dengan semua balok yang sudah ada.'
      ],
      [
        'logika-5-14',
        'Dalam permainan robot, kartu panah membuat robot maju satu petak. Kartu bintang membuat robot diam. Robot mulai di petak satu, lalu mendapat panah, bintang, panah, panah.',
        'Robot berhenti di petak nomor berapa?',
        'empat',
        ['4', 'petak empat', 'petak 4'],
        '🤖',
        'Hanya sebagian kartu bergerak',
        'Mulai dari petak awal dan geser hanya ketika kartu menyuruh maju.'
      ],
      [
        'logika-5-15',
        'Setiap peserta kebun perlu satu pot dan dua label: label nama anak serta label nama tanaman. Ada empat peserta. Guru sudah menyiapkan empat pot dan enam label.',
        'Berapa label tambahan yang perlu dibuat agar semua peserta mendapat dua label?',
        'dua',
        ['2', 'dua label', '2 label'],
        '🏷️',
        'Dua label setiap peserta',
        'Hitung seluruh kebutuhan label, bukan jumlah pot, lalu bandingkan dengan label yang sudah siap.'
      ],
      [
        'logika-5-16',
        'Pada neraca mainan yang seimbang, satu balok besar sama berat dengan dua balok kecil. Sisi kiri sekarang berisi satu balok besar dan satu balok kecil. Sisi kanan hanya boleh diisi balok kecil yang sama jenisnya.',
        'Berapa balok kecil diperlukan di kanan agar seimbang?',
        'tiga',
        ['3', 'tiga balok kecil', '3 balok kecil'],
        '⚖️',
        'Ganti dengan yang setara',
        'Bayangkan balok besar diganti sejumlah balok kecil sesuai petunjuk, lalu hitung semuanya.'
      ],
      [
        'logika-5-17',
        'Untuk masuk kelompok bunga, kartu harus bergambar tanaman. Untuk mendapat pita, kartu juga harus memiliki bingkai merah. Kartu mawar memiliki bingkai hijau.',
        'Apakah kartu mawar mendapat pita menurut aturan itu?',
        'tidak',
        ['tidak mendapat pita', 'belum memenuhi syarat pita'],
        '🌹',
        'Anggota belum tentu berpita',
        'Pisahkan syarat masuk kelompok dari syarat tambahan untuk menerima pita.'
      ],
      [
        'logika-5-18',
        'Tiga anak duduk di tiga kursi berurutan dari kiri ke kanan: Deni, Evi, Fira. Deni bertukar tempat dengan Fira. Kemudian anak yang sekarang di kursi kiri bertukar dengan Evi.',
        'Siapa yang berada di kursi tengah pada akhir pertukaran?',
        'Fira',
        ['Fira di tengah', 'anak bernama Fira'],
        '🪑',
        'Dua kali bertukar',
        'Perbarui posisi setelah pertukaran pertama sebelum melakukan pertukaran kedua.'
      ],
      [
        'logika-5-19',
        'Guru ingin tahu pengaruh angin terhadap pengeringan kain. Semua kain sejenis dan sama besar. Rencana A memakai satu kain basah dan satu kain kering. Rencana B memakai dua kain yang sama basah. Pada kedua rencana, hanya satu kain dikipas dan tempatnya sama hangat.',
        'Rencana mana yang membandingkan pengaruh angin saja dengan lebih adil?',
        'rencana B',
        ['B', 'yang B', 'rencana kedua'],
        '🌬️',
        'Percobaan yang adil',
        'Selain kipas, keadaan awal kain perlu sebanding supaya hasilnya bisa dibandingkan.'
      ],
      [
        'logika-5-20',
        'Keranjang A berisi dua bola merah dan satu bola biru. Keranjang B berisi satu bola merah dan dua bola biru. Satu bola biru dipindah dari B ke A.',
        'Setelah dipindah, apakah jumlah bola merah dan biru di keranjang A sama atau berbeda?',
        'sama',
        ['sama banyak', 'jumlahnya sama', 'masing-masing dua'],
        '🔴',
        'Bandingkan setelah perpindahan',
        'Perbarui jumlah warna yang berpindah di A, lalu bandingkan dengan warna yang tetap.'
      ]
    ]
  }
];

export const questions: Question[] = groups.flatMap(({ category, level, items }) =>
  items.map(([id, story, prompt, expectedAnswer, alternatives, emoji, title, description]) => ({
    id,
    category,
    level,
    story,
    prompt,
    expectedAnswer,
    alternatives,
    hint: { emoji, title, description }
  }))
);
