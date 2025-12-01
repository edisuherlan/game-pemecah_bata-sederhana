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
 * FILE: app/(tabs)/settings.tsx
 * DESKRIPSI: Halaman pengaturan game
 * 
 * Halaman ini menampilkan opsi pengaturan tingkat kesulitan game.
 * Pemain dapat memilih antara Mudah, Sedang, atau Sulit yang akan
 * mempengaruhi kecepatan bola dalam permainan.
 */

// Import AsyncStorage untuk penyimpanan data lokal yang persisten
// AsyncStorage digunakan untuk menyimpan pengaturan game agar tetap tersimpan meskipun app ditutup
import AsyncStorage from '@react-native-async-storage/async-storage';
// Import StatusBar untuk mengatur tampilan status bar di perangkat
import { StatusBar } from 'expo-status-bar';
// Import React dan hooks untuk state management dan side effects
import React, { useEffect, useState } from 'react';
// Import komponen React Native untuk UI
import {
  ScrollView, // Komponen untuk scrollable content
  StyleSheet, // Untuk membuat style sheet
  Text, // Komponen untuk menampilkan teks
  TouchableOpacity, // Komponen button yang bisa ditekan
  View, // Komponen container/view
} from 'react-native';
// Import hook untuk mendapatkan safe area insets (untuk notch/status bar)
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ============================================
// KONSTANTA
// ============================================
/**
 * Key untuk menyimpan pengaturan di AsyncStorage
 * Key ini digunakan sebagai identifier untuk menyimpan dan mengambil data pengaturan
 * Format '@app_name:data_type' adalah konvensi untuk menghindari konflik dengan app lain
 */
const SETTINGS_KEY = '@pemecah_bata:settings';

// ============================================
// TIPE DATA
// ============================================
/**
 * Tipe data untuk tingkat kesulitan game
 * Union type yang membatasi nilai hanya pada 'easy', 'medium', atau 'hard'
 * Tipe ini diekspor agar bisa digunakan di file lain (misalnya di index.tsx)
 */
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

/**
 * Interface untuk struktur data pengaturan game
 * Interface ini mendefinisikan format data yang disimpan di AsyncStorage
 */
interface GameSettings {
  difficulty: DifficultyLevel;  // Tingkat kesulitan yang dipilih user
  ballSpeed: number;             // Kecepatan bola sesuai dengan tingkat kesulitan yang dipilih
}

// ============================================
// KONFIGURASI TINGKAT KESULITAN
// ============================================
/**
 * Konfigurasi untuk setiap tingkat kesulitan
 * 
 * Object ini berisi mapping antara tingkat kesulitan dengan:
 * - label: Nama yang ditampilkan ke user (bahasa Indonesia)
 * - speed: Kecepatan bola dalam permainan (semakin tinggi semakin cepat)
 * - description: Deskripsi singkat tentang tingkat kesulitan
 * 
 * Record<DifficultyLevel, ...> memastikan semua tingkat kesulitan memiliki konfigurasi
 */
const DIFFICULTY_CONFIGS: Record<DifficultyLevel, { label: string; speed: number; description: string }> = {
  // Tingkat kesulitan mudah: kecepatan bola 4 (paling lambat)
  easy: {
    label: 'Mudah',                                    // Label yang ditampilkan
    speed: 4,                                         // Kecepatan bola: 4 (lambat)
    description: 'Bola bergerak lebih lambat, cocok untuk pemula', // Deskripsi untuk user
  },
  // Tingkat kesulitan sedang: kecepatan bola 6 (standar/default)
  medium: {
    label: 'Sedang',                                  // Label yang ditampilkan
    speed: 6,                                         // Kecepatan bola: 6 (standar)
    description: 'Kecepatan bola standar, cocok untuk pemain biasa', // Deskripsi untuk user
  },
  // Tingkat kesulitan sulit: kecepatan bola 8 (paling cepat)
  hard: {
    label: 'Sulit',                                   // Label yang ditampilkan
    speed: 8,                                         // Kecepatan bola: 8 (cepat)
    description: 'Bola bergerak cepat, cocok untuk pemain berpengalaman', // Deskripsi untuk user
  },
};

/**
 * Komponen SettingsScreen - Halaman pengaturan game
 * 
 * Halaman ini memungkinkan user untuk:
 * - Memilih tingkat kesulitan game (Mudah, Sedang, Sulit)
 * - Melihat kecepatan bola untuk setiap tingkat kesulitan
 * - Menyimpan pengaturan yang dipilih secara persisten
 * 
 * Pengaturan yang dipilih akan mempengaruhi kecepatan bola dalam permainan.
 * Pengaturan disimpan di AsyncStorage agar tetap tersimpan meskipun app ditutup.
 * 
 * @returns JSX.Element - Komponen halaman pengaturan dengan opsi tingkat kesulitan
 */
