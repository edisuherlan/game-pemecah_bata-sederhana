/**
 * ============================================
 * WATERMARK DEVELOPER
 * ============================================
 * Nama        : Edi Suherlan
 * GitHub      : github/edisuherlan
 * Email       : audhighasu@gmail.com
 * Website     : audhighasu.com
 * ============================================
 * 
 * FILE: utils/database.ts
 * DESKRIPSI: Utility functions untuk database lokal menggunakan AsyncStorage
 * 
 * File ini berisi fungsi-fungsi untuk mengelola data pemain dan sesi permainan.
 * Menggunakan AsyncStorage untuk penyimpanan data lokal yang persisten.
 */

// Import AsyncStorage dari React Native untuk penyimpanan data lokal yang persisten
// AsyncStorage menyimpan data dalam format key-value dan data tetap tersimpan meskipun app ditutup
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// INTERFACE/TIPE DATA
// ============================================

/**
 * Interface untuk data pemain (Player)
 * Interface ini mendefinisikan struktur data yang digunakan untuk menyimpan informasi pemain
 * Semua field wajib diisi saat membuat player baru
 */
export interface Player {
  id: number;              // ID unik pemain (auto-increment, tidak boleh duplikat)
  name: string;            // Nama pemain (unik, tidak boleh sama dengan pemain lain)
  highScore: number;       // Skor tertinggi yang pernah dicapai pemain (akan diupdate jika skor baru lebih tinggi)
  totalGames: number;      // Total jumlah permainan yang telah dimainkan oleh pemain ini
  totalScore: number;      // Total akumulasi skor dari semua permainan (untuk statistik)
  bestLevel: number;       // Level tertinggi yang pernah dicapai pemain (akan diupdate jika level baru lebih tinggi)
  createdAt: string;      // Tanggal dan waktu saat akun pemain pertama kali dibuat (format ISO string)
  updatedAt: string;       // Tanggal dan waktu terakhir kali data pemain diupdate (format ISO string)
}

/**
 * Interface untuk sesi permainan (GameSession)
 * Interface ini mendefinisikan struktur data untuk menyimpan riwayat setiap permainan
 * Setiap kali pemain menyelesaikan permainan, sesi baru akan dibuat
 */
export interface GameSession {
  id: number;             // ID unik untuk setiap sesi permainan (menggunakan timestamp)
  playerId: number;       // ID pemain yang memainkan sesi ini (foreign key ke Player.id)
  score: number;          // Skor yang dicapai dalam sesi permainan ini
  level: number;          // Level tertinggi yang dicapai dalam sesi permainan ini
  playedAt: string;       // Waktu kapan permainan ini dimainkan (format ISO string)
}

// ============================================
// KONSTANTA UNTUK ASYNCSTORAGE KEYS
// ============================================
// Key-key ini digunakan sebagai identifier untuk menyimpan data di AsyncStorage
// Format '@app_name:data_type' adalah konvensi untuk menghindari konflik dengan app lain
const PLAYERS_KEY = '@pemecah_bata:players';      // Key untuk menyimpan array semua pemain
const SESSIONS_KEY = '@pemecah_bata:sessions';    // Key untuk menyimpan array semua sesi permainan
const NEXT_ID_KEY = '@pemecah_bata:nextId';       // Key untuk menyimpan ID berikutnya yang akan digunakan untuk pemain baru

// ============================================
// VARIABEL CACHE DAN STATE
// ============================================
// Cache untuk data pemain di memory (untuk performa)
// Menggunakan cache mengurangi jumlah akses ke AsyncStorage yang lebih lambat
// Cache akan diupdate setiap kali ada perubahan data
let playersCache: Player[] | null = null;

// ID berikutnya yang akan digunakan untuk pemain baru
// Setiap kali pemain baru dibuat, ID ini akan digunakan lalu di-increment
// Ini memastikan setiap pemain memiliki ID yang unik
let nextPlayerId = 1;

