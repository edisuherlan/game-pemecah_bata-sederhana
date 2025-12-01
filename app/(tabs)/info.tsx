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
 * FILE: app/(tabs)/info.tsx
 * DESKRIPSI: Halaman informasi developer dan aplikasi
 * 
 * Halaman ini menampilkan informasi tentang developer game dan fitur-fitur aplikasi.
 * Menyediakan link email dan GitHub yang dapat diklik.
 */

// Import MaterialIcons dari @expo/vector-icons untuk menampilkan icon di halaman
import { MaterialIcons } from '@expo/vector-icons';
// Import StatusBar dari expo-status-bar untuk mengatur tampilan status bar
import { StatusBar } from 'expo-status-bar';
// Import React untuk membuat komponen
import React from 'react';
// Import komponen React Native untuk UI dan navigasi
import {
  Linking, // Untuk membuka URL eksternal (email, browser, dll)
  ScrollView, // Komponen untuk scrollable content
  StyleSheet, // Untuk membuat style sheet
  Text, // Komponen untuk menampilkan teks
  TouchableOpacity, // Komponen button yang bisa ditekan
  View, // Komponen container/view
} from 'react-native';
// Import hook untuk mendapatkan safe area insets (untuk notch/status bar)
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Komponen InfoScreen - Halaman informasi developer dan aplikasi
 * 
 * Halaman ini menampilkan:
 * - Informasi tentang game (judul, deskripsi)
 * - Informasi developer (nama, email, GitHub)
 * - Fitur-fitur aplikasi
 * - Footer dengan copyright
 * 
 * Fitur interaktif:
 * - Email dapat diklik untuk membuka email client
 * - GitHub dapat diklik untuk membuka profil GitHub di browser
 * 
 * @returns JSX.Element - Komponen halaman info dengan semua informasi developer dan aplikasi
 */
