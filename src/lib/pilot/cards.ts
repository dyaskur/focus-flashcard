import type { CardQuestion, PilotCard, Skill } from './types';

type Pair = [string, string];
type BilingualQuestion = [CardQuestion, CardQuestion];

// Author each question together so its identity and accepted meaning stay aligned.
function q(
  id: string,
  skill: Skill,
  prompt: Pair,
  answer: Pair,
  emoji: string,
  hint: Pair,
  secondHint: Pair,
  explanation: Pair,
  alternatives: Pair[] = []
): BilingualQuestion {
  const version = (language: 0 | 1): CardQuestion => ({
    id,
    skill,
    prompt: prompt[language],
    expectedAnswer: answer[language],
    alternatives: [...new Set([answer[1 - language], ...alternatives.flat()])],
    hint: {
      emoji,
      title: language === 0 ? 'Petunjuk' : 'Clue',
      description: hint[language]
    },
    secondHint: secondHint[language],
    explanation: explanation[language]
  });
  return [version(0), version(1)];
}

function card(
  id: string,
  category: PilotCard['category'],
  level: PilotCard['level'],
  title: Pair,
  story: Pair,
  questions: BilingualQuestion[]
): PilotCard {
  return {
    id,
    category,
    level,
    versions: {
      id: { title: title[0], story: story[0], questions: questions.map((question) => question[0]) },
      en: { title: title[1], story: story[1], questions: questions.map((question) => question[1]) }
    }
  };
}