/**
 * Fungsi untuk menginisialisasi database
 * Fungsi ini harus dipanggil saat aplikasi pertama kali dimuat untuk memuat data dari storage
 * 
 * Proses yang dilakukan:
 * 1. Memuat data pemain dari AsyncStorage ke cache memory
 * 2. Menghitung ID berikutnya berdasarkan ID tertinggi yang ada
 * 3. Memuat ID berikutnya yang tersimpan (jika ada) untuk memastikan konsistensi
 * 
 * @returns Promise<void> - Tidak mengembalikan nilai, hanya melakukan inisialisasi
 */
export const initDatabase = async (): Promise<void> => {
  try {
    // ============================================
    // MUAT DATA PEMAIN DARI STORAGE
    // ============================================
    // Ambil data pemain dari AsyncStorage menggunakan key yang sudah didefinisikan
    const playersData = await AsyncStorage.getItem(PLAYERS_KEY);
    
    if (playersData) {
      // Jika ada data, parse dari JSON string ke array of Player objects
      playersCache = JSON.parse(playersData);
      
      // Hitung ID berikutnya berdasarkan ID tertinggi yang ada
      // Ini memastikan ID baru selalu lebih besar dari ID yang sudah ada
      if (playersCache && playersCache.length > 0) {
        // Ambil semua ID pemain, cari yang tertinggi, lalu tambah 1
        nextPlayerId = Math.max(...playersCache.map(p => p.id)) + 1;
      }
    } else {
      // Jika tidak ada data, inisialisasi dengan array kosong
      // Ini berarti ini pertama kali app digunakan atau data sudah dihapus
      playersCache = [];
    }

    // ============================================
    // MUAT ID BERIKUTNYA YANG TERSIMPAN
    // ============================================
    // Ambil ID berikutnya yang tersimpan di storage (jika ada)
    // Ini untuk memastikan konsistensi jika ada perubahan manual atau bug sebelumnya
    const nextIdData = await AsyncStorage.getItem(NEXT_ID_KEY);
    if (nextIdData) {
      // Gunakan yang lebih besar antara ID yang dihitung dari data atau yang tersimpan
      // Ini memastikan tidak ada ID yang duplikat
      nextPlayerId = Math.max(nextPlayerId, parseInt(nextIdData, 10));
    }
  } catch (error) {
    // Jika terjadi error saat inisialisasi, log error dan reset cache ke array kosong
    // Ini mencegah aplikasi crash dan memungkinkan user tetap menggunakan app
    console.error('Error initializing database:', error);
    playersCache = [];
  }
};

/**
 * Fungsi internal untuk menyimpan data pemain ke AsyncStorage
 * Fungsi ini dipanggil setiap kali ada perubahan pada data pemain
 * 
 * Proses yang dilakukan:
 * 1. Mengkonversi array pemain menjadi JSON string
 * 2. Menyimpan ke AsyncStorage dengan key PLAYERS_KEY
 * 3. Menyimpan ID berikutnya untuk konsistensi
 * 
 * @returns Promise<void> - Tidak mengembalikan nilai
 * @throws Error jika terjadi error saat menyimpan
 */
const savePlayers = async (): Promise<void> => {
  // Hanya simpan jika cache tidak null (ada data untuk disimpan)
  if (playersCache) {
    try {
      // Simpan array pemain ke AsyncStorage sebagai JSON string
      // AsyncStorage hanya bisa menyimpan string, jadi perlu stringify dulu
      await AsyncStorage.setItem(PLAYERS_KEY, JSON.stringify(playersCache));
      
      // Simpan ID berikutnya untuk memastikan konsistensi di masa depan
      // Ini berguna jika app di-restart sebelum ID digunakan
      await AsyncStorage.setItem(NEXT_ID_KEY, nextPlayerId.toString());
      
      // Log untuk debugging - menunjukkan berapa banyak pemain yang disimpan
      console.log('Players saved:', playersCache.length, 'players');
    } catch (error) {
      // Jika terjadi error saat menyimpan, log error dan throw agar caller tahu
      console.error('Error saving players:', error);
      throw error;
    }
  }
};

