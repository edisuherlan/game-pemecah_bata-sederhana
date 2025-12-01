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
 * FILE: components/ui/icon-symbol.tsx
 * DESKRIPSI: Komponen wrapper untuk icon yang kompatibel cross-platform
 * 
 * Komponen ini menyediakan fallback untuk menggunakan MaterialIcons di Android dan web.
 * Di iOS, menggunakan SF Symbols native, sedangkan di Android/web menggunakan MaterialIcons.
 * Ini memastikan tampilan icon konsisten di semua platform dan penggunaan resource yang optimal.
 */

// Import MaterialIcons dari @expo/vector-icons untuk digunakan di Android dan web
// MaterialIcons adalah library icon yang kompatibel dengan React Native
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
// Import type dari expo-symbols untuk SF Symbols (iOS)
// SymbolViewProps: Props untuk komponen SF Symbol
// SymbolWeight: Tipe untuk berat/ketebalan icon SF Symbol
import { SymbolViewProps, SymbolWeight } from 'expo-symbols';
// Import ComponentProps dari React untuk mendapatkan tipe props dari komponen
import { ComponentProps } from 'react';
// Import type dari React Native untuk styling dan color
// OpaqueColorValue: Tipe untuk nilai warna yang tidak transparan
// StyleProp: Tipe untuk style properties
// TextStyle: Tipe untuk style teks
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

// ============================================
// TYPE DEFINITIONS
// ============================================
/**
 * Type untuk mapping SF Symbols ke MaterialIcons
 * Record berarti object dengan key bertipe SymbolViewProps['name'] (nama SF Symbol)
 * dan value bertipe ComponentProps<typeof MaterialIcons>['name'] (nama MaterialIcon)
 * Ini memastikan setiap SF Symbol memiliki pasangan MaterialIcon yang sesuai
 */
type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;

/**
 * Type untuk nama icon yang valid
 * Menggunakan keyof typeof MAPPING untuk mendapatkan semua key dari object MAPPING
 * Ini memastikan hanya nama icon yang sudah di-mapping yang bisa digunakan
 */
type IconSymbolName = keyof typeof MAPPING;

/**
 * Object mapping untuk memetakan SF Symbols (iOS) ke MaterialIcons (Android/Web)
 * 
 * Object ini berisi pasangan key-value dimana:
 * - Key: Nama SF Symbol (format yang digunakan di iOS)
 * - Value: Nama MaterialIcon yang setara (format yang digunakan di Android/Web)
 * 
 * Untuk menambahkan icon baru:
 * 1. Lihat SF Symbols di aplikasi [SF Symbols](https://developer.apple.com/sf-symbols/)
 * 2. Lihat Material Icons di [Icons Directory](https://icons.expo.fyi)
 * 3. Tambahkan pasangan key-value baru di object ini
 * 
 * Format: 'sf-symbol-name': 'material-icon-name'
 */
const MAPPING = {
  // Icon rumah/home untuk navigasi utama
  'house.fill': 'home',
  
  // Icon pesawat kertas untuk mengirim/pesan
  'paperplane.fill': 'send',
  
  // Icon chevron dengan garis miring untuk kode/programming
  'chevron.left.forwardslash.chevron.right': 'code',
  
  // Icon chevron kanan untuk navigasi ke kanan
  'chevron.right': 'chevron-right',
  
  // Icon game controller untuk halaman game
  'gamecontroller.fill': 'sports-esports',
  
  // Icon slider horizontal untuk pengaturan/settings
  'slider.horizontal.3': 'tune',
  
  // Icon chart bar untuk leaderboard/statistik
  'chart.bar.fill': 'bar-chart',
  
  // Icon gear untuk settings (alternatif)
  'gearshape.fill': 'settings',
  
  // Icon trophy untuk penghargaan/prestasi
  'trophy.fill': 'emoji-events',
  
  // Icon info circle untuk informasi
  'info.circle.fill': 'info',
} as IconMapping;

/**
 * Komponen IconSymbol - Komponen icon yang kompatibel cross-platform
 * 
 * Komponen ini menggunakan:
 * - SF Symbols native di iOS (melalui expo-symbols)
 * - MaterialIcons di Android dan web (melalui @expo/vector-icons)
 * 
 * Keuntungan menggunakan komponen ini:
 * 1. Tampilan konsisten di semua platform
 * 2. Penggunaan resource yang optimal (native icons di iOS)
 * 3. Satu API untuk semua platform (tidak perlu conditional rendering)
 * 
 * Catatan: Nama icon menggunakan format SF Symbols dan memerlukan mapping manual ke MaterialIcons
 * 
 * @param name - Nama icon dalam format SF Symbol (harus ada di MAPPING)
 * @param size - Ukuran icon dalam piksel (default: 24)
 * @param color - Warna icon (string atau OpaqueColorValue)
 * @param style - Style tambahan untuk icon (opsional)
 * @param weight - Berat/ketebalan icon SF Symbol (opsional, untuk iOS)
 * 
 * @returns JSX.Element - Komponen MaterialIcons dengan nama yang sudah di-mapping
 * 
 * Contoh penggunaan:
 * ```tsx
 * <IconSymbol name="gamecontroller.fill" size={28} color="#4ecdc4" />
 * ```
 */
export function IconSymbol({
  name,        // Nama icon dalam format SF Symbol
  size = 24,    // Ukuran icon default 24px jika tidak ditentukan
  color,        // Warna icon (wajib)
  style,        // Style tambahan (opsional)
}: {
  name: IconSymbolName;                        // Nama icon harus ada di MAPPING
  size?: number;                               // Ukuran icon (opsional, default 24)
  color: string | OpaqueColorValue;           // Warna icon (wajib)
  style?: StyleProp<TextStyle>;                // Style tambahan (opsional)
  weight?: SymbolWeight;                       // Berat icon SF Symbol (opsional, untuk iOS)
}) {
  /**
   * Render MaterialIcons dengan:
   * - color: Warna yang diberikan sebagai prop
   * - size: Ukuran yang diberikan sebagai prop (atau default 24)
   * - name: Nama MaterialIcon yang diambil dari MAPPING berdasarkan nama SF Symbol
   * - style: Style tambahan yang diberikan sebagai prop (jika ada)
   * 
   * MAPPING[name] akan mencari nama MaterialIcon yang sesuai dengan SF Symbol name
   * Jika name tidak ada di MAPPING, TypeScript akan memberikan error saat compile time
   */
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