export default function SettingsScreen() {
  // ============================================
  // HOOKS
  // ============================================
  /**
   * Hook untuk mendapatkan safe area insets
   * insets.top memberikan tinggi area yang aman dari atas (untuk notch/status bar)
   * Digunakan untuk padding top agar konten tidak tertutup oleh notch atau status bar
   */
  const insets = useSafeAreaInsets();
  
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  /**
   * State untuk menyimpan tingkat kesulitan yang sedang dipilih user
   * Default value: 'medium' (sedang)
   * State ini akan diupdate saat user memilih tingkat kesulitan baru
   */
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('medium');
  
  /**
   * State untuk status loading saat memuat pengaturan dari storage
   * Default value: true (loading saat pertama kali mount)
   * Set ke false setelah pengaturan berhasil dimuat atau tidak ada pengaturan tersimpan
   */
  const [loading, setLoading] = useState(true);

  // ============================================
  // EFFECT UNTUK MEMUAT PENGATURAN SAAT MOUNT
  // ============================================
  /**
   * Effect yang dijalankan sekali saat komponen pertama kali dimuat
   * Memanggil loadSettings untuk memuat pengaturan yang tersimpan dari AsyncStorage
   * 
   * Dependencies: [] (array kosong) berarti effect hanya dijalankan sekali saat mount
   */
  useEffect(() => {
    loadSettings();
  }, []);

  // ============================================
  // FUNGSI UNTUK MEMUAT PENGATURAN
  // ============================================
  /**
   * Fungsi untuk memuat pengaturan dari AsyncStorage
   * 
   * Fungsi ini:
   * 1. Mengambil data pengaturan dari AsyncStorage menggunakan SETTINGS_KEY
   * 2. Parse data dari JSON string ke object GameSettings
   * 3. Update state selectedDifficulty dengan tingkat kesulitan yang tersimpan
   * 4. Set loading ke false setelah selesai (baik berhasil atau tidak)
   * 
   * Jika tidak ada pengaturan tersimpan, menggunakan default 'medium'
   * 
   * @returns Promise<void> - Tidak mengembalikan nilai
   */
  const loadSettings = async () => {
    try {
      // Ambil data pengaturan dari AsyncStorage
      const settingsData = await AsyncStorage.getItem(SETTINGS_KEY);
      
      // Jika ada data yang tersimpan
      if (settingsData) {
        // Parse data dari JSON string ke object GameSettings
        const settings: GameSettings = JSON.parse(settingsData);
        
        // Update state dengan tingkat kesulitan yang tersimpan
        setSelectedDifficulty(settings.difficulty);
      }
      // Jika tidak ada data, state tetap menggunakan default 'medium'
    } catch (error) {
      // Jika terjadi error saat memuat, log error ke console
      console.error('Error loading settings:', error);
      // State tetap menggunakan default 'medium'
    } finally {
      // Set loading ke false setelah selesai (baik berhasil atau tidak)
      // Ini memastikan loading screen tidak muncul selamanya
      setLoading(false);
    }
  };

  // ============================================
  // FUNGSI UNTUK MENYIMPAN PENGATURAN
  // ============================================
  /**
   * Fungsi untuk menyimpan pengaturan ke AsyncStorage
   * 
   * Fungsi ini:
   * 1. Membuat object GameSettings dengan tingkat kesulitan dan kecepatan bola
   * 2. Mengambil kecepatan bola dari DIFFICULTY_CONFIGS berdasarkan tingkat kesulitan
   * 3. Menyimpan ke AsyncStorage sebagai JSON string
   * 4. Update state selectedDifficulty untuk UI update
   * 
   * @param difficulty - Tingkat kesulitan yang akan disimpan ('easy', 'medium', atau 'hard')
   * @returns Promise<void> - Tidak mengembalikan nilai
   */
  const saveSettings = async (difficulty: DifficultyLevel) => {
    try {
      // Buat object pengaturan dengan tingkat kesulitan dan kecepatan bola yang sesuai
      const settings: GameSettings = {
        difficulty,                                    // Tingkat kesulitan yang dipilih
        ballSpeed: DIFFICULTY_CONFIGS[difficulty].speed, // Ambil kecepatan dari konfigurasi
      };
      
      // Simpan ke AsyncStorage sebagai JSON string
      // AsyncStorage hanya bisa menyimpan string, jadi perlu stringify dulu
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      
      // Update state untuk UI update (menampilkan checkmark, dll)
      setSelectedDifficulty(difficulty);
      
      // Log untuk debugging
      console.log('Settings saved:', settings);
    } catch (error) {
      // Jika terjadi error saat menyimpan, log error dan tampilkan alert ke user
      console.error('Error saving settings:', error);
      alert('Gagal menyimpan pengaturan');
    }
  };

  // ============================================
  // EVENT HANDLER
  // ============================================
  /**
   * Handler saat user mengubah tingkat kesulitan
   * 
   * Fungsi ini dipanggil ketika user menekan salah satu card tingkat kesulitan
   * Memanggil saveSettings untuk menyimpan pengaturan baru ke AsyncStorage
   * 
   * @param difficulty - Tingkat kesulitan yang dipilih user
   */
  const handleDifficultyChange = (difficulty: DifficultyLevel) => {
    // Simpan pengaturan baru ke AsyncStorage
    saveSettings(difficulty);
  };

  // ============================================
  // RENDER LOADING STATE
  // ============================================
  /**
   * Render loading screen saat pengaturan sedang dimuat
   * Ditampilkan saat pertama kali komponen mount dan sedang memuat pengaturan dari storage
   */
  if (loading) {
    return (
      /* Container utama dengan padding top untuk safe area */
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Status bar dengan style light (teks putih) */}
        <StatusBar style="light" />
        {/* Container untuk menampilkan teks loading di tengah */}
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Memuat pengaturan...</Text>
        </View>
      </View>
    );
  }

  // ============================================
  // RENDER MAIN UI
  // ============================================
  /**
   * Render utama halaman pengaturan
   * Menampilkan semua opsi tingkat kesulitan dan informasi
   */
  return (
    /* Container utama dengan padding top untuk safe area */
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Status bar dengan style light (teks putih) untuk kontras dengan background gelap */}
      <StatusBar style="light" />
      
      {/* ============================================
          HEADER SECTION
          ============================================ */}
      {/* Header dengan judul halaman */}
      <View style={styles.header}>
        <Text style={styles.title}>Pengaturan Game</Text>
      </View>

      {/* ============================================
          SCROLLABLE CONTENT
          ============================================ */}
      {/* ScrollView untuk konten yang bisa di-scroll jika terlalu panjang */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* ============================================
            SECTION: TINGKAT KESULITAN
            ============================================ */}
        {/* Section untuk menampilkan opsi tingkat kesulitan */}
        <View style={styles.section}>
          {/* Judul section */}
          <Text style={styles.sectionTitle}>Tingkat Kesulitan</Text>
          
          {/* Deskripsi section yang menjelaskan apa itu tingkat kesulitan */}
          <Text style={styles.sectionDescription}>
            Pilih tingkat kesulitan yang sesuai dengan kemampuan Anda. 
            Tingkat kesulitan mempengaruhi kecepatan bola dalam permainan.
          </Text>

          {/* ============================================
              RENDER SETIAP OPSI TINGKAT KESULITAN
              ============================================ */}
          {/* Map setiap konfigurasi kesulitan menjadi card yang bisa diklik */}
          {/* Object.entries mengubah object menjadi array [key, value] */}
          {Object.entries(DIFFICULTY_CONFIGS).map(([key, config]) => {
            // Convert key menjadi DifficultyLevel type
            const difficulty = key as DifficultyLevel;
            
            // Cek apakah tingkat kesulitan ini yang sedang dipilih
            const isSelected = selectedDifficulty === difficulty;

            // Render card untuk setiap tingkat kesulitan
            return (
              <TouchableOpacity
                key={key}  // Key unik untuk React reconciliation
                style={[
                  styles.difficultyCard,                    // Style dasar card
                  isSelected && styles.difficultyCardSelected, // Style tambahan jika dipilih
                ]}
                onPress={() => handleDifficultyChange(difficulty)} // Handler saat card ditekan
              >
                {/* Header card dengan label dan checkmark */}
                <View style={styles.difficultyHeader}>
                  {/* Container untuk informasi kesulitan */}
                  <View style={styles.difficultyInfo}>
                    {/* Label tingkat kesulitan (Mudah, Sedang, Sulit) */}
                    <Text style={[
                      styles.difficultyLabel,                    // Style dasar label
                      isSelected && styles.difficultyLabelSelected, // Style tambahan jika dipilih
                    ]}>
                      {config.label}
                    </Text>
                    {/* Teks kecepatan bola */}
                    <Text style={styles.difficultySpeed}>
                      Kecepatan Bola: {config.speed}
                    </Text>
                  </View>
                  
                  {/* Checkmark hanya ditampilkan jika tingkat kesulitan ini dipilih */}
                  {isSelected && (
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </View>
                
                {/* Deskripsi tingkat kesulitan */}
                <Text style={[
                  styles.difficultyDescription,                    // Style dasar deskripsi
                  isSelected && styles.difficultyDescriptionSelected, // Style tambahan jika dipilih
                ]}>
                  {config.description}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ============================================
            SECTION: INFORMASI
            ============================================ */}
        {/* Section untuk menampilkan informasi tentang pengaturan */}
        <View style={styles.infoSection}>
          {/* Judul section informasi */}
          <Text style={styles.infoTitle}>ℹ️ Informasi</Text>
          
          {/* Teks informasi tentang pengaturan */}
          <Text style={styles.infoText}>
            • Pengaturan akan diterapkan pada permainan berikutnya{'\n'}
            • Skor dan statistik tidak terpengaruh oleh tingkat kesulitan{'\n'}
            • Anda dapat mengubah pengaturan kapan saja
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

/**
 * StyleSheet untuk semua komponen UI dalam halaman pengaturan
 * Menggunakan StyleSheet.create untuk optimasi performa React Native
 * 
 * Skema warna:
 * - Background utama: #1a1a2e (biru tua gelap)
 * - Background card: #2a2a3e (biru tua lebih terang)
 * - Background card selected: #3a3a4e (biru tua lebih terang lagi)
 * - Warna accent: #4ecdc4 (cyan/hijau muda)
 * - Teks utama: #fff (putih)
 * - Teks sekunder: #ccc, #999, #666 (abu-abu dengan berbagai tingkat)
 */
const styles = StyleSheet.create({
  // ============================================
  // STYLE UNTUK CONTAINER UTAMA
  // ============================================
  /**
   * Style untuk container utama halaman
   */
  container: {
    flex: 1,                      // Mengisi seluruh ruang yang tersedia
    backgroundColor: '#1a1a2e',  // Background warna biru tua gelap (sama dengan halaman lain)
  },
  
  // ============================================
  // STYLE UNTUK HEADER
  // ============================================
  /**
   * Style untuk header halaman
   */
  header: {
    paddingHorizontal: 20,        // Padding horizontal 20px
    paddingVertical: 15,          // Padding vertikal 15px
    borderBottomWidth: 1,         // Ketebalan border bawah 1px
    borderBottomColor: '#333',     // Warna border abu-abu gelap
  },
  
  /**
   * Style untuk judul header
   */
  title: {
    fontSize: 24,                 // Ukuran font 24px (cukup besar untuk header)
    fontWeight: 'bold',           // Teks tebal untuk emphasis
    color: '#fff',                // Warna putih untuk kontras dengan background gelap
  },
  
  // ============================================
  // STYLE UNTUK LOADING STATE
  // ============================================
  /**
   * Style untuk container loading (tengah layar)
   */
  centerContainer: {
    flex: 1,                      // Mengisi seluruh ruang yang tersedia
    justifyContent: 'center',     // Tengahkan konten secara vertikal
    alignItems: 'center',         // Tengahkan konten secara horizontal
  },
  
  /**
   * Style untuk teks loading
   */
  loadingText: {
    color: '#fff',                // Warna putih
    fontSize: 16,                 // Ukuran font 16px
  },
  
  // ============================================
  // STYLE UNTUK SCROLLVIEW
  // ============================================
  /**
   * Style untuk ScrollView container
   */
  scrollView: {
    flex: 1,                      // Mengisi ruang yang tersedia setelah header
  },
  
  /**
   * Style untuk konten di dalam ScrollView
   */
  scrollContent: {
    padding: 20,                   // Padding 20px di semua sisi untuk spacing
  },
  
  // ============================================
  // STYLE UNTUK SECTION
  // ============================================
  /**
   * Style untuk setiap section dalam halaman
   */
  section: {
    marginBottom: 30,             // Jarak bawah 30px untuk spacing antar section
  },
  
  /**
   * Style untuk judul section
   */
  sectionTitle: {
    fontSize: 20,                 // Ukuran font 20px
    fontWeight: 'bold',           // Teks tebal
    color: '#fff',                // Warna putih
    marginBottom: 10,             // Jarak bawah 10px
  },
  
  /**
   * Style untuk deskripsi section
   */
  sectionDescription: {
    fontSize: 14,                 // Ukuran font 14px (ukuran standar untuk paragraf)
    color: '#999',                // Warna abu-abu terang
    marginBottom: 20,             // Jarak bawah 20px
    lineHeight: 20,               // Tinggi baris 20px untuk spacing yang nyaman
  },
  
  // ============================================
  // STYLE UNTUK CARD TINGKAT KESULITAN
  // ============================================
  /**
   * Style dasar untuk card tingkat kesulitan
   */
  difficultyCard: {
    backgroundColor: '#2a2a3e',   // Background biru tua lebih terang dari background utama
    borderRadius: 12,             // Border radius 12px untuk sudut melengkung
    padding: 20,                  // Padding 20px di semua sisi
    marginBottom: 15,             // Jarak bawah 15px antar card
    borderWidth: 2,               // Ketebalan border 2px
    borderColor: 'transparent',   // Border transparan (tidak terlihat) saat tidak dipilih
  },
  
  /**
   * Style tambahan untuk card yang dipilih
   * Style ini digabungkan dengan difficultyCard saat card dipilih
   */
  difficultyCardSelected: {
    backgroundColor: '#3a3a4e',   // Background lebih terang untuk menunjukkan dipilih
    borderColor: '#4ecdc4',       // Border warna cyan untuk highlight
  },
  
  /**
   * Style untuk header card (label dan checkmark)
   */
  difficultyHeader: {
    flexDirection: 'row',         // Layout horizontal
    justifyContent: 'space-between', // Space between untuk memisahkan label dan checkmark
    alignItems: 'center',         // Align items di tengah secara vertikal
    marginBottom: 10,             // Jarak bawah 10px
  },
  
  /**
   * Style untuk container informasi kesulitan (label dan speed)
   */
  difficultyInfo: {
    flex: 1,                      // Mengisi ruang yang tersedia
  },
  
  /**
   * Style untuk label tingkat kesulitan (Mudah, Sedang, Sulit)
   */
  difficultyLabel: {
    fontSize: 18,                 // Ukuran font 18px (cukup besar untuk label)
    fontWeight: 'bold',           // Teks tebal
    color: '#fff',                // Warna putih
    marginBottom: 5,              // Jarak bawah 5px
  },
  
  /**
   * Style tambahan untuk label yang dipilih
   */
  difficultyLabelSelected: {
    color: '#4ecdc4',             // Warna cyan untuk menunjukkan dipilih
  },
  
  /**
   * Style untuk teks kecepatan bola
   */
  difficultySpeed: {
    fontSize: 14,                 // Ukuran font 14px
    color: '#999',                // Warna abu-abu terang
  },
  
  /**
   * Style untuk checkmark (tanda centang)
   */
  checkmark: {
    width: 30,                    // Lebar 30px
    height: 30,                   // Tinggi 30px
    borderRadius: 15,             // Border radius setengah ukuran untuk membuat lingkaran
    backgroundColor: '#4ecdc4',   // Background warna cyan
    justifyContent: 'center',     // Tengahkan konten secara vertikal
    alignItems: 'center',          // Tengahkan konten secara horizontal
  },
  
  /**
   * Style untuk teks checkmark (simbol ✓)
   */
  checkmarkText: {
    color: '#fff',                // Warna putih untuk kontras dengan background cyan
    fontSize: 18,                 // Ukuran font 18px
    fontWeight: 'bold',           // Teks tebal
  },
  
  /**
   * Style untuk deskripsi tingkat kesulitan
   */
  difficultyDescription: {
    fontSize: 14,                 // Ukuran font 14px
    color: '#999',               // Warna abu-abu terang
    lineHeight: 20,              // Tinggi baris 20px untuk spacing yang nyaman
  },
  
  /**
   * Style tambahan untuk deskripsi yang dipilih
   */
  difficultyDescriptionSelected: {
    color: '#ccc',                // Warna abu-abu lebih terang untuk menunjukkan dipilih
  },
  
  // ============================================
  // STYLE UNTUK SECTION INFORMASI
  // ============================================
  /**
   * Style untuk section informasi
   */
  infoSection: {
    backgroundColor: '#2a2a3e',   // Background biru tua lebih terang
    borderRadius: 12,             // Border radius 12px untuk sudut melengkung
    padding: 20,                  // Padding 20px di semua sisi
    marginTop: 20,                // Jarak atas 20px dari section sebelumnya
  },
  
  /**
   * Style untuk judul informasi
   */
  infoTitle: {
    fontSize: 16,                 // Ukuran font 16px
    fontWeight: 'bold',           // Teks tebal
    color: '#4ecdc4',             // Warna cyan (brand color)
    marginBottom: 10,              // Jarak bawah 10px
  },
  
  /**
   * Style untuk teks informasi
   */
  infoText: {
    fontSize: 14,                 // Ukuran font 14px
    color: '#999',                // Warna abu-abu terang
    lineHeight: 22,               // Tinggi baris 22px untuk spacing yang nyaman
  },
});