/**
 * Fungsi internal untuk menyimpan sesi permainan ke AsyncStorage
 * Fungsi ini dipanggil setiap kali pemain menyelesaikan permainan
 * 
 * Proses yang dilakukan:
 * 1. Memuat semua sesi yang sudah ada dari storage
 * 2. Menambahkan sesi baru ke array
 * 3. Membatasi jumlah sesi per pemain maksimal 100 (menghapus yang lama)
 * 4. Menyimpan kembali ke storage
 * 
 * @param session - Objek GameSession yang akan disimpan
 * @returns Promise<void> - Tidak mengembalikan nilai
 */
const saveSession = async (session: GameSession): Promise<void> => {
  try {
    // ============================================
    // MUAT SEMUA SESI YANG SUDAH ADA
    // ============================================
    // Ambil semua sesi permainan yang sudah tersimpan dari AsyncStorage
    const sessionsData = await AsyncStorage.getItem(SESSIONS_KEY);
    let sessions: GameSession[] = [];
    
    if (sessionsData) {
      // Jika ada data, parse dari JSON string ke array of GameSession objects
      sessions = JSON.parse(sessionsData);
    }
    
    // ============================================
    // TAMBAHKAN SESI BARU
    // ============================================
    // Tambahkan sesi baru ke array sesi yang sudah ada
    sessions.push(session);
    
    // ============================================
    // BATASI JUMLAH SESI PER PEMAIN (MAKSIMAL 100)
    // ============================================
    // Untuk mencegah storage penuh, batasi jumlah sesi per pemain maksimal 100
    // Ambil semua sesi dari pemain yang sama dengan sesi baru ini
    const playerSessions = sessions.filter(s => s.playerId === session.playerId);
    
    // Jika pemain ini sudah memiliki lebih dari 100 sesi, hapus yang lama
    if (playerSessions.length > 100) {
      // Urutkan sesi berdasarkan waktu (yang terbaru di depan)
      // Ambil 100 sesi terbaru saja
      const toKeep = playerSessions
        .sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime())
        .slice(0, 100);
      
      // Hapus semua sesi lama dari pemain ini, lalu tambahkan kembali 100 yang terbaru
      sessions = sessions.filter(s => s.playerId !== session.playerId).concat(toKeep);
    }
    
    // ============================================
    // SIMPAN KEMBALI KE STORAGE
    // ============================================
    // Simpan array sesi yang sudah diupdate ke AsyncStorage
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch (error) {
    // Jika terjadi error, log saja (tidak throw) karena ini tidak critical
    // User masih bisa bermain meskipun sesi tidak tersimpan
    console.error('Error saving session:', error);
  }
};

/**
 * Fungsi untuk mendapatkan pemain yang sudah ada atau membuat pemain baru
 * Fungsi ini adalah fungsi utama untuk mengelola pemain di aplikasi
 * 
 * Proses yang dilakukan:
 * 1. Memuat data terbaru dari storage (selalu reload untuk konsistensi)
 * 2. Mencari pemain dengan nama yang sama
 * 3. Jika ditemukan, kembalikan pemain yang sudah ada
 * 4. Jika tidak ditemukan, buat pemain baru dengan ID unik
 * 
 * @param name - Nama pemain yang dicari atau akan dibuat
 * @returns Promise<Player> - Objek Player yang sudah ada atau yang baru dibuat
 * @throws Error jika terjadi error saat mengakses database
 */