// Caregiver reads the story once, then asks questions in order. These are authored
// practice materials, not clinically calibrated measures of ability.
export const pilotCards: PilotCard[] = [
  card(
    'listen-1-bag',
    'mendengar',
    1,
    ['Tas untuk taman', 'A bag for the park'],
    [
      '[NamaAnak] menaruh botol minum di dalam tas. [NamaOrtu] membawa topi. Mereka akan pergi ke taman.',
      '[NamaAnak] puts a water bottle inside the bag. [NamaOrtu] carries a hat. They are going to the park.'
    ],
    [
      q(
        'packed-object',
        'what',
        ['Apa yang dimasukkan ke dalam tas?', 'What goes inside the bag?'],
        ['botol minum', 'water bottle'],
        '💭',
        [
          'Ingat benda yang dimasukkan, bukan yang dibawa di tangan.',
          'Remember the item packed, not the item carried by hand.'
        ],
        ['Benda itu dipakai saat haus.', 'It is used when thirsty.'],
        ['Botol minum dimasukkan ke tas.', 'The water bottle goes in the bag.'],
        [['botol', 'bottle']]
      ),
      q(
        'hat-carrier',
        'who',
        ['Siapa yang membawa topi?', 'Who carries the hat?'],
        ['[NamaOrtu]', '[NamaOrtu]'],
        '👤',
        ['Ingat orang yang disebut kedua.', 'Remember the person mentioned second.'],
        ['Orang ini menemani anak pergi.', 'This person accompanies the child.'],
        ['[NamaOrtu] membawa topi.', '[NamaOrtu] carries the hat.']
      )
    ]
  ),
  card(
    'listen-1-pet',
    'mendengar',
    1,
    ['Tempat beristirahat', 'A resting place'],
    [
      'Hewan peliharaan bernama [HewanPeliharaan] tidur di bawah kursi. Di dekat pintu ada bola kuning.',
      'The pet named [HewanPeliharaan] sleeps under a chair. A yellow ball is near the door.'
    ],
    [
      q(
        'sleep-place',
        'where',
        ['Di mana [HewanPeliharaan] tidur?', 'Where does [HewanPeliharaan] sleep?'],
        ['di bawah kursi', 'under a chair'],
        '📍',
        ['Ingat letak tempat tidurnya.', 'Remember the position of the sleeping place.'],
        [
          'Tempat itu lebih rendah dari tempat orang duduk.',
          'The spot is lower than where people sit.'
        ],
        ['[HewanPeliharaan] tidur di bawah kursi.', '[HewanPeliharaan] sleeps under a chair.'],
        [['bawah kursi', 'under the chair']]
      ),
      q(
        'ball-color',
        'what',
        ['Apa warna bolanya?', 'What color is the ball?'],
        ['kuning', 'yellow'],
        '🎨',
        ['Ingat kata warna dalam cerita.', 'Remember the color word in the story.'],
        ['Bayangkan warna pisang matang.', 'Think of the color of a ripe banana.'],
        ['Bola itu berwarna kuning.', 'The ball is yellow.']
      )
    ]
  ),
  card(
    'listen-1-snack',
    'mendengar',
    1,
    ['Camilan sore', 'Afternoon snack'],
    [
      'Sore hari, [NamaTeman] membawa pisang. [NamaAnak] menaruh dua piring di meja.',
      'In the afternoon, [NamaTeman] brings bananas. [NamaAnak] puts two plates on the table.'
    ],
    [
      q(
        'snack-time',
        'when',
        ['Kapan cerita ini terjadi?', 'When does this story happen?'],
        ['sore hari', 'in the afternoon'],
        '🕰️',
        ['Ingat bagian pembuka cerita.', 'Remember the opening of the story.'],
        ['Waktunya sesudah siang, sebelum malam.', 'It is after noon and before night.'],
        ['Cerita dimulai pada sore hari.', 'The story starts in the afternoon.'],
        [['sore', 'afternoon']]
      ),
      q(
        'plate-count',
        'what',
        ['Berapa piring yang ditaruh di meja?', 'How many plates go on the table?'],
        ['dua', 'two'],
        '🔢',
        ['Ingat jumlah benda untuk makan.', 'Remember the number of items for eating.'],
        ['Jumlahnya sama dengan banyak tanganmu.', 'It is the same as the number of your hands.'],
        ['Ada dua piring di meja.', 'There are two plates on the table.'],
        [
          ['2', 'two plates'],
          ['dua piring', '2 plates']
        ]
      )
    ]
  ),
  card(
    'listen-1-library',
    'mendengar',
    1,
    ['Buku pinjaman', 'A borrowed book'],
    [
      'Di perpustakaan, Sari memilih buku tentang kapal. Petugas memasukkan buku itu ke kantong kain.',
      'At the library, Sari chooses a book about ships. The librarian puts it in a cloth bag.'
    ],
    [
      q(
        'book-topic',
        'what',
        ['Buku itu tentang apa?', 'What is the book about?'],
        ['kapal', 'ships'],
        '📖',
        ['Ingat hal yang diceritakan dalam buku.', 'Remember the subject of the book.'],
        ['Benda itu berlayar di air.', 'These things sail on water.'],
        ['Sari memilih buku tentang kapal.', 'Sari chooses a book about ships.'],
        [['perahu', 'boats']]
      ),
      q(
        'book-container',
        'where',
        ['Ke mana petugas memasukkan buku?', 'Where does the librarian put the book?'],
        ['ke kantong kain', 'in a cloth bag'],
        '📍',
        ['Ingat wadah pada akhir cerita.', 'Remember the container at the end.'],
        [
          'Wadah itu bisa dibawa dan terbuat dari kain.',
          'The container can be carried and is made of cloth.'
        ],
        ['Buku dimasukkan ke kantong kain.', 'The book goes in a cloth bag.'],
        [['tas kain', 'cloth bag']]
      )
    ]
  ),
  card(
    'listen-1-sounds',
    'mendengar',
    1,
    ['Suara pagi', 'Morning sounds'],
    [
      'Pagi hari, Rudi mendengar lonceng dari sepeda lewat. Lalu ia mendengar burung berkicau di pohon.',
      'In the morning, Rudi hears the bell of a passing bicycle. Then he hears a bird singing in a tree.'
    ],
    [
      q(
        'first-sound',
        'sequence',
        ['Suara apa yang terdengar lebih dulu?', 'Which sound is heard first?'],
        ['lonceng sepeda', 'bicycle bell'],
        '👂',
        ['Ingat suara sebelum kata lalu.', 'Remember the sound before the word then.'],
        [
          'Suara itu berasal dari kendaraan beroda dua.',
          'The sound comes from a two-wheeled vehicle.'
        ],
        ['Lonceng sepeda terdengar lebih dulu.', 'The bicycle bell is heard first.'],
        [
          ['bel sepeda', 'bike bell'],
          ['lonceng', 'bell']
        ]
      ),
      q(
        'bird-place',
        'where',
        ['Di mana burung berkicau?', 'Where is the bird singing?'],
        ['di pohon', 'in a tree'],
        '📍',
        ['Ingat tempat pada akhir cerita.', 'Remember the place at the end.'],
        ['Tempat itu memiliki batang dan dahan.', 'That place has a trunk and branches.'],
        ['Burung berkicau di pohon.', 'The bird sings in a tree.'],
        [['pohon', 'tree']]
      )
    ]
  ),
  card(
    'listen-2-delivery',
    'mendengar',
    2,
    ['Titipan dan payung', 'Deliveries and an umbrella'],
    [
      '[NamaOrtu] menitipkan roti untuk Nenek dan surat untuk Paman kepada [NamaAnak]. [NamaTeman] hanya membawa payung. [NamaAnak] mengantar surat lebih dulu, lalu roti.',
      '[NamaOrtu] gives [NamaAnak] bread for Grandma and a letter for Uncle. [NamaTeman] carries only an umbrella. [NamaAnak] delivers the letter first, then the bread.'
    ],
    [
      q(
        'bread-recipient',
        'who',
        ['Untuk siapa roti itu?', 'Who is the bread for?'],
        ['Nenek', 'Grandma'],
        '👤',
        ['Bedakan penerima dari pembawanya.', 'Separate the recipient from the carrier.'],
        [
          'Ingat penerima titipan makanan di awal.',
          'Recall the recipient of the food at the start.'
        ],
        ['Roti dititipkan untuk Nenek.', 'The bread is for Grandma.'],
        [['nenek', 'grandmother']]
      ),
      q(
        'delivery-order',
        'sequence',
        ['Apa yang diantar setelah surat?', 'What is delivered after the letter?'],
        ['roti', 'bread'],
        '➡️',
        [
          'Ingat urutan mengantar, bukan urutan saat dititipkan.',
          'Remember delivery order, not the order in which items were given.'
        ],
        ['Cari titipan yang diantar paling akhir.', 'Recall the delivery made last.'],
        ['Surat diantar dulu, kemudian roti.', 'The letter is delivered before the bread.']
      ),
      q(
        'umbrella-carrier',
        'who',
        ['Siapa yang hanya membawa payung?', 'Who carries only an umbrella?'],
        ['[NamaTeman]', '[NamaTeman]'],
        '👤',
        [
          'Ada pembawa yang tidak mendapat titipan makanan atau surat.',
          'One carrier has neither food nor a letter.'
        ],
        [
          'Ingat teman yang disebut di tengah cerita.',
          'Remember the friend mentioned in the middle.'
        ],
        ['[NamaTeman] hanya membawa payung.', '[NamaTeman] carries only an umbrella.']
      )
    ]
  ),
  card(
    'listen-2-garden',
    'mendengar',
    2,
    ['Catatan kebun', 'Garden notes'],
    [
      'Sebelum sarapan, Ina menyiram bunga di depan rumah. Sesudah sarapan, ia memetik tiga tomat di belakang rumah dan meletakkannya di mangkuk putih. Bunga tidak dipetik.',
      'Before breakfast, Ina waters the flowers in front of the house. After breakfast, she picks three tomatoes behind the house and puts them in a white bowl. She does not pick the flowers.'
    ],
    [
      q(
        'watering-time',
        'when',
        ['Kapan Ina menyiram bunga?', 'When does Ina water the flowers?'],
        ['sebelum sarapan', 'before breakfast'],
        '🕰️',
        ['Hubungkan kegiatan itu dengan waktu makan.', 'Connect that activity to the meal.'],
        [
          'Apakah kegiatan itu mendahului atau mengikuti sarapan?',
          'Does that activity come before or after breakfast?'
        ],
        ['Bunga disiram sebelum sarapan.', 'The flowers are watered before breakfast.']
      ),
      q(
        'tomato-place',
        'where',
        ['Di mana tomat dipetik?', 'Where are the tomatoes picked?'],
        ['di belakang rumah', 'behind the house'],
        '📍',
        [
          'Bedakan tempat tumbuh dua jenis tanaman.',
          'Distinguish where the two kinds of plants grow.'
        ],
        [
          'Ingat sisi rumah untuk kegiatan memetik.',
          'Recall the side of the house used for picking.'
        ],
        ['Tomat dipetik di belakang rumah.', 'The tomatoes are picked behind the house.'],
        [['belakang rumah', 'at the back of the house']]
      ),
      q(
        'bowl-color',
        'what',
        ['Apa warna mangkuk untuk tomat?', 'What color is the bowl for the tomatoes?'],
        ['putih', 'white'],
        '🎨',
        [
          'Ingat warna wadah, bukan warna isinya.',
          'Remember the container color, not its contents.'
        ],
        ['Warnanya seperti susu.', 'Its color is like milk.'],
        ['Tomat diletakkan di mangkuk putih.', 'The tomatoes go in a white bowl.']
      )
    ]
  ),
  card(
    'listen-2-train',
    'mendengar',
    2,
    ['Perjalanan singkat', 'A short journey'],
    [
      'Beni naik kereta bersama bibinya. Di stasiun pertama, seorang penjual naik membawa koran. Di stasiun kedua, penjual turun, tetapi Beni dan bibinya tetap duduk. Mereka turun di stasiun ketiga.',
      'Beni takes a train with his aunt. At the first station, a seller boards with newspapers. At the second station, the seller gets off, but Beni and his aunt stay seated. They get off at the third station.'
    ],
    [
      q(
        'companion',
        'who',
        ['Dengan siapa Beni bepergian?', 'Who travels with Beni?'],
        ['bibinya', 'his aunt'],
        '👤',
        [
          'Ingat pendamping sejak awal perjalanan.',
          'Remember the companion from the start of the journey.'
        ],
        [
          'Pendampingnya seorang anggota keluarga perempuan.',
          'His companion is a female family member.'
        ],
        ['Beni bepergian bersama bibinya.', 'Beni travels with his aunt.'],
        [
          ['bibi', 'aunt'],
          ['tante', 'his aunt']
        ]
      ),
      q(
        'seller-stop',
        'when',
        ['Di stasiun ke berapa penjual turun?', 'At which station does the seller get off?'],
        ['stasiun kedua', 'the second station'],
        '🚉',
        ['Bedakan waktu naik dengan waktu turun.', 'Distinguish boarding from getting off.'],
        [
          'Penjual turun satu pemberhentian setelah naik.',
          'The seller gets off one stop after boarding.'
        ],
        ['Penjual turun di stasiun kedua.', 'The seller gets off at the second station.'],
        [
          ['kedua', 'second'],
          ['2', 'station two']
        ]
      ),
      q(
        'stayed-seated',
        'who',
        [
          'Siapa yang tetap duduk saat penjual turun?',
          'Who stays seated when the seller gets off?'
        ],
        ['Beni dan bibinya', 'Beni and his aunt'],
        '👥',
        ['Ada dua orang yang melanjutkan perjalanan.', 'Two people continue the journey.'],
        ['Sebutkan anak itu beserta pendampingnya.', 'Name the child together with his companion.'],
        ['Beni dan bibinya belum turun saat itu.', 'Beni and his aunt do not get off then.'],
        [['Beni dan bibi', 'Beni and aunt']]
      )
    ]
  ),
  card(
    'listen-2-art',
    'mendengar',
    2,
    ['Meja gambar', 'The drawing table'],
    [
      'Mira menggambar rumah dengan pensil, lalu mewarnai atapnya biru. Ia meminjamkan penghapus kepada Danu, bukan pensilnya. Setelah selesai, Mira menyimpan gambar di map hijau dan pensil di kotak.',
      'Mira draws a house with a pencil, then colors its roof blue. She lends Danu her eraser, not her pencil. When finished, Mira puts the drawing in a green folder and the pencil in a box.'
    ],
    [
      q(
        'loan',
        'what',
        ['Apa yang dipinjam Danu?', 'What does Danu borrow?'],
        ['penghapus', 'eraser'],
        '💭',
        ['Ingat benda yang berpindah tangan.', 'Remember the object that changes hands.'],
        [
          'Bukan alat untuk membuat garis, tetapi untuk menghilangkannya.',
          'Not a tool for making marks, but for removing them.'
        ],
        ['Mira meminjamkan penghapus kepada Danu.', 'Mira lends Danu the eraser.']
      ),
      q(
        'roof-color',
        'what',
        ['Apa warna atap dalam gambar?', 'What color is the roof in the drawing?'],
        ['biru', 'blue'],
        '🎨',
        [
          'Bedakan warna bagian gambar dari warna tempat menyimpannya.',
          'Distinguish the color in the picture from the storage color.'
        ],
        [
          'Ingat warna yang dipakai setelah membuat garis.',
          'Recall the color used after drawing the outlines.'
        ],
        ['Atap diwarnai biru.', 'The roof is colored blue.']
      ),
      q(
        'drawing-storage',
        'where',
        ['Di mana gambar disimpan?', 'Where is the drawing stored?'],
        ['di map hijau', 'in a green folder'],
        '📂',
        [
          'Ada dua tempat penyimpanan untuk benda yang berbeda.',
          'There are two storage places for different items.'
        ],
        [
          'Ingat wadah untuk kertas, bukan alat tulis.',
          'Recall the holder for paper, not the writing tool.'
        ],
        ['Gambar disimpan di map hijau.', 'The drawing is stored in a green folder.'],
        [['map hijau', 'green folder']]
      )
    ]
  ),
  card(
    'listen-2-market',
    'mendengar',
    2,
    ['Daftar belanja', 'The shopping list'],
    [
      '[NamaOrtu] meminta [NamaAnak] membeli telur dan sabun. Di toko, telur habis. [NamaAnak] membeli sabun saja, lalu mengembalikan uang sisa kepada [NamaOrtu]. Di jalan pulang, [NamaTeman] melambaikan tangan.',
      '[NamaOrtu] asks [NamaAnak] to buy eggs and soap. At the shop, the eggs are sold out. [NamaAnak] buys only soap, then returns the change to [NamaOrtu]. On the way home, [NamaTeman] waves.'
    ],
    [
      q(
        'actual-purchase',
        'what',
        ['Apa yang benar-benar dibeli?', 'What is actually bought?'],
        ['sabun saja', 'only soap'],
        '🛍️',
        [
          'Bedakan daftar permintaan dari hasil belanja.',
          'Distinguish the requested list from the actual purchase.'
        ],
        ['Ingat barang yang masih tersedia.', 'Recall the item still available.'],
        ['Yang dibeli hanya sabun.', 'Only soap is bought.'],
        [['sabun', 'soap']]
      ),
      q(
        'change-recipient',
        'who',
        ['Kepada siapa uang sisa dikembalikan?', 'Who receives the change?'],
        ['[NamaOrtu]', '[NamaOrtu]'],
        '👤',
        [
          'Ingat orang yang memberi tugas belanja.',
          'Remember the person who asks for the shopping.'
        ],
        ['Bukan teman yang ditemui di jalan.', 'Not the friend met on the way.'],
        ['Uang sisa dikembalikan kepada [NamaOrtu].', 'The change is returned to [NamaOrtu].']
      ),
      q(
        'wave-time',
        'when',
        ['Kapan teman melambaikan tangan?', 'When does the friend wave?'],
        ['di jalan pulang', 'on the way home'],
        '🕰️',
        [
          'Ingat bagian perjalanan ketika mereka bertemu.',
          'Recall the part of the journey when they meet.'
        ],
        [
          'Apakah sedang menuju toko atau kembali dari toko?',
          'Are they heading to the shop or returning from it?'
        ],
        ['Teman melambaikan tangan di jalan pulang.', 'The friend waves on the way home.'],
        [['saat pulang', 'while returning home']]
      )
    ]
  ),
  card(
    'logic-1-rain',
    'logika',
    1,
    ['Kertas di teras', 'Paper on the porch'],
    [
      '[NamaAnak] menggambar di teras terbuka. Hujan mulai turun dan air mengenai kertas. Ia memindahkan kertas ke dalam rumah agar tetap kering.',
      '[NamaAnak] draws on an open porch. Rain begins and water reaches the paper. The child moves the paper indoors to keep it dry.'
    ],
    [
      q(
        'move-reason',
        'cause',
        ['Mengapa kertas dipindahkan ke dalam rumah?', 'Why is the paper moved indoors?'],
        ['agar kertas tidak basah terkena hujan', 'to keep the paper from getting wet in the rain'],
        '🤔',
        [
          'Pikirkan apa yang bisa terjadi pada kertas di tempat terbuka.',
          'Think about what could happen to paper in the open.'
        ],
        ['Apa pengaruh air terhadap kertas?', 'What does water do to paper?'],
        [
          'Di dalam rumah, kertas terlindung dari hujan.',
          'Indoors, the paper is protected from rain.'
        ],
        [
          ['agar tidak basah', 'to keep it dry'],
          ['karena hujan', 'because it is raining']
        ]
      ),
      q(
        'stayed-outside',
        'cause',
        [
          'Jika kertas tetap di luar terkena hujan, apa yang terjadi?',
          'If the paper stays outside in the rain, what happens?'
        ],
        ['kertas menjadi basah', 'the paper gets wet'],
        '💧',
        [
          'Bayangkan air terus jatuh pada kertas.',
          'Imagine water continuing to fall on the paper.'
        ],
        ['Apakah kertas yang terkena air tetap kering?', 'Does paper touched by water stay dry?'],
        ['Air hujan membuat kertas basah.', 'Rainwater makes the paper wet.'],
        [['basah', 'wet']]
      )
    ]
  ),
  card(
    'logic-1-blocks',
    'logika',
    1,
    ['Menara di tepi', 'A tower at the edge'],
    [
      'Sebuah menara balok berdiri di tepi meja. Meja itu terguncang ketika tersenggol. Menara jatuh. Untuk mencoba lagi, Tono memilih bagian tengah meja yang lebih jauh dari tepi.',
      'A block tower stands at the edge of a table. The table shakes when bumped. The tower falls. To try again, Tono chooses the middle of the table, farther from the edge.'
    ],
    [
      q(
        'fall-trigger',
        'cause',
        ['Apa yang membuat menara jatuh?', 'What makes the tower fall?'],
        ['meja terguncang karena tersenggol', 'the table shakes after being bumped'],
        '🤔',
        [
          'Ingat perubahan tepat sebelum menara jatuh.',
          'Recall the change just before the tower falls.'
        ],
        ['Apakah alas menara tetap diam?', 'Does the base under the tower stay still?'],
        ['Guncangan meja membuat menara jatuh.', 'The shaking table makes the tower fall.'],
        [
          ['meja bergoyang', 'the table shakes'],
          ['meja tersenggol', 'the table is bumped']
        ]
      ),
      q(
        'safer-position',
        'cause',
        [
          'Mengapa Tono memilih tengah meja untuk mencoba lagi?',
          'Why does Tono choose the middle of the table to try again?'
        ],
        ['agar menara lebih jauh dari tepi', 'to keep the tower farther from the edge'],
        '↔️',
        [
          'Bandingkan jarak kedua tempat dari pinggir.',
          'Compare how far the two places are from the edge.'
        ],
        [
          'Di mana ada lebih banyak ruang sebelum balok melewati pinggir?',
          'Where is there more room before blocks go over the edge?'
        ],
        [
          'Bagian tengah memberi jarak lebih besar dari tepi.',
          'The middle leaves more space before the edge.'
        ],
        [['supaya tidak mudah jatuh dari meja', 'so it is less likely to fall off the table']]
      )
    ]
  ),
  card(
    'logic-1-wash',
    'logika',
    1,
    ['Tangan berlumpur', 'Muddy hands'],
    [
      'Setelah bermain tanah, tangan [NamaAnak] berlumpur. Ia ingin memegang roti. [NamaOrtu] mengajaknya mencuci tangan dengan sabun sebelum mengambil roti.',
      'After playing with soil, [NamaAnak] has muddy hands. The child wants to hold some bread. [NamaOrtu] suggests washing hands with soap before taking the bread.'
    ],
    [
      q(
        'before-bread',
        'sequence',
        [
          'Apa yang perlu dilakukan sebelum mengambil roti?',
          'What needs to happen before taking the bread?'
        ],
        ['mencuci tangan dengan sabun', 'wash hands with soap'],
        '🫧',
        [
          'Ingat keadaan tangan setelah bermain.',
          'Remember the condition of the hands after playing.'
        ],
        [
          'Bagaimana menghilangkan lumpur dari tangan?',
          'How can the mud be removed from the hands?'
        ],
        ['Tangan dicuci sebelum menyentuh makanan.', 'Hands are washed before touching food.'],
        [['cuci tangan', 'wash hands']]
      ),
      q(
        'mud-transfer',
        'cause',
        [
          'Jika roti dipegang dengan tangan berlumpur, apa yang bisa terjadi pada roti?',
          'If muddy hands hold the bread, what could happen to the bread?'
        ],
        ['roti terkena lumpur', 'mud gets on the bread'],
        '🤔',
        ['Pikirkan benda yang disentuh tangan kotor.', 'Think about what dirty hands touch.'],
        [
          'Lumpur dapat berpindah dari tangan ke apa?',
          'What can the mud move onto from the hands?'
        ],
        ['Lumpur di tangan dapat mengotori roti.', 'Mud on the hands can dirty the bread.'],
        [['roti menjadi kotor', 'the bread gets dirty']]
      )
    ]
  ),
  card(
    'logic-1-ice',
    'logika',
    1,
    ['Es untuk minuman', 'Ice for a drink'],
    [
      'Dua es batu sama besar diletakkan di dua tempat. Satu di piring yang terkena matahari, satu tetap di dalam freezer yang dingin. Es di piring mulai mencair.',
      'Two ice cubes of the same size are put in two places. One is on a plate in the sun; one stays in a cold freezer. The ice on the plate starts to melt.'
    ],
    [
      q(
        'melt-reason',
        'cause',
        ['Mengapa es di piring mulai mencair?', 'Why does the ice on the plate start melting?'],
        ['karena terkena panas matahari', 'because it is warmed by the sun'],
        '☀️',
        ['Bandingkan suhu di kedua tempat.', 'Compare the temperature in the two places.'],
        ['Apa yang menghangatkan piring di luar?', 'What warms the plate outside?'],
        ['Panas matahari membuat es mencair.', 'The warmth of the sun melts the ice.'],
        [['karena panas', 'because it is warm']]
      ),
      q(
        'keep-frozen',
        'cause',
        [
          'Jika ingin es tetap beku, tempat mana yang dipilih?',
          'To keep the ice frozen, which place should be chosen?'
        ],
        ['di dalam freezer', 'inside the freezer'],
        '❄️',
        [
          'Pilih tempat yang tidak menghangatkan es.',
          'Choose the place that does not warm the ice.'
        ],
        [
          'Tempat mana yang menjaga suhu tetap sangat dingin?',
          'Which place keeps the temperature very cold?'
        ],
        ['Freezer yang dingin menjaga es tetap beku.', 'The cold freezer keeps the ice frozen.'],
        [
          ['freezer', 'freezer'],
          ['lemari pembeku', 'the freezer']
        ]
      )
    ]
  ),
  card(
    'logic-1-ribbon',
    'logika',
    1,
    ['Pita terlalu pendek', 'A ribbon too short'],
    [
      'Lina ingin mengikat kotak besar. Pita pertamanya tidak cukup panjang untuk mengelilingi kotak. Ada pita lain yang lebih panjang. Lina mengganti pita, bukan kotaknya.',
      'Lina wants to tie a large box. Her first ribbon is too short to go around the box. Another ribbon is longer. Lina changes the ribbon, not the box.'
    ],
    [
      q(
        'replacement-reason',
        'cause',
        ['Mengapa Lina mengganti pita pertama?', 'Why does Lina replace the first ribbon?'],
        ['pita pertama terlalu pendek', 'the first ribbon is too short'],
        '📏',
        [
          'Bandingkan panjang benda dengan ukuran yang harus dikelilingi.',
          'Compare its length with the size it must go around.'
        ],
        [
          'Apakah kedua ujungnya bisa bertemu mengelilingi kotak?',
          'Can its ends meet around the box?'
        ],
        [
          'Pita pertama tidak cukup panjang untuk kotak itu.',
          'The first ribbon is not long enough for the box.'
        ],
        [['tidak cukup panjang', 'not long enough']]
      ),
      q(
        'same-ribbon',
        'cause',
        [
          'Jika Lina memakai pita pendek yang sama lagi, apakah masalahnya selesai?',
          'If Lina uses the same short ribbon again, is the problem solved?'
        ],
        ['tidak, pita tetap terlalu pendek', 'no, the ribbon is still too short'],
        '🔁',
        ['Pikirkan apakah ada ukuran yang berubah.', 'Think about whether any size has changed.'],
        [
          'Kotak dan pita masih sama seperti percobaan pertama.',
          'The box and ribbon are still the same as in the first try.'
        ],
        [
          'Mengulang tanpa perubahan tidak menambah panjang pita.',
          'Repeating without a change does not lengthen the ribbon.'
        ],
        [['tidak', 'no']]
      )
    ]
  ),
  card(
    'logic-2-bridge',
    'logika',
    2,
    ['Jembatan mainan', 'A toy bridge'],
    [
      'Sebuah mobil mainan harus menyeberangi celah. Papan merah terlalu pendek untuk mencapai sisi seberang. Papan biru mencapai kedua sisi, tetapi bergoyang karena satu ujungnya belum ditopang. [NamaAnak] menaruh balok di bawah ujung yang bergoyang sebelum menjalankan mobil.',
      'A toy car must cross a gap. The red plank is too short to reach the other side. The blue plank reaches both sides but wobbles because one end has no support. [NamaAnak] puts a block under the wobbling end before driving the car across.'
    ],
    [
      q(
        'plank-choice',
        'cause',
        [
          'Papan mana yang dapat menjangkau kedua sisi celah?',
          'Which plank can reach both sides of the gap?'
        ],
        ['papan biru', 'the blue plank'],
        '↔️',
        ['Syarat pertama adalah panjang yang cukup.', 'The first requirement is enough length.'],
        [
          'Bandingkan jangkauan kedua papan, bukan kestabilannya.',
          'Compare the reach of the two planks, not their stability.'
        ],
        ['Hanya papan biru mencapai kedua sisi.', 'Only the blue plank reaches both sides.'],
        [['biru', 'blue']]
      ),
      q(
        'support-reason',
        'cause',
        [
          'Mengapa balok diletakkan di bawah ujung papan?',
          'Why is a block put under the end of the plank?'
        ],
        [
          'agar ujung papan ditopang dan tidak bergoyang',
          'to support the end and stop it wobbling'
        ],
        '🧱',
        [
          'Pikirkan masalah yang masih ada setelah panjangnya cukup.',
          'Think about the problem remaining after the length is sufficient.'
        ],
        [
          'Apa yang dibutuhkan ujung yang bergerak naik turun?',
          'What does an end that moves up and down need?'
        ],
        [
          'Balok menopang ujung sehingga papan lebih stabil.',
          'The block supports the end so the plank is steadier.'
        ],
        [
          ['agar stabil', 'to make it stable'],
          ['supaya tidak goyang', 'to stop wobbling']
        ]
      ),
      q(
        'cross-order',
        'sequence',
        [
          'Mana yang lebih dulu: menopang ujung atau menjalankan mobil?',
          'Which comes first: supporting the end or driving the car across?'
        ],
        ['menopang ujung', 'supporting the end'],
        '➡️',
        ['Siapkan jalur aman sebelum menggunakannya.', 'Make the route safe before using it.'],
        [
          'Apakah mobil sebaiknya bergerak ketika jalurnya masih bergoyang?',
          'Should the car move while its route still wobbles?'
        ],
        ['Ujung ditopang sebelum mobil melintas.', 'The end is supported before the car crosses.'],
        [['menaruh balok penopang', 'putting the support block in place']]
      )
    ]
  ),
  card(
    'logic-2-seeds',
    'logika',
    2,
    ['Dua pot', 'Two pots'],
    [
      'Dua pot berisi jenis benih yang sama dan mendapat cahaya yang sama. Pot A disiram setiap hari. Pot B tidak disiram dan tanahnya kering. Tunas muncul di pot A saja. [NamaTeman] ingin mencoba apakah air membantu pot B bertunas.',
      'Two pots contain the same kind of seeds and receive the same light. Pot A is watered every day. Pot B is not watered and its soil is dry. Only pot A sprouts. [NamaTeman] wants to try whether water helps pot B sprout.'
    ],
    [
      q(
        'different-condition',
        'cause',
        ['Perawatan apa yang berbeda antara kedua pot?', 'What care differs between the pots?'],
        ['pemberian air', 'watering'],
        '🔎',
        ['Cari hal yang tidak dibuat sama.', 'Look for what is not kept the same.'],
        [
          'Jenis benih dan cahaya sudah sama; perhatikan tanahnya.',
          'Seed type and light are already the same; consider the soil.'
        ],
        ['Pot A disiram, sedangkan pot B tidak.', 'Pot A is watered, but pot B is not.'],
        [
          ['penyiraman', 'water'],
          ['air', 'whether they are watered']
        ]
      ),
      q(
        'next-test',
        'cause',
        [
          'Untuk mencoba dugaan itu, apa yang perlu dilakukan pada pot B?',
          'To try that idea, what should be done to pot B?'
        ],
        ['menyiram pot B', 'water pot B'],
        '🌱',
        [
          'Ubah perawatan yang diduga kurang, bukan semua hal sekaligus.',
          'Change the care thought to be missing, not everything at once.'
        ],
        ['Apa yang bisa diberikan pada tanah yang kering?', 'What can be added to dry soil?'],
        [
          'Menyiram pot B menguji apakah air membantu.',
          'Watering pot B tests whether water helps.'
        ],
        [['beri air', 'add water']]
      ),
      q(
        'not-yet-known',
        'cause',
        [
          'Setelah baru sekali disiram, apakah kita sudah tahu pasti pot B akan bertunas?',
          'After watering it just once, do we already know for sure that pot B will sprout?'
        ],
        ['belum, perlu menunggu dan mengamati', 'not yet, we need to wait and observe'],
        '⏳',
        [
          'Percobaan baru dimulai; hasilnya belum disebutkan.',
          'The trial has just started; its outcome has not been given.'
        ],
        [
          'Dugaan belum sama dengan hasil yang sudah terlihat.',
          'An idea is not the same as an observed result.'
        ],
        [
          'Kita perlu mengamati; cerita tidak menjamin benih akan tumbuh.',
          'We need to observe; the story does not guarantee growth.'
        ],
        [
          ['belum tahu', 'we do not know yet'],
          ['belum', 'not yet']
        ]
      )
    ]
  ),
  card(
    'logic-2-route',
    'logika',
    2,
    ['Jalan ke perpustakaan', 'The route to the library'],
    [
      'Dari rumah, jalan pendek menuju perpustakaan melewati jembatan yang sedang ditutup. Jalan lewat taman lebih panjang tetapi terbuka. [NamaOrtu] harus mengembalikan buku hari ini. Mereka tidak boleh melewati jembatan yang ditutup.',
      'From home, the short route to the library crosses a bridge that is closed. The route through the park is longer but open. [NamaOrtu] must return a book today. They are not allowed to cross the closed bridge.'
    ],
    [
      q(
        'usable-route',
        'cause',
        [
          'Jalan mana yang bisa dipakai untuk mengembalikan buku hari ini?',
          'Which route can be used to return the book today?'
        ],
        ['jalan lewat taman', 'the route through the park'],
        '🗺️',
        [
          'Jalan harus bisa dilewati, bukan hanya pendek.',
          'A route must be passable, not just short.'
        ],
        ['Pilih jalur yang terbuka.', 'Choose the open route.'],
        ['Jalur taman terbuka sehingga dapat dilewati.', 'The park route is open and can be used.'],
        [['lewat taman', 'through the park']]
      ),
      q(
        'short-route-problem',
        'cause',
        [
          'Mengapa jalan yang lebih pendek tidak bisa dipilih?',
          'Why can the shorter route not be chosen?'
        ],
        ['karena jembatannya ditutup', 'because its bridge is closed'],
        '🚧',
        [
          'Ada hambatan yang mengalahkan keuntungan jarak.',
          'There is an obstacle that outweighs the shorter distance.'
        ],
        [
          'Ingat aturan tentang bagian jalan yang tidak boleh dilalui.',
          'Recall the rule about the part that cannot be crossed.'
        ],
        [
          'Mereka tidak boleh melewati jembatan yang ditutup.',
          'They cannot cross the closed bridge.'
        ],
        [['jembatan ditutup', 'the bridge is closed']]
      ),
      q(
        'reopen-condition',
        'cause',
        [
          'Jika besok jembatan dibuka dan aman, apakah jalan pendek bisa dipakai?',
          'If the bridge is open and safe tomorrow, could the short route be used?'
        ],
        ['ya, karena hambatannya sudah tidak ada', 'yes, because the obstacle is gone'],
        '🔄',
        [
          'Gunakan keadaan baru, bukan hanya keadaan hari ini.',
          'Use the new situation, not just today’s situation.'
        ],
        [
          'Apakah larangan akibat penutupan masih berlaku jika jalurnya dibuka dan aman?',
          'Does the closure still block the route if it is open and safe?'
        ],
        [
          'Saat jembatan terbuka dan aman, jalur pendek dapat dipakai.',
          'When the bridge is open and safe, the short route can be used.'
        ],
        [
          ['ya', 'yes'],
          ['bisa', 'it could']
        ]
      )
    ]
  ),
  card(
    'logic-2-baking',
    'logika',
    2,
    ['Adonan belum siap', 'The mixture is not ready'],
    [
      'Resep kue dingin meminta: campur yoghurt dan buah, tuang ke cetakan, lalu dinginkan. Nisa sudah mencampur yoghurt dan buah, tetapi cetakan masih kosong. Adonan masih di mangkuk. Ia ingin langsung memasukkan cetakan kosong ke kulkas.',
      'A chilled dessert recipe says: mix yogurt and fruit, pour into molds, then chill. Nisa has mixed the yogurt and fruit, but the molds are still empty. The mixture is still in the bowl. She wants to put the empty molds straight into the fridge.'
    ],
    [
      q(
        'missing-step',
        'sequence',
        [
          'Langkah apa yang terlewat sebelum mendinginkan?',
          'Which step is missing before chilling?'
        ],
        ['menuang adonan ke cetakan', 'pouring the mixture into the molds'],
        '🥣',
        [
          'Bandingkan langkah resep dengan yang sudah dilakukan.',
          'Compare the recipe steps with what has been done.'
        ],
        [
          'Bagaimana adonan berpindah dari mangkuk ke tempat membentuknya?',
          'How does the mixture move from the bowl to its shaping containers?'
        ],
        [
          'Adonan harus dituang ke cetakan sebelum didinginkan.',
          'The mixture must go into the molds before chilling.'
        ],
        [['isi cetakan dengan adonan', 'fill the molds with the mixture']]
      ),
      q(
        'empty-mold-result',
        'cause',
        [
          'Jika hanya cetakan kosong masuk kulkas, apakah adonan di mangkuk ikut dingin di kulkas?',
          'If only empty molds enter the fridge, is the mixture in the bowl being chilled in the fridge too?'
        ],
        ['tidak, adonan masih di luar kulkas', 'no, the mixture is still outside the fridge'],
        '🤔',
        ['Pikirkan apa yang benar-benar dipindahkan.', 'Think about what is actually moved.'],
        [
          'Apakah memindahkan wadah kosong juga memindahkan isinya yang ada di tempat lain?',
          'Does moving an empty container also move contents that are elsewhere?'
        ],
        [
          'Adonan tidak ikut dingin di kulkas jika masih di luar.',
          'The mixture is not chilled in the fridge while it remains outside.'
        ],
        [['tidak', 'no']]
      ),
      q(
        'after-filling',
        'sequence',
        [
          'Setelah cetakan berisi adonan, apa langkah berikutnya menurut resep?',
          'Once the molds contain the mixture, what is the next recipe step?'
        ],
        ['mendinginkan di kulkas', 'chilling in the fridge'],
        '➡️',
        [
          'Kembali ke urutan resep, bukan rencana yang keliru.',
          'Return to the recipe order, not the mistaken plan.'
        ],
        ['Langkah terakhir menggunakan tempat bersuhu dingin.', 'The last step uses a cold place.'],
        ['Sesudah dituang, adonan didinginkan.', 'After pouring, the mixture is chilled.'],
        [
          ['masukkan ke kulkas', 'put them in the fridge'],
          ['dinginkan', 'chill']
        ]
      )
    ]
  ),
  card(
    'logic-2-pet-gate',
    'logika',
    2,
    ['Pintu pagar kecil', 'The little gate'],
    [
      '[HewanPeliharaan] berada di halaman berpagar. Ada dua pintu pagar. Pintu depan tertutup, tetapi pintu samping terbuka. [NamaAnak] ingin hewan itu tetap di halaman saat bola digelindingkan di luar pagar. Ia menutup pintu samping sebelum bola dimainkan.',
      '[HewanPeliharaan] is in a fenced yard. There are two gates. The front gate is closed, but the side gate is open. [NamaAnak] wants the pet to stay in the yard while a ball is rolled outside the fence. The child closes the side gate before the ball game starts.'
    ],
    [
      q(
        'escape-route',
        'cause',
        [
          'Sebelum ditutup, lewat mana hewan bisa keluar tanpa melewati pagar?',
          'Before it is closed, where could the pet leave without crossing the fence?'
        ],
        ['pintu samping', 'the side gate'],
        '🔎',
        ['Periksa celah yang masih terbuka.', 'Check the opening that remains open.'],
        [
          'Tidak semua pintu berada dalam keadaan yang sama.',
          'Not all gates are in the same state.'
        ],
        [
          'Pintu samping yang terbuka memberi jalan keluar.',
          'The open side gate provides a way out.'
        ],
        [['lewat samping', 'through the side gate']]
      ),
      q(
        'front-only',
        'cause',
        [
          'Apakah menutup pintu depan saja cukup untuk menutup semua jalan keluar dalam cerita?',
          'Is closing only the front gate enough to close all the exits in the story?'
        ],
        ['tidak, masih ada pintu lain yang terbuka', 'no, another gate is still open'],
        '🤔',
        [
          'Satu jalan tertutup belum berarti semua jalan tertutup.',
          'One closed route does not mean every route is closed.'
        ],
        ['Periksa apakah kedua jalan sudah tertutup.', 'Check whether both routes are closed.'],
        [
          'Kedua pintu perlu tertutup untuk menutup dua jalan itu.',
          'Both gates must be closed to close those two routes.'
        ],
        [['tidak', 'no']]
      ),
      q(
        'gate-before-game',
        'sequence',
        [
          'Untuk menjaga hewan di halaman, mana yang dilakukan dulu: menutup jalan keluar atau memainkan bola di luar?',
          'To keep the pet in the yard, which comes first: closing the exits or playing ball outside?'
        ],
        ['menutup jalan keluar', 'closing the exits'],
        '➡️',
        [
          'Selesaikan persiapan sebelum kegiatan dimulai.',
          'Finish the preparation before starting the activity.'
        ],
        [
          'Apakah sebaiknya menunggu hewan sudah keluar baru bersiap?',
          'Should preparation wait until the pet has already left?'
        ],
        [
          'Jalan keluar ditutup sebelum bola dimainkan.',
          'The exits are closed before the ball game.'
        ],
        [['menutup pintu pagar', 'closing the gates']]
      )
    ]
  )
];