export default function InfoScreen() {
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
  // EVENT HANDLERS
  // ============================================
  /**
   * Handler untuk membuka aplikasi email saat email diklik
   * 
   * Fungsi ini menggunakan Linking.openURL dengan protocol 'mailto:' untuk:
   * - Membuka aplikasi email default di perangkat
   * - Pre-fill alamat email developer
   * - Memungkinkan user langsung mengirim email tanpa copy-paste
   * 
   * Protocol 'mailto:' adalah standar untuk membuka email client
   */
  const handleEmailPress = () => {
    // Membuka email client dengan alamat email developer yang sudah diisi
    Linking.openURL('mailto:edisuherlan@gmail.com');
  };

  /**
   * Handler untuk membuka GitHub di browser saat GitHub diklik
   * 
   * Fungsi ini menggunakan Linking.openURL dengan URL GitHub untuk:
   * - Membuka browser default di perangkat
   * - Menampilkan profil GitHub developer
   * - Memungkinkan user melihat portfolio dan project developer
   */
  const handleGithubPress = () => {
    // Membuka profil GitHub developer di browser
    Linking.openURL('https://github.com/edisuherlan');
  };

  // ============================================
  // RENDER UI
  // ============================================
  /**
   * Render utama komponen halaman info
   * Menampilkan semua informasi developer dan aplikasi dalam layout scrollable
   */
  return (
    /* Container utama dengan padding top untuk safe area (notch/status bar) */
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Status bar dengan style light (teks putih) untuk kontras dengan background gelap */}
      <StatusBar style="light" />
      
      {/* ============================================
          HEADER SECTION
          ============================================ */}
      {/* Header dengan judul halaman */}
      <View style={styles.header}>
        <Text style={styles.title}>Tentang Game</Text>
      </View>

      {/* ============================================
          SCROLLABLE CONTENT
          ============================================ */}
      {/* ScrollView untuk konten yang bisa di-scroll jika terlalu panjang */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* ============================================
            SECTION 1: GAME INFO
            ============================================ */}
        {/* Section untuk menampilkan informasi game */}
        <View style={styles.section}>
          {/* Container untuk icon game di tengah */}
          <View style={styles.iconContainer}>
            {/* Icon game controller dengan ukuran besar (80px) */}
            <MaterialIcons name="videogame-asset" size={80} color="#4ecdc4" />
          </View>
          
          {/* Judul game dengan ukuran besar dan bold */}
          <Text style={styles.gameTitle}>Pemecah Bata</Text>
          {/* Subtitle game dengan ukuran lebih kecil dan warna abu-abu */}
          <Text style={styles.gameSubtitle}>Game Breakout Sederhana</Text>
          
          {/* Divider untuk memisahkan section */}
          <View style={styles.divider} />
        </View>

        {/* ============================================
            SECTION 2: DEVELOPER INFO
            ============================================ */}
        {/* Section untuk menampilkan informasi developer */}
        <View style={styles.section}>
          {/* Judul section dengan emoji developer */}
          <Text style={styles.sectionTitle}>👨‍💻 Developer</Text>
          
          {/* Card untuk menampilkan informasi developer */}
          <View style={styles.infoCard}>
            {/* Row untuk nama developer */}
            <View style={styles.infoRow}>
              {/* Icon person untuk nama */}
              <MaterialIcons name="person" size={24} color="#4ecdc4" />
              {/* Container untuk konten informasi */}
              <View style={styles.infoContent}>
                {/* Label untuk nama */}
                <Text style={styles.infoLabel}>Nama</Text>
                {/* Value nama developer */}
                <Text style={styles.infoValue}>Edi Suherlan</Text>
              </View>
            </View>

            {/* Row untuk email developer */}
            <View style={styles.infoRow}>
              {/* Icon email */}
              <MaterialIcons name="email" size={24} color="#4ecdc4" />
              {/* Container untuk konten informasi */}
              <View style={styles.infoContent}>
                {/* Label untuk email */}
                <Text style={styles.infoLabel}>Email</Text>
                {/* TouchableOpacity untuk membuat email bisa diklik */}
                <TouchableOpacity onPress={handleEmailPress}>
                  {/* Teks email dengan style link (warna cyan dan underline) */}
                  <Text style={[styles.infoValue, styles.linkText]}>
                    edisuherlan@gmail.com
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Row untuk GitHub developer */}
            <View style={styles.infoRow}>
              {/* Icon code untuk GitHub */}
              <MaterialIcons name="code" size={24} color="#4ecdc4" />
              {/* Container untuk konten informasi */}
              <View style={styles.infoContent}>
                {/* Label untuk GitHub */}
                <Text style={styles.infoLabel}>GitHub</Text>
                {/* TouchableOpacity untuk membuat GitHub bisa diklik */}
                <TouchableOpacity onPress={handleGithubPress}>
                  {/* Teks GitHub dengan style link (warna cyan dan underline) */}
                  <Text style={[styles.infoValue, styles.linkText]}>
                    github.com/edisuherlan
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* ============================================
            SECTION 3: APP INFO
            ============================================ */}
        {/* Section untuk menampilkan informasi tentang aplikasi */}
        <View style={styles.section}>
          {/* Judul section dengan emoji mobile */}
          <Text style={styles.sectionTitle}>📱 Tentang Aplikasi</Text>
          
          {/* Card untuk menampilkan informasi aplikasi */}
          <View style={styles.infoCard}>
            {/* Deskripsi aplikasi dengan line height yang nyaman untuk dibaca */}
            <Text style={styles.appDescription}>
              Pemecah Bata adalah game breakout sederhana yang dibuat dengan React Native dan Expo. 
              Game ini menampilkan fitur-fitur seperti leaderboard, pengaturan tingkat kesulitan, 
              dan penyimpanan data pemain secara lokal.
            </Text>
            
            {/* List fitur-fitur aplikasi */}
            <View style={styles.featureList}>
              {/* Fitur 1: Leaderboard */}
              <View style={styles.featureItem}>
                {/* Icon check circle untuk menandakan fitur tersedia */}
                <MaterialIcons name="check-circle" size={20} color="#4ecdc4" />
                {/* Teks deskripsi fitur */}
                <Text style={styles.featureText}>Leaderboard dengan database lokal</Text>
              </View>
              
              {/* Fitur 2: Pengaturan kesulitan */}
              <View style={styles.featureItem}>
                <MaterialIcons name="check-circle" size={20} color="#4ecdc4" />
                <Text style={styles.featureText}>Pengaturan tingkat kesulitan</Text>
              </View>
              
              {/* Fitur 3: Riwayat permainan */}
              <View style={styles.featureItem}>
                <MaterialIcons name="check-circle" size={20} color="#4ecdc4" />
                <Text style={styles.featureText}>Riwayat permainan pemain</Text>
              </View>
              
              {/* Fitur 4: Ganti nama pemain */}
              <View style={styles.featureItem}>
                <MaterialIcons name="check-circle" size={20} color="#4ecdc4" />
                <Text style={styles.featureText}>Ganti nama pemain</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ============================================
            FOOTER SECTION
            ============================================ */}
        {/* Footer dengan copyright dan credit */}
        <View style={styles.footer}>
          {/* Copyright text */}
          <Text style={styles.footerText}>© 2025 Edi Suherlan</Text>
          {/* Credit text dengan emoji heart */}
          <Text style={styles.footerText}>Made with ❤️ using React Native & Expo</Text>
        </View>
      </ScrollView>
    </View>
  );
}