export const getOrCreatePlayer = async (name: string): Promise<Player> => {
  try {
    // ============================================
    // MUAT DATA TERBARU DARI STORAGE
    // ============================================
    // Selalu reload dari storage terlebih dahulu untuk memastikan data terbaru
    // Ini penting karena data bisa diubah dari tempat lain atau app lain
    const playersData = await AsyncStorage.getItem(PLAYERS_KEY);
    
    if (playersData) {
      // Jika ada data, parse dan update cache
      playersCache = JSON.parse(playersData);
      
      // Update nextPlayerId berdasarkan ID tertinggi yang ada
      // Ini memastikan ID baru selalu unik
      if (playersCache && playersCache.length > 0) {
        nextPlayerId = Math.max(...playersCache.map(p => p.id)) + 1;
      }
    } else {
      // Jika tidak ada data dan cache juga belum diinisialisasi, inisialisasi database
      if (!playersCache) {
        await initDatabase();
      }
    }

    // Validasi bahwa cache sudah terinisialisasi
    if (!playersCache) {
      throw new Error('Failed to initialize database');
    }

    // ============================================
    // CARI PEMAIN YANG SUDAH ADA
    // ============================================
    // Cari pemain dengan nama yang sama (case-sensitive)
    // Jika ditemukan, kembalikan pemain yang sudah ada (tidak buat baru)
    const existingPlayer = playersCache.find(p => p.name === name);
    if (existingPlayer) {
      console.log('Found existing player:', existingPlayer);
      return existingPlayer;
    }

    // ============================================
    // BUAT PEMAIN BARU
    // ============================================
    // Jika tidak ditemukan, buat pemain baru dengan data default
    const now = new Date().toISOString(); // Waktu saat ini dalam format ISO string
    
    const newPlayer: Player = {
      id: nextPlayerId++,        // Gunakan ID berikutnya lalu increment untuk pemain berikutnya
      name,                      // Nama pemain yang diberikan
      highScore: 0,              // Skor tertinggi awal: 0 (belum bermain)
      totalGames: 0,             // Total permainan awal: 0 (belum bermain)
      totalScore: 0,             // Total skor awal: 0 (belum bermain)
      bestLevel: 1,              // Level tertinggi awal: 1 (level pertama)
      createdAt: now,            // Waktu pembuatan: sekarang
      updatedAt: now,            // Waktu update terakhir: sekarang
    };

    console.log('Creating new player:', newPlayer);
    
    // Tambahkan pemain baru ke cache
    playersCache.push(newPlayer);
    
    // Simpan perubahan ke storage
    await savePlayers();
    
    console.log('New player saved, total players:', playersCache.length);

    // Kembalikan pemain yang baru dibuat
    return newPlayer;
  } catch (error) {
    // Jika terjadi error, log dan throw agar caller tahu ada masalah
    console.error('Error getting/creating player:', error);
    throw error;
  }
};

/**
 * Fungsi untuk mengupdate skor pemain setelah permainan selesai
 * Fungsi ini dipanggil setiap kali pemain menyelesaikan permainan (menang atau kalah)
 * 
 * Proses yang dilakukan:
 * 1. Mencari pemain berdasarkan ID
 * 2. Mengupdate statistik pemain (high score, best level, total games, total score)
 * 3. Menyimpan perubahan ke storage
 * 4. Membuat sesi permainan baru untuk riwayat
 * 
 * @param playerId - ID pemain yang skornya akan diupdate
 * @param score - Skor yang dicapai dalam permainan ini
 * @param level - Level tertinggi yang dicapai dalam permainan ini
 * @returns Promise<void> - Tidak mengembalikan nilai
 * @throws Error jika terjadi error saat mengupdate
 */
export const updatePlayerScore = async (
  playerId: number,
  score: number,
  level: number
): Promise<void> => {
  try {
    console.log('updatePlayerScore called:', { playerId, score, level });
    
    // ============================================
    // INISIALISASI DATABASE JIKA BELUM
    // ============================================
    // Pastikan cache sudah diinisialisasi sebelum melakukan operasi
    if (!playersCache) {
      await initDatabase();
    }

    // Validasi bahwa cache sudah terinisialisasi
    if (!playersCache) {
      throw new Error('Database not initialized');
    }

    // ============================================
    // CARI PEMAIN BERDASARKAN ID
    // ============================================
    // Cari index pemain dalam array cache berdasarkan ID
    const playerIndex = playersCache.findIndex(p => p.id === playerId);
    
    // Jika pemain tidak ditemukan, log warning dan return (tidak throw error)
    // Ini mencegah crash jika ada bug atau data tidak konsisten
    if (playerIndex === -1) {
      console.warn(`Player with id ${playerId} not found`);
      return;
    }

    // Ambil data pemain saat ini untuk diupdate
    const player = playersCache[playerIndex];
    console.log('Current player stats:', player);
    
    // ============================================
    // HITUNG STATISTIK BARU
    // ============================================
    // High score: ambil yang lebih besar antara skor lama atau skor baru
    // Jika skor baru lebih tinggi, update high score
    const newHighScore = Math.max(player.highScore, score);
    
    // Best level: ambil yang lebih besar antara level lama atau level baru
    // Jika level baru lebih tinggi, update best level
    const newBestLevel = Math.max(player.bestLevel, level);
    
    // Total games: tambahkan 1 karena pemain baru saja menyelesaikan 1 permainan
    const newTotalGames = player.totalGames + 1;
    
    // Total score: tambahkan skor baru ke total skor yang sudah ada
    // Ini untuk statistik rata-rata skor
    const newTotalScore = player.totalScore + score;
    
    // Waktu update: waktu saat ini
    const now = new Date().toISOString();

    console.log('New stats:', { newHighScore, newBestLevel, newTotalGames, newTotalScore });

    // ============================================
    // UPDATE DATA PEMAIN DI CACHE
    // ============================================
    // Update data pemain dengan statistik baru menggunakan spread operator
    // Spread operator mempertahankan semua field yang tidak diubah
    playersCache[playerIndex] = {
      ...player,                    // Pertahankan semua field yang ada
      highScore: newHighScore,      // Update high score
      bestLevel: newBestLevel,      // Update best level
      totalGames: newTotalGames,    // Update total games
      totalScore: newTotalScore,    // Update total score
      updatedAt: now,               // Update waktu update terakhir
    };

    // ============================================
    // SIMPAN PERUBAHAN KE STORAGE
    // ============================================
    // Simpan perubahan ke AsyncStorage agar data persisten
    await savePlayers();
    console.log('Players saved to storage');

    // ============================================
    // BUAT SESI PERMAINAN BARU
    // ============================================
    // Buat sesi permainan baru untuk menyimpan riwayat permainan ini
    // Sesi ini akan digunakan untuk menampilkan history di leaderboard
    const session: GameSession = {
      id: Date.now(),        // ID unik menggunakan timestamp (milliseconds sejak epoch)
      playerId,              // ID pemain yang memainkan sesi ini
      score,                 // Skor yang dicapai dalam sesi ini
      level,                 // Level tertinggi yang dicapai dalam sesi ini
      playedAt: now,         // Waktu permainan dimainkan
    };

    // Simpan sesi ke storage
    await saveSession(session);
    console.log('Session saved');
  } catch (error) {
    // Jika terjadi error, log dan throw agar caller tahu ada masalah
    console.error('Error updating player score:', error);
    throw error;
  }
};

/**
 * Fungsi untuk mendapatkan semua pemain yang terdaftar
 * Fungsi ini digunakan untuk menampilkan leaderboard atau daftar semua pemain
 * 
 * Proses yang dilakukan:
 * 1. Memuat data terbaru dari storage (selalu reload untuk konsistensi)
 * 2. Mengurutkan pemain berdasarkan high score (tertinggi ke terendah)
 * 3. Jika high score sama, urutkan berdasarkan waktu update terakhir (terbaru di depan)
 * 
 * @returns Promise<Player[]> - Array semua pemain yang sudah diurutkan berdasarkan ranking
 */