/**
 * StyleSheet untuk semua komponen UI dalam halaman info
 * Menggunakan StyleSheet.create untuk optimasi performa React Native
 * 
 * Skema warna:
 * - Background utama: #1a1a2e (biru tua gelap)
 * - Background card: #2a2a3e (biru tua lebih terang)
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
   * Container ini membungkus semua konten halaman
   */
  container: {
    flex: 1,                      // Mengisi seluruh ruang yang tersedia
    backgroundColor: '#1a1a2e',  // Background warna biru tua gelap (sama dengan halaman game)
  },
  
  // ============================================
  // STYLE UNTUK HEADER
  // ============================================
  /**
   * Style untuk header halaman
   * Header menampilkan judul "Tentang Game"
   */
  header: {
    paddingHorizontal: 20,        // Padding horizontal 20px
    paddingVertical: 15,          // Padding vertikal 15px
    borderBottomWidth: 1,         // Ketebalan border bawah 1px
    borderBottomColor: '#333',    // Warna border abu-abu gelap
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
   * contentContainerStyle digunakan untuk styling konten yang di-scroll
   */
  scrollContent: {
    padding: 20,                  // Padding 20px di semua sisi untuk spacing
  },
  
  // ============================================
  // STYLE UNTUK SECTION
  // ============================================
  /**
   * Style untuk setiap section dalam halaman
   * Section adalah container untuk grup konten terkait
   */
  section: {
    marginBottom: 30,             // Jarak bawah 30px untuk spacing antar section
  },
  
  /**
   * Style untuk container icon game
   * Container ini menampilkan icon game di tengah
   */
  iconContainer: {
    alignItems: 'center',         // Tengahkan icon secara horizontal
    marginBottom: 20,             // Jarak bawah 20px
  },
  
  /**
   * Style untuk judul game
   */
  gameTitle: {
    fontSize: 32,                 // Ukuran font besar (32px) untuk emphasis
    fontWeight: 'bold',           // Teks tebal
    color: '#fff',                // Warna putih
    textAlign: 'center',          // Teks rata tengah
    marginBottom: 5,              // Jarak bawah 5px
  },
  
  /**
   * Style untuk subtitle game
   */
  gameSubtitle: {
    fontSize: 16,                 // Ukuran font sedang (16px)
    color: '#999',                // Warna abu-abu terang untuk kontras dengan judul
    textAlign: 'center',          // Teks rata tengah
    marginBottom: 20,             // Jarak bawah 20px
  },
  
  /**
   * Style untuk divider (garis pemisah)
   */
  divider: {
    height: 2,                    // Tinggi divider 2px
    backgroundColor: '#333',      // Warna abu-abu gelap
    marginVertical: 20,           // Margin vertikal 20px (atas dan bawah)
  },
  
  /**
   * Style untuk judul section (Developer, Tentang Aplikasi)
   */
  sectionTitle: {
    fontSize: 20,                 // Ukuran font 20px
    fontWeight: 'bold',           // Teks tebal
    color: '#fff',                // Warna putih
    marginBottom: 15,             // Jarak bawah 15px
  },
  
  // ============================================
  // STYLE UNTUK INFO CARD
  // ============================================
  /**
   * Style untuk card informasi (developer info, app info)
   * Card memberikan background yang berbeda untuk memisahkan konten
   */
  infoCard: {
    backgroundColor: '#2a2a3e',   // Background biru tua lebih terang dari background utama
    borderRadius: 12,             // Border radius 12px untuk sudut melengkung
    padding: 20,                  // Padding 20px di semua sisi
  },
  
  /**
   * Style untuk setiap row informasi (nama, email, GitHub)
   */
  infoRow: {
    flexDirection: 'row',         // Layout horizontal (icon dan konten sejajar)
    alignItems: 'center',        // Align items di tengah secara vertikal
    marginBottom: 20,            // Jarak bawah 20px antar row
  },
  
  /**
   * Style untuk container konten informasi (label dan value)
   */
  infoContent: {
    marginLeft: 15,              // Jarak kiri 15px dari icon
    flex: 1,                     // Mengisi ruang yang tersedia
  },
  
  /**
   * Style untuk label informasi (Nama, Email, GitHub)
   */
  infoLabel: {
    fontSize: 12,                // Ukuran font kecil (12px) untuk label
    color: '#999',               // Warna abu-abu terang
    marginBottom: 5,             // Jarak bawah 5px
  },
  
  /**
   * Style untuk value informasi (nilai sebenarnya)
   */
  infoValue: {
    fontSize: 16,                // Ukuran font 16px
    color: '#fff',               // Warna putih
    fontWeight: '500',           // Font weight medium (500)
  },
  
  /**
   * Style khusus untuk teks link (email dan GitHub)
   * Digabungkan dengan infoValue untuk memberikan style link
   */
  linkText: {
    color: '#4ecdc4',            // Warna cyan (brand color)
    textDecorationLine: 'underline', // Garis bawah untuk menunjukkan bisa diklik
  },
  
  // ============================================
  // STYLE UNTUK DESKRIPSI APLIKASI
  // ============================================
  /**
   * Style untuk deskripsi aplikasi
   */
  appDescription: {
    fontSize: 14,                // Ukuran font 14px (ukuran standar untuk paragraf)
    color: '#ccc',               // Warna abu-abu terang untuk readability
    lineHeight: 22,              // Tinggi baris 22px untuk spacing yang nyaman
    marginBottom: 20,            // Jarak bawah 20px
  },
  
  /**
   * Style untuk container list fitur
   */
  featureList: {
    marginTop: 10,                // Jarak atas 10px dari deskripsi
  },
  
  /**
   * Style untuk setiap item fitur
   */
  featureItem: {
    flexDirection: 'row',         // Layout horizontal (icon dan teks sejajar)
    alignItems: 'center',        // Align items di tengah secara vertikal
    marginBottom: 12,             // Jarak bawah 12px antar item
  },
  
  /**
   * Style untuk teks fitur
   */
  featureText: {
    fontSize: 14,                // Ukuran font 14px
    color: '#ccc',               // Warna abu-abu terang
    marginLeft: 10,              // Jarak kiri 10px dari icon
    flex: 1,                     // Mengisi ruang yang tersedia
  },
  
  // ============================================
  // STYLE UNTUK FOOTER
  // ============================================
  /**
   * Style untuk footer halaman
   */
  footer: {
    alignItems: 'center',        // Tengahkan konten secara horizontal
    marginTop: 20,               // Jarak atas 20px dari section terakhir
    marginBottom: 40,            // Jarak bawah 40px untuk spacing di akhir scroll
  },
  
  /**
   * Style untuk teks footer
   */
  footerText: {
    fontSize: 12,                // Ukuran font kecil (12px) untuk footer
    color: '#666',               // Warna abu-abu gelap (subtle)
    marginBottom: 5,             // Jarak bawah 5px antar baris
  },
});