export const getAllPlayers = async (): Promise<Player[]> => {
  try {
    // ============================================
    // MUAT DATA TERBARU DARI STORAGE
    // ============================================
    // Selalu reload dari storage untuk memastikan data terbaru
    // Ini penting karena data bisa diubah dari tempat lain
    const playersData = await AsyncStorage.getItem(PLAYERS_KEY);
    console.log('getAllPlayers - Raw data from storage:', playersData);
    
    if (playersData) {
      // Jika ada data, parse dan update cache
      playersCache = JSON.parse(playersData);
      console.log('getAllPlayers - Parsed players:', playersCache?.length, 'players');
    } else {
      // Jika tidak ada data, inisialisasi database
      console.log('getAllPlayers - No data in storage, initializing...');
      await initDatabase();
      
      // Pastikan cache tidak null setelah inisialisasi
      if (!playersCache) {
        playersCache = [];
      }
    }

    // ============================================
    // VALIDASI DATA
    // ============================================
    // Jika tidak ada pemain, kembalikan array kosong
    if (!playersCache || playersCache.length === 0) {
      console.log('getAllPlayers - No players found');
      return [];
    }

    // ============================================
    // URUTKAN PEMAIN BERDASARKAN RANKING
    // ============================================
    // Buat copy array untuk diurutkan (tidak mengubah cache asli)
    // Urutkan berdasarkan:
    // 1. High score (tertinggi ke terendah) - prioritas utama
    // 2. UpdatedAt (terbaru ke terlama) - jika high score sama
    const sorted = [...playersCache].sort((a, b) => {
      // Jika high score berbeda, urutkan berdasarkan high score
      if (b.highScore !== a.highScore) {
        return b.highScore - a.highScore; // Descending (tertinggi di depan)
      }
      // Jika high score sama, urutkan berdasarkan waktu update terakhir
      // Pemain yang lebih baru update dianggap lebih aktif, jadi di depan
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    
    console.log('getAllPlayers - Returning sorted players:', sorted.length);
    return sorted;
  } catch (error) {
    // Jika terjadi error, log dan kembalikan array kosong
    // Ini mencegah crash dan memungkinkan UI tetap berfungsi
    console.error('Error getting all players:', error);
    return [];
  }
};

/**
 * Fungsi untuk mendapatkan riwayat sesi permainan dari seorang pemain
 * Fungsi ini digunakan untuk menampilkan history permainan pemain di leaderboard
 * 
 * Proses yang dilakukan:
 * 1. Memuat semua sesi dari storage
 * 2. Filter sesi berdasarkan playerId
 * 3. Urutkan berdasarkan waktu (terbaru di depan)
 * 4. Batasi jumlah hasil sesuai limit
 * 
 * @param playerId - ID pemain yang riwayatnya akan diambil
 * @param limit - Jumlah maksimal sesi yang akan dikembalikan (default: 10)
 * @returns Promise<GameSession[]> - Array sesi permainan pemain yang sudah diurutkan dan dibatasi
 */
export const getPlayerSessions = async (playerId: number, limit: number = 10): Promise<GameSession[]> => {
  try {
    // ============================================
    // MUAT SEMUA SESI DARI STORAGE
    // ============================================
    // Ambil semua sesi permainan yang tersimpan
    const sessionsData = await AsyncStorage.getItem(SESSIONS_KEY);
    
    // Jika tidak ada data, kembalikan array kosong
    if (!sessionsData) {
      return [];
    }

    // Parse data dari JSON string ke array of GameSession objects
    const allSessions: GameSession[] = JSON.parse(sessionsData);
    
    // ============================================
    // FILTER, URUTKAN, DAN BATASI HASIL
    // ============================================
    // Filter: ambil hanya sesi dari pemain yang diminta
    // Sort: urutkan berdasarkan waktu (terbaru di depan)
    // Slice: ambil hanya N sesi pertama sesuai limit
    const playerSessions = allSessions
      .filter(s => s.playerId === playerId)  // Filter berdasarkan playerId
      .sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime()) // Sort descending berdasarkan waktu
      .slice(0, limit);  // Ambil hanya N pertama sesuai limit

    return playerSessions;
  } catch (error) {
    // Jika terjadi error, log dan kembalikan array kosong
    // Ini mencegah crash dan memungkinkan UI tetap berfungsi
    console.error('Error getting player sessions:', error);
    return [];
  }
};

/**
 * Fungsi untuk mendapatkan pemain teratas berdasarkan ranking
 * Fungsi ini adalah helper untuk mendapatkan top N pemain dari leaderboard
 * 
 * Proses yang dilakukan:
 * 1. Memanggil getAllPlayers untuk mendapatkan semua pemain yang sudah diurutkan
 * 2. Mengambil N pemain pertama sesuai limit
 * 
 * @param limit - Jumlah pemain teratas yang akan dikembalikan (default: 10)
 * @returns Promise<Player[]> - Array pemain teratas yang sudah diurutkan berdasarkan ranking
 */
export const getTopPlayers = async (limit: number = 10): Promise<Player[]> => {
  try {
    // Ambil semua pemain yang sudah diurutkan dari getAllPlayers
    // getAllPlayers sudah mengurutkan berdasarkan high score dan updatedAt
    const allPlayers = await getAllPlayers();
    
    // Ambil hanya N pemain pertama sesuai limit
    // Karena sudah diurutkan, ini akan mengambil top N pemain
    return allPlayers.slice(0, limit);
  } catch (error) {
    // Jika terjadi error, log dan kembalikan array kosong
    console.error('Error getting top players:', error);
    return [];
  }
};

/**
 * Fungsi untuk mengupdate nama pemain
 * Fungsi ini digunakan ketika pemain ingin mengubah nama mereka
 * 
 * Proses yang dilakukan:
 * 1. Memuat data terbaru dari storage
 * 2. Validasi bahwa nama baru belum digunakan oleh pemain lain
 * 3. Mencari pemain berdasarkan ID
 * 4. Mengupdate nama pemain
 * 5. Menyimpan perubahan ke storage
 * 
 * @param playerId - ID pemain yang namanya akan diupdate
 * @param newName - Nama baru yang ingin digunakan
 * @returns Promise<Player> - Objek Player yang sudah diupdate
 * @throws Error jika nama sudah digunakan atau pemain tidak ditemukan
 */
export const updatePlayerName = async (
  playerId: number,
  newName: string
): Promise<Player> => {
  try {
    console.log('updatePlayerName called:', { playerId, newName });
    
    // ============================================
    // MUAT DATA TERBARU DARI STORAGE
    // ============================================
    // Reload dari storage terlebih dahulu untuk memastikan data terbaru
    const playersData = await AsyncStorage.getItem(PLAYERS_KEY);
    
    if (playersData) {
      // Jika ada data, parse dan update cache
      playersCache = JSON.parse(playersData);
    } else {
      // Jika tidak ada data dan cache belum diinisialisasi, inisialisasi database
      if (!playersCache) {
        await initDatabase();
      }
    }

    // Validasi bahwa cache sudah terinisialisasi
    if (!playersCache) {
      throw new Error('Database not initialized');
    }

    // ============================================
    // VALIDASI NAMA BARU TIDAK DUPLIKAT
    // ============================================
    // Cek apakah nama baru sudah digunakan oleh pemain lain
    // Penting: tidak boleh ada 2 pemain dengan nama yang sama
    // Exclude pemain saat ini dari pengecekan (p.id !== playerId)
    const nameExists = playersCache.some(p => p.name === newName && p.id !== playerId);
    
    if (nameExists) {
      // Jika nama sudah digunakan, throw error dengan pesan bahasa Indonesia
      throw new Error('Nama sudah digunakan oleh pemain lain');
    }

    // ============================================
    // CARI PEMAIN BERDASARKAN ID
    // ============================================
    // Cari index pemain dalam array cache berdasarkan ID
    const playerIndex = playersCache.findIndex(p => p.id === playerId);
    
    // Jika pemain tidak ditemukan, throw error
    if (playerIndex === -1) {
      throw new Error(`Player with id ${playerId} not found`);
    }

    // Ambil data pemain saat ini
    const player = playersCache[playerIndex];
    
    // Waktu update: waktu saat ini
    const now = new Date().toISOString();

    // ============================================
    // UPDATE NAMA PEMAIN
    // ============================================
    // Update data pemain dengan nama baru menggunakan spread operator
    // Spread operator mempertahankan semua field yang tidak diubah
    playersCache[playerIndex] = {
      ...player,        // Pertahankan semua field yang ada
      name: newName,    // Update nama dengan nama baru
      updatedAt: now,   // Update waktu update terakhir
    };

    // ============================================
    // SIMPAN PERUBAHAN KE STORAGE
    // ============================================
    // Simpan perubahan ke AsyncStorage agar data persisten
    await savePlayers();
    console.log('Player name updated successfully');

    // Kembalikan pemain yang sudah diupdate
    return playersCache[playerIndex];
  } catch (error) {
    // Jika terjadi error, log dan throw agar caller tahu ada masalah
    console.error('Error updating player name:', error);
    throw error;
  }
};

/**
 * Fungsi untuk menghapus pemain dari database
 * Fungsi ini digunakan untuk menghapus akun pemain dan semua data terkait
 * 
 * Proses yang dilakukan:
 * 1. Memastikan database sudah diinisialisasi
 * 2. Menghapus pemain dari cache berdasarkan ID
 * 3. Menyimpan perubahan ke storage
 * 4. Menghapus semua sesi permainan dari pemain tersebut
 * 
 * PERINGATAN: Fungsi ini akan menghapus semua data pemain secara permanen!
 * 
 * @param playerId - ID pemain yang akan dihapus
 * @returns Promise<void> - Tidak mengembalikan nilai
 * @throws Error jika terjadi error saat menghapus
 */
export const deletePlayer = async (playerId: number): Promise<void> => {
  try {
    // ============================================
    // INISIALISASI DATABASE JIKA BELUM
    // ============================================
    // Pastikan cache sudah diinisialisasi sebelum melakukan operasi
    if (!playersCache) {
      await initDatabase();
    }

    // Validasi bahwa cache sudah terinisialisasi
    if (!playersCache) {
      throw new Error('Database not initialized');
    }

    // ============================================
    // HAPUS PEMAIN DARI CACHE
    // ============================================
    // Filter array untuk menghapus pemain dengan ID yang sesuai
    // Filter akan mengembalikan array baru tanpa pemain yang dihapus
    playersCache = playersCache.filter(p => p.id !== playerId);
    
    // Simpan perubahan ke storage
    await savePlayers();

    // ============================================
    // HAPUS SEMUA SESI PERMAINAN PEMAIN
    // ============================================
    // Ambil semua sesi permainan dari storage
    const sessionsData = await AsyncStorage.getItem(SESSIONS_KEY);
    
    if (sessionsData) {
      // Parse data dari JSON string ke array of GameSession objects
      const sessions: GameSession[] = JSON.parse(sessionsData);
      
      // Filter untuk menghapus semua sesi dari pemain yang dihapus
      // Filter akan mengembalikan array baru tanpa sesi dari pemain tersebut
      const filteredSessions = sessions.filter(s => s.playerId !== playerId);
      
      // Simpan kembali array sesi yang sudah difilter ke storage
      await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(filteredSessions));
    }
  } catch (error) {
    // Jika terjadi error, log dan throw agar caller tahu ada masalah
    console.error('Error deleting player:', error);
    throw error;
  }
};
