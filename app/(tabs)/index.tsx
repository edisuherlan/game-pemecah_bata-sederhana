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
 * FILE: app/(tabs)/index.tsx
 * DESKRIPSI: Halaman utama game Breakout/Pemecah Bata
 * 
 * Game ini adalah game breakout sederhana dimana pemain harus menghancurkan semua bata
 * dengan menggunakan bola yang dipantulkan oleh paddle di bagian bawah layar.
 * 
 * FITUR:
 * - Sistem level progresif dengan pola bata berbeda setiap level
 * - Leaderboard lokal untuk menyimpan skor pemain
 * - Pengaturan tingkat kesulitan (mudah, sedang, sulit)
 * - Sistem skor dan high score
 * - Fitur ganti nama pemain
 */

// Import komponen PlayerForm untuk form input nama pemain
import PlayerForm from '@/components/PlayerForm';
// Import fungsi-fungsi database untuk mengelola data pemain dan skor
import { getAllPlayers, getOrCreatePlayer, initDatabase, Player, updatePlayerName, updatePlayerScore } from '@/utils/database';
// Import AsyncStorage untuk penyimpanan data lokal yang persisten
import AsyncStorage from '@react-native-async-storage/async-storage';
// Import hook navigasi dari expo-router untuk routing antar halaman
import { useFocusEffect, useRouter } from 'expo-router';
// Import StatusBar untuk mengatur tampilan status bar di perangkat
import { StatusBar } from 'expo-status-bar';
// Import hook React untuk state management dan side effects
import React, { useCallback, useEffect, useRef, useState } from 'react';
// Import komponen React Native untuk UI dan animasi
import {
  Animated, // Untuk animasi smooth pada bola dan paddle
  Dimensions, // Untuk mendapatkan dimensi layar
  StyleSheet, // Untuk membuat style sheet
  Text, // Komponen teks
  TouchableOpacity, // Komponen button yang bisa ditekan
  View // Komponen container/view
} from 'react-native';
// Import hook untuk mendapatkan safe area insets (untuk notch/status bar)
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Mendapatkan dimensi layar untuk perhitungan posisi game
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================
// KONSTANTA GAME
// ============================================
const BALL_SIZE = 20;              // Ukuran bola dalam piksel
const PADDLE_WIDTH = 120;          // Lebar paddle dalam piksel
const PADDLE_HEIGHT = 15;          // Tinggi paddle dalam piksel
const BRICK_WIDTH = 70;            // Lebar bata dalam piksel
const BRICK_HEIGHT = 30;           // Tinggi bata dalam piksel
const BRICK_ROWS = 5;              // Jumlah baris bata untuk level 1
const BRICK_COLS = 5;              // Jumlah kolom bata untuk level 1
const BRICK_SPACING = 5;           // Jarak antar bata dalam piksel
const DEFAULT_BALL_SPEED = 6;      // Kecepatan default bola
const PADDLE_SPEED = 15;           // Kecepatan paddle saat digerakkan

// ============================================
// INTERFACE/TIPE DATA
// ============================================
/**
 * Interface untuk bata/brick
 */
interface Brick {
  id: number;           // ID unik bata
  x: number;            // Posisi X bata (dari kiri)
  y: number;            // Posisi Y bata (dari atas)
  destroyed: boolean;   // Status apakah bata sudah dihancurkan
}

// ============================================
// KOMPONEN UTAMA GAME
// ============================================
export default function BreakoutGame() {
  // Hook untuk mendapatkan safe area insets (untuk notch/status bar)
  const insets = useSafeAreaInsets();
  const router = useRouter(); // Router untuk navigasi ke halaman lain
  
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [gameStarted, setGameStarted] = useState(false);      // Status apakah game sudah dimulai
  const [gameOver, setGameOver] = useState(false);            // Status apakah game sudah berakhir
  const [gameWon, setGameWon] = useState(false);              // Status apakah pemain menang (semua bata hancur)
  const [score, setScore] = useState(0);                      // Skor saat ini
  const scoreRef = useRef(0);                                 // Ref untuk tracking skor (untuk akses di game loop)
  const [highScore, setHighScore] = useState(0);             // Skor tertinggi pemain
  const [level, setLevel] = useState(1);                      // Level saat ini
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null); // Data pemain saat ini
  const [showPlayerForm, setShowPlayerForm] = useState(true);            // Tampilkan form input nama pemain
  const [showChangeNameForm, setShowChangeNameForm] = useState(false);    // Tampilkan form ganti nama
  const [dbInitialized, setDbInitialized] = useState(false);             // Status inisialisasi database
  const [ballSpeed, setBallSpeed] = useState(DEFAULT_BALL_SPEED);         // Kecepatan bola (dari pengaturan)

  // ============================================
  // REF UNTUK POSISI DAN VELOCITY BOLA
  // ============================================
  // Animated.Value untuk animasi posisi bola (digunakan untuk rendering)
  const ballX = useRef(new Animated.Value(SCREEN_WIDTH / 2 - BALL_SIZE / 2)).current;
  const ballY = useRef(new Animated.Value(SCREEN_HEIGHT * 0.6)).current;
  
  // Ref untuk posisi aktual bola (digunakan untuk perhitungan collision)
  const ballXPos = useRef(SCREEN_WIDTH / 2 - BALL_SIZE / 2);
  const ballYPos = useRef(SCREEN_HEIGHT * 0.6);
  
  // Ref untuk velocity (kecepatan) bola
  const velocityX = useRef(DEFAULT_BALL_SPEED);  // Kecepatan horizontal
  const velocityY = useRef(-DEFAULT_BALL_SPEED); // Kecepatan vertikal (negatif = ke atas)

  // ============================================
  // REF UNTUK POSISI PADDLE
  // ============================================
  // Animated.Value untuk animasi posisi paddle
  const paddleX = useRef(new Animated.Value(SCREEN_WIDTH / 2 - PADDLE_WIDTH / 2)).current;
  // Ref untuk posisi aktual paddle
  const paddleXPos = useRef(SCREEN_WIDTH / 2 - PADDLE_WIDTH / 2);

  // ============================================
  // STATE UNTUK BRICKS/BATA
  // ============================================
  const [bricks, setBricks] = useState<Brick[]>([]); // Array bata yang ada di layar

  // ============================================
  // REF UNTUK GAME LOOP
  // ============================================
  const gameLoopRef = useRef<any>(null); // Ref untuk menyimpan ID game loop (untuk cancel jika perlu)

  // ============================================
  // HANDLER UNTUK KONTROL PADDLE
  // ============================================
  /**
   * Handler saat layar disentuh (touch start)
   * Jika game belum dimulai, mulai game
   */
  const handleTouchStart = (evt: any) => {
    if (!gameStarted) {
      startGame();
      return;
    }
  };

  /**
   * Handler saat jari digeser di layar (touch move)
   * Menggerakkan paddle mengikuti posisi jari
   */
  const handleTouchMove = (evt: any) => {
    // Jika game belum dimulai atau sudah berakhir, tidak lakukan apa-apa
    if (!gameStarted || gameOver) return;
    
    // Ambil posisi X dari sentuhan (relatif terhadap View)
    const touchX = evt.nativeEvent.locationX;
    
    // Validasi posisi touch
    if (touchX === undefined || touchX === null) return;
    
    // Posisikan paddle di tengah posisi sentuhan
    let newX = touchX - PADDLE_WIDTH / 2;
    
    // Batasi paddle agar tidak keluar dari batas layar
    newX = Math.max(0, Math.min(SCREEN_WIDTH - PADDLE_WIDTH, newX));
    
    // Update posisi paddle
    paddleXPos.current = newX;
    paddleX.setValue(newX);
  };

  // ============================================
  // EFFECT UNTUK INISIALISASI BRICKS SAAT LEVEL BERUBAH
  // ============================================
  /**
   * Effect yang dijalankan setiap kali level berubah
   * Menginisialisasi ulang bata dengan pola sesuai level
   */
  useEffect(() => {
    initializeBricks();
  }, [level]);

  // ============================================
  // EFFECT UNTUK INISIALISASI SAAT KOMPONEN MOUNT
  // ============================================
  /**
   * Effect yang dijalankan sekali saat komponen pertama kali dimuat
   * - Inisialisasi database
   * - Memuat pengaturan game
   */
  useEffect(() => {
    // Fungsi untuk inisialisasi database
    const initDb = async () => {
      try {
        // Tambahkan delay kecil untuk memastikan app sudah fully loaded
        await new Promise(resolve => setTimeout(resolve, 100));
        await initDatabase();
        setDbInitialized(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        // Coba lagi setelah delay jika gagal pertama kali
        setTimeout(async () => {
          try {
            await initDatabase();
            setDbInitialized(true);
          } catch (retryError) {
            console.error('Failed to initialize database on retry:', retryError);
          }
        }, 1000);
      }
    };
    initDb();
    
    // Memuat pengaturan game saat komponen mount
    loadGameSettings();
  }, []);

  /**
   * Fungsi untuk memuat pengaturan game dari AsyncStorage
   * Mengambil kecepatan bola yang telah disimpan
   */
  const loadGameSettings = async () => {
    try {
      const settingsData = await AsyncStorage.getItem('@pemecah_bata:settings');
      if (settingsData) {
        const settings = JSON.parse(settingsData);
        const newSpeed = settings.ballSpeed || DEFAULT_BALL_SPEED;
        console.log('Loading game settings, ballSpeed:', newSpeed);
        setBallSpeed(newSpeed);
      } else {
        // Pengaturan default jika belum ada yang disimpan
        setBallSpeed(DEFAULT_BALL_SPEED);
      }
    } catch (error) {
      console.error('Error loading game settings:', error);
    }
  };

  // ============================================
  // EFFECT UNTUK UPDATE VELOCITY BOLA SAAT BALLSPEED BERUBAH
  // ============================================
  /**
   * Effect yang dijalankan saat ballSpeed berubah
   * Mengupdate velocity bola agar sesuai dengan kecepatan baru
   * Hanya dijalankan jika game sedang berjalan
   */
  useEffect(() => {
    if (gameStarted && !gameOver) {
      // Hitung kecepatan saat ini dari velocity X dan Y
      const currentSpeed = Math.sqrt(velocityX.current ** 2 + velocityY.current ** 2);
      if (currentSpeed > 0) {
        // Hitung rasio kecepatan baru vs kecepatan saat ini
        const ratio = ballSpeed / currentSpeed;
        // Terapkan rasio ke velocity untuk mempertahankan arah tapi ubah kecepatan
        velocityX.current *= ratio;
        velocityY.current *= ratio;
        console.log('Updated ball velocity to match new speed:', ballSpeed, 'ratio:', ratio);
      }
    }
  }, [ballSpeed, gameStarted, gameOver]);

  // ============================================
  // EFFECT UNTUK RELOAD SETTINGS SAAT SCREEN FOCUS
  // ============================================
  /**
   * Effect yang dijalankan setiap kali screen mendapat fokus
   * Memuat ulang pengaturan game (setelah kembali dari halaman settings)
   */
  useFocusEffect(
    useCallback(() => {
      loadGameSettings();
    }, [gameStarted, gameOver])
  );

  // ============================================
  // FUNGSI UNTUK INISIALISASI BRICKS/BATA
  // ============================================
  /**
   * Fungsi untuk membuat dan mengatur posisi bata sesuai level
   * Setiap level memiliki pola bata yang berbeda:
   * - Level 1: Pola grid sederhana (5x5)
   * - Level 2: Pola piramida (bata lebih banyak di bawah)
   * - Level 3: Pola diamond (bentuk berlian)
   * - Level 4+: Pola kompleks dengan celah-celah
   */
  const initializeBricks = () => {
    const newBricks: Brick[] = [];
    
    // Pola berbeda untuk setiap level
    if (level === 1) {
      // Level 1: Pola grid sederhana (5x5)
      const totalBrickWidth = BRICK_COLS * BRICK_WIDTH + (BRICK_COLS - 1) * BRICK_SPACING;
      const startX = (SCREEN_WIDTH - totalBrickWidth) / 2; // Posisi X awal agar bata berada di tengah
      const startY = 100 + insets.top; // Posisi Y awal (dari atas)

      // Buat bata dalam pola grid
      for (let row = 0; row < BRICK_ROWS; row++) {
        for (let col = 0; col < BRICK_COLS; col++) {
          newBricks.push({
            id: row * BRICK_COLS + col, // ID unik berdasarkan posisi
            x: startX + col * (BRICK_WIDTH + BRICK_SPACING), // Posisi X setiap bata
            y: startY + row * (BRICK_HEIGHT + BRICK_SPACING), // Posisi Y setiap bata
            destroyed: false, // Status awal: belum dihancurkan
          });
        }
      }
    } else if (level === 2) {
      // Level 2: Pola piramida (lebih sulit - lebih banyak bata di bawah)
      const cols = 6;
      const rows = 5;
      const totalBrickWidth = cols * BRICK_WIDTH + (cols - 1) * BRICK_SPACING;
      const startX = (SCREEN_WIDTH - totalBrickWidth) / 2;
      const startY = 100 + insets.top;

      for (let row = 0; row < rows; row++) {
        const bricksInRow = cols - row; // Jumlah bata berkurang setiap baris (membentuk piramida)
        const rowWidth = bricksInRow * BRICK_WIDTH + (bricksInRow - 1) * BRICK_SPACING;
        const rowStartX = startX + (cols - bricksInRow) * (BRICK_WIDTH + BRICK_SPACING) / 2; // Tengahkan baris
        
        for (let col = 0; col < bricksInRow; col++) {
          newBricks.push({
            id: row * 100 + col,
            x: rowStartX + col * (BRICK_WIDTH + BRICK_SPACING),
            y: startY + row * (BRICK_HEIGHT + BRICK_SPACING),
            destroyed: false,
          });
        }
      }
    } else if (level === 3) {
      // Level 3: Pola diamond/berlian (lebih sulit)
      const cols = 7;
      const rows = 6;
      const totalBrickWidth = cols * BRICK_WIDTH + (cols - 1) * BRICK_SPACING;
      const startX = (SCREEN_WIDTH - totalBrickWidth) / 2;
      const startY = 100 + insets.top;

      for (let row = 0; row < rows; row++) {
        const center = Math.floor(cols / 2); // Titik tengah
        const distanceFromCenter = Math.abs(row - Math.floor(rows / 2)); // Jarak dari tengah
        const bricksInRow = cols - distanceFromCenter * 2; // Jumlah bata berkurang dari tengah
        const rowStartX = startX + distanceFromCenter * (BRICK_WIDTH + BRICK_SPACING); // Offset untuk tengahkan
        
        for (let col = 0; col < bricksInRow; col++) {
          newBricks.push({
            id: row * 100 + col,
            x: rowStartX + col * (BRICK_WIDTH + BRICK_SPACING),
            y: startY + row * (BRICK_HEIGHT + BRICK_SPACING),
            destroyed: false,
          });
        }
      }
    } else {
      // Level 4+: Pola kompleks dengan celah-celah (paling sulit)
      const cols = 8;
      const rows = 6;
      const totalBrickWidth = cols * BRICK_WIDTH + (cols - 1) * BRICK_SPACING;
      const startX = (SCREEN_WIDTH - totalBrickWidth) / 2;
      const startY = 100 + insets.top;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          // Buat pola dengan celah - skip beberapa bata untuk membuat lebih sulit
          const skipPattern = (row + col) % 3 === 0 || (row % 2 === 0 && col % 2 === 0);
          if (!skipPattern) {
            newBricks.push({
              id: row * 100 + col,
              x: startX + col * (BRICK_WIDTH + BRICK_SPACING),
              y: startY + row * (BRICK_HEIGHT + BRICK_SPACING),
              destroyed: false,
            });
          }
        }
      }
    }

    // Simpan bata ke state
    setBricks(newBricks);
  };

  /**
   * Handler untuk submit form nama pemain
   * Fungsi ini dipanggil ketika user memasukkan nama di form awal
   * @param name - Nama pemain yang dimasukkan
   * 
   * Proses:
   * 1. Pastikan database sudah diinisialisasi
   * 2. Cari pemain dengan nama tersebut atau buat baru jika belum ada
   * 3. Set pemain sebagai current player
   * 4. Sembunyikan form dan tampilkan game
   * 5. Load high score pemain tersebut
   */
  const handlePlayerSubmit = async (name: string) => {
    try {
      console.log('handlePlayerSubmit called with name:', name);
      
      // Pastikan database sudah diinisialisasi sebelum melakukan operasi
      // Jika belum, inisialisasi terlebih dahulu
      if (!dbInitialized) {
        console.log('Initializing database...');
        await initDatabase();
        setDbInitialized(true);
      }
      
      console.log('Getting or creating player...');
      // Ambil pemain yang sudah ada dengan nama tersebut atau buat baru jika belum ada
      // Fungsi ini akan mengembalikan player object yang sudah ada atau yang baru dibuat
      const player = await getOrCreatePlayer(name);
      console.log('Player received:', player);
      
      // Set pemain saat ini sebagai current player untuk digunakan di seluruh game
      setCurrentPlayer(player);
      // Sembunyikan form input nama karena sudah ada pemain
      setShowPlayerForm(false);
      // Set high score pemain untuk ditampilkan di layar
      setHighScore(player.highScore);
      
      // Verifikasi pemain sudah tersimpan dengan benar di database
      // Ini untuk debugging dan memastikan data tersimpan
      const allPlayers = await getAllPlayers();
      console.log('All players after creation:', allPlayers.length, allPlayers);
    } catch (error) {
      // Jika terjadi error, log ke console dan tampilkan pesan error ke user
      console.error('Error creating/getting player:', error);
      alert('Gagal memuat database. Silakan coba lagi.');
    }
  };

  /**
   * Handler untuk mengganti nama pemain
   * Fungsi ini dipanggil ketika user ingin mengubah nama mereka
   * @param newName - Nama baru yang ingin digunakan
   * 
   * Proses:
   * 1. Validasi bahwa ada current player
   * 2. Update nama di database menggunakan ID pemain
   * 3. Update state current player dengan data terbaru
   * 4. Sembunyikan form ganti nama
   * 5. Tampilkan konfirmasi sukses
   */
  const handleChangeName = async (newName: string) => {
    // Jika tidak ada current player, tidak lakukan apa-apa
    if (!currentPlayer) return;
    
    try {
      // Update nama pemain di database menggunakan ID pemain saat ini
      // Fungsi ini akan memvalidasi nama tidak duplikat dan mengembalikan player yang sudah diupdate
      const updatedPlayer = await updatePlayerName(currentPlayer.id, newName);
      // Update state dengan data pemain yang sudah diupdate
      setCurrentPlayer(updatedPlayer);
      // Sembunyikan form ganti nama karena proses sudah selesai
      setShowChangeNameForm(false);
      // Tampilkan konfirmasi bahwa nama berhasil diubah
      alert('Nama berhasil diubah!');
    } catch (error: any) {
      // Jika terjadi error, log ke console
      console.error('Error changing name:', error);
      // Tampilkan pesan error ke user (bisa dari error message atau pesan default)
      alert(error.message || 'Gagal mengubah nama. Silakan coba lagi.');
    }
  };

  // ============================================
  // FUNGSI UNTUK MEMULAI GAME
  // ============================================
  /**
   * Fungsi untuk memulai game baru
   * @param resetToLevel1 - Jika true, reset ke level 1. Jika false, lanjut dari level terakhir
   */
  const startGame = (resetToLevel1: boolean = true) => {
    if (!currentPlayer) {
      setShowPlayerForm(true);
      return;
    }
    
    setGameStarted(true);
    setGameOver(false);
    setGameWon(false);
    setScore(0);
    scoreRef.current = 0;
    
    // Reset level to 1 if requested (default is true for new game)
    if (resetToLevel1) {
      setLevel(1);
    }
    
    // Reset ball position
    const startX = SCREEN_WIDTH / 2 - BALL_SIZE / 2;
    const startY = SCREEN_HEIGHT * 0.6;
    ballXPos.current = startX;
    ballYPos.current = startY;
    ballX.setValue(startX);
    ballY.setValue(startY);
    
    // Random initial direction
    velocityX.current = (Math.random() > 0.5 ? 1 : -1) * ballSpeed;
    velocityY.current = -ballSpeed;
    
    // Reset paddle position
    const paddleStartX = SCREEN_WIDTH / 2 - PADDLE_WIDTH / 2;
    paddleXPos.current = paddleStartX;
    paddleX.setValue(paddleStartX);
    
    // Initialize bricks
    initializeBricks();
    
    gameLoop();
  };

  /**
   * Fungsi helper untuk memulai game dari level 1
   * Fungsi ini dipanggil dari tombol "Mulai dari Level 1" di modal game over
   * Memanggil startGame dengan parameter resetToLevel1 = true
   */
  const startFromLevel1 = () => {
    startGame(true);
  };

  /**
   * Fungsi untuk mengecek semua collision yang terjadi dalam game
   * Fungsi ini mengecek collision antara bola dengan:
   * 1. Dinding kiri dan kanan
   * 2. Dinding atas
   * 3. Paddle (papan pemantul)
   * 4. Bata/brick
   * 
   * Fungsi ini juga mengecek kondisi game over dan level complete
   */
  const checkCollisions = () => {
    // Hitung posisi bounding box bola untuk collision detection
    // Menggunakan posisi aktual dari ref, bukan dari animated value
    const ballLeft = ballXPos.current;                    // Posisi X kiri bola
    const ballRight = ballXPos.current + BALL_SIZE;       // Posisi X kanan bola
    const ballTop = ballYPos.current;                    // Posisi Y atas bola
    const ballBottom = ballYPos.current + BALL_SIZE;     // Posisi Y bawah bola

    // ============================================
    // COLLISION DENGAN DINDING KIRI DAN KANAN
    // ============================================
    // Jika bola menyentuh dinding kiri (ballLeft <= 0) atau dinding kanan (ballRight >= SCREEN_WIDTH)
    if (ballLeft <= 0 || ballRight >= SCREEN_WIDTH) {
      // Balik arah horizontal (velocityX menjadi negatif dari sebelumnya)
      velocityX.current *= -1;
      // Perbaiki posisi bola agar tidak keluar dari batas layar
      if (ballLeft <= 0) {
        // Jika bola melewati dinding kiri, paksa posisi ke 0
        ballXPos.current = 0;
        ballX.setValue(0);
      } else {
        // Jika bola melewati dinding kanan, paksa posisi ke batas kanan layar
        ballXPos.current = SCREEN_WIDTH - BALL_SIZE;
        ballX.setValue(SCREEN_WIDTH - BALL_SIZE);
      }
    }

    // ============================================
    // COLLISION DENGAN DINDING ATAS
    // ============================================
    // Jika bola menyentuh dinding atas (ballTop <= 0)
    if (ballTop <= 0) {
      // Balik arah vertikal (velocityY menjadi negatif dari sebelumnya)
      velocityY.current *= -1;
      // Perbaiki posisi bola agar tidak keluar dari batas atas layar
      ballYPos.current = 0;
      ballY.setValue(0);
    }

    // ============================================
    // COLLISION DENGAN PADDLE (PAPAN PEMANTUL)
    // ============================================
    // Hitung posisi bounding box paddle untuk collision detection
    const paddleLeft = paddleXPos.current;                                    // Posisi X kiri paddle
    const paddleRight = paddleXPos.current + PADDLE_WIDTH;                    // Posisi X kanan paddle
    const paddleTop = SCREEN_HEIGHT - PADDLE_HEIGHT - 30 - insets.bottom;     // Posisi Y atas paddle (30px dari bawah + safe area)
    const paddleBottom = paddleTop + PADDLE_HEIGHT;                           // Posisi Y bawah paddle

    // Hanya cek collision jika bola bergerak ke bawah (menuju paddle)
    // Jika bola bergerak ke atas, tidak perlu cek collision dengan paddle
    if (velocityY.current > 0) {
      // Hitung posisi bola setelah frame ini (predictive collision detection)
      // Ini mencegah bola melewati paddle karena kecepatan tinggi
      const nextBallX = ballXPos.current + velocityX.current;        // Posisi X berikutnya
      const nextBallY = ballYPos.current + velocityY.current;        // Posisi Y berikutnya
      const nextBallLeft = nextBallX;                                 // Posisi X kiri berikutnya
      const nextBallRight = nextBallX + BALL_SIZE;                    // Posisi X kanan berikutnya
      const nextBallTop = nextBallY;                                  // Posisi Y atas berikutnya
      const nextBallBottom = nextBallY + BALL_SIZE;                   // Posisi Y bawah berikutnya
      
      // Cek apakah ada overlap horizontal antara bola dan paddle
      // Overlap terjadi jika bagian kanan bola > kiri paddle DAN bagian kiri bola < kanan paddle
      const horizontalOverlap = nextBallRight > paddleLeft && nextBallLeft < paddleRight;
      
      // Cek apakah bola akan menabrak paddle menggunakan cek ketat
      // Bola menabrak jika: ada overlap horizontal DAN bagian bawah bola >= atas paddle DAN bagian atas bola < bawah paddle
      if (horizontalOverlap && nextBallBottom >= paddleTop && nextBallTop < paddleBottom) {
        // Bola akan menabrak paddle - balik arah SEBELUM bola melewati paddle
        velocityY.current *= -1;
        
        // KRITIS: Posisikan bola TEPAT di atas paddle SEBELUM pergerakan
        // Ini memastikan bola tidak pernah overlap dengan paddle dan terlihat melewati paddle
        ballYPos.current = paddleTop - BALL_SIZE;
        ballY.setValue(paddleTop - BALL_SIZE);
        
        // Tambahkan sudut pantulan berdasarkan di mana bola menabrak paddle
        // Jika menabrak di tengah paddle, bola akan lurus ke atas
        // Jika menabrak di kiri paddle, bola akan miring ke kiri
        // Jika menabrak di kanan paddle, bola akan miring ke kanan
        const ballCenterX = ballXPos.current + BALL_SIZE / 2;        // Titik tengah bola (X)
        const hitPosition = Math.max(0, Math.min(1, (ballCenterX - paddleLeft) / PADDLE_WIDTH)); // Posisi hit (0-1)
        // Hitung velocityX baru berdasarkan posisi hit (0.5 = tengah, 0 = kiri, 1 = kanan)
        velocityX.current = (hitPosition - 0.5) * ballSpeed * 2;
      }
      
      // KRITIS SAFETY CHECK: Jika bola entah bagaimana sudah overlap dengan paddle, perbaiki segera
      // Ini adalah backup check untuk memastikan tidak ada bug visual
      const currentHorizontalOverlap = ballRight > paddleLeft && ballLeft < paddleRight;
      if (currentHorizontalOverlap && ballBottom > paddleTop) {
        // Bola sudah di dalam paddle - paksa keluar ke posisi yang benar
        ballYPos.current = paddleTop - BALL_SIZE;
        ballY.setValue(paddleTop - BALL_SIZE);
        // Jika bola masih bergerak ke bawah, balik arahnya
        if (velocityY.current > 0) {
          velocityY.current *= -1;
        }
      }
    }

    // ============================================
    // COLLISION DENGAN BRICKS (BATA)
    // ============================================
    // Update state bricks sambil mengecek collision dengan setiap bata
    setBricks(prev => {
      let brickDestroyed = false; // Flag untuk menandai apakah ada bata yang dihancurkan di frame ini
      
      // Map setiap bata untuk mengecek collision
      const updatedBricks = prev.map(brick => {
        // Jika bata sudah dihancurkan, skip pengecekan collision
        if (brick.destroyed) return brick;

        // Hitung posisi bounding box bata untuk collision detection
        const brickLeft = brick.x;                          // Posisi X kiri bata
        const brickRight = brick.x + BRICK_WIDTH;           // Posisi X kanan bata
        const brickTop = brick.y;                          // Posisi Y atas bata
        const brickBottom = brick.y + BRICK_HEIGHT;         // Posisi Y bawah bata

        // Cek apakah bola overlap dengan bata menggunakan AABB (Axis-Aligned Bounding Box) collision
        // Overlap terjadi jika:
        // - Bagian kanan bola > kiri bata DAN
        // - Bagian kiri bola < kanan bata DAN
        // - Bagian bawah bola > atas bata DAN
        // - Bagian atas bola < bawah bata
        if (
          ballRight > brickLeft &&
          ballLeft < brickRight &&
          ballBottom > brickTop &&
          ballTop < brickBottom
        ) {
          // Bola menabrak bata - tandai bahwa ada bata yang dihancurkan
          brickDestroyed = true;
          
          // ============================================
          // UPDATE SKOR SAAT BATA DIHANCURKAN
          // ============================================
          // Setiap bata yang dihancurkan memberikan 10 poin
          setScore(prevScore => {
            const newScore = prevScore + 10; // Tambahkan 10 poin
            scoreRef.current = newScore;      // Update ref untuk akses di game loop
            // Jika skor baru lebih tinggi dari high score, update high score
            if (newScore > highScore) {
              setHighScore(newScore);
            }
            return newScore;
          });

          // ============================================
          // PANTULAN BOLA SETELAH MENABRAK BATA
          // ============================================
          // Hitung pusat bola dan pusat bata untuk menentukan arah pantulan
          const ballCenterX = ballXPos.current + BALL_SIZE / 2;      // Titik tengah bola (X)
          const ballCenterY = ballYPos.current + BALL_SIZE / 2;      // Titik tengah bola (Y)
          const brickCenterX = brick.x + BRICK_WIDTH / 2;            // Titik tengah bata (X)
          const brickCenterY = brick.y + BRICK_HEIGHT / 2;           // Titik tengah bata (Y)

          // Hitung jarak horizontal dan vertikal antara pusat bola dan pusat bata
          const dx = ballCenterX - brickCenterX;  // Jarak horizontal
          const dy = ballCenterY - brickCenterY;  // Jarak vertikal

          // Tentukan arah pantulan berdasarkan jarak terbesar
          // Jika jarak horizontal lebih besar, pantulkan secara horizontal
          // Jika jarak vertikal lebih besar, pantulkan secara vertikal
          if (Math.abs(dx) > Math.abs(dy)) {
            velocityX.current *= -1; // Balik arah horizontal
          } else {
            velocityY.current *= -1; // Balik arah vertikal
          }

          // Tandai bata sebagai dihancurkan dan kembalikan bata yang sudah diupdate
          return { ...brick, destroyed: true };
        }

        // Jika tidak ada collision, kembalikan bata tanpa perubahan
        return brick;
      });

      // ============================================
      // CEK APAKAH SEMUA BATA SUDAH DIHANCURKAN (LEVEL COMPLETE)
      // ============================================
      // Hitung jumlah bata yang masih tersisa (belum dihancurkan)
      const remainingBricks = updatedBricks.filter(b => !b.destroyed).length;
      // Jika tidak ada bata tersisa DAN ada bata yang dihancurkan di frame ini, level selesai!
      if (remainingBricks === 0 && brickDestroyed) {
        // Semua bata sudah dihancurkan - Level Complete!
        // Gunakan setTimeout untuk memberikan delay sebelum naik level
        // Ini memberikan waktu untuk animasi dan feedback visual
        setTimeout(() => {
          // Update level ke level berikutnya
          setLevel(prevLevel => {
            const newLevel = prevLevel + 1;
            console.log('Level completed! Moving to level:', newLevel);
            
            // Reset posisi bola untuk level berikutnya
            // Posisikan bola di tengah layar secara horizontal dan 60% dari atas secara vertikal
            const startX = SCREEN_WIDTH / 2 - BALL_SIZE / 2;
            const startY = SCREEN_HEIGHT * 0.6;
            ballXPos.current = startX;
            ballYPos.current = startY;
            ballX.setValue(startX);
            ballY.setValue(startY);
            
            // Reset velocity bola dengan arah acak untuk variasi gameplay
            // Arah horizontal random (kiri atau kanan), arah vertikal selalu ke atas
            velocityX.current = (Math.random() > 0.5 ? 1 : -1) * ballSpeed;
            velocityY.current = -ballSpeed;
            
            return newLevel;
          });
          
          // Inisialisasi bata baru untuk level berikutnya setelah state level diupdate
          // Delay 100ms untuk memastikan state sudah terupdate
          setTimeout(() => {
            initializeBricks();
          }, 100);
        }, 300); // Delay 300ms sebelum naik level
      }

      // Kembalikan array bata yang sudah diupdate
      return updatedBricks;
    });

    // ============================================
    // CEK GAME OVER (BOLA JATUH DI BAWAH PADDLE)
    // ============================================
    // Jika bagian atas bola melewati batas bawah layar, game over
    // Ini berarti pemain gagal menangkap bola dengan paddle
    if (ballTop > SCREEN_HEIGHT) {
      // Set status game: tidak menang, game berakhir, game tidak lagi berjalan
      setGameWon(false);
      setGameOver(true);
      setGameStarted(false);
      
      // Simpan skor ke database jika ada current player
      if (currentPlayer) {
        const finalScore = scoreRef.current; // Ambil skor final dari ref
        console.log('Saving score (game over):', finalScore, 'for player:', currentPlayer.name);
        // Simpan skor ke database (async, tidak perlu await karena tidak blocking)
        // Jika skor lebih tinggi dari high score, akan otomatis diupdate di database
        updatePlayerScore(currentPlayer.id, finalScore, level).catch(error => {
          console.error('Error saving score:', error);
        });
      }
    }
  };

  /**
   * Fungsi utama game loop yang berjalan terus menerus selama game aktif
   * Game loop ini:
   * 1. Mengecek collision sebelum memindahkan bola
   * 2. Menghitung posisi baru bola berdasarkan velocity
   * 3. Memperbarui posisi bola di layar
   * 4. Memanggil dirinya sendiri lagi untuk frame berikutnya
   * 
   * Menggunakan requestAnimationFrame untuk smooth 60fps animation
   */
  const gameLoop = () => {
    // Jika game sudah berakhir, hentikan game loop
    if (gameOver) return;

    /**
     * Fungsi update yang dipanggil setiap frame oleh requestAnimationFrame
     * Fungsi ini melakukan update posisi dan collision detection
     */
    const update = () => {
      // Jika game belum dimulai atau sudah berakhir, hentikan update
      if (!gameStarted || gameOver) return;

      // ============================================
      // CEK COLLISION SEBELUM MEMINDAHKAN BOLA
      // ============================================
      // Ini sangat penting untuk mencegah bola melewati objek karena kecepatan tinggi
      // Collision detection dilakukan sebelum update posisi
      checkCollisions();

      // ============================================
      // HITUNG POSISI BARU BOLA
      // ============================================
      // Hitung posisi baru berdasarkan posisi saat ini + velocity
      let newX = ballXPos.current + velocityX.current;  // Posisi X baru
      let newY = ballYPos.current + velocityY.current;  // Posisi Y baru
      
      // ============================================
      // CEK FINAL SEBELUM UPDATE POSISI - MENCEGAH BOLA MELEWATI PADDLE
      // ============================================
      // Ini adalah safety check tambahan untuk memastikan bola tidak melewati paddle
      // Hitung posisi paddle
      const paddleTop = SCREEN_HEIGHT - PADDLE_HEIGHT - 30 - insets.bottom;
      const paddleLeft = paddleXPos.current;
      const paddleRight = paddleXPos.current + PADDLE_WIDTH;
      
      // Jika bola bergerak ke bawah, cek apakah akan melewati paddle
      if (velocityY.current > 0) {
        // Hitung posisi bola di masa depan setelah update
        const futureBallBottom = newY + BALL_SIZE;      // Bagian bawah bola setelah update
        const futureBallLeft = newX;                     // Bagian kiri bola setelah update
        const futureBallRight = newX + BALL_SIZE;        // Bagian kanan bola setelah update
        // Cek apakah ada overlap horizontal dengan paddle
        const horizontalOverlap = futureBallRight > paddleLeft && futureBallLeft < paddleRight;
        
        // Jika bola akan melewati paddle, batasi posisi Y tepat di atas paddle
        if (horizontalOverlap && futureBallBottom > paddleTop) {
          // Batasi posisi Y agar bola tidak melewati paddle
          newY = paddleTop - BALL_SIZE;
          // Jika velocity masih ke bawah, balik arahnya
          if (velocityY.current > 0) {
            velocityY.current *= -1;
            // Tambahkan sudut pantulan berdasarkan posisi hit di paddle
            const ballCenterX = newX + BALL_SIZE / 2;
            const hitPosition = Math.max(0, Math.min(1, (ballCenterX - paddleLeft) / PADDLE_WIDTH));
            velocityX.current = (hitPosition - 0.5) * ballSpeed * 2;
          }
        }
      }
      
      // ============================================
      // UPDATE POSISI BOLA
      // ============================================
      // Update posisi aktual di ref (untuk perhitungan collision)
      ballXPos.current = newX;
      ballYPos.current = newY;
      // Update animated value (untuk rendering di layar)
      ballX.setValue(newX);
      ballY.setValue(newY);

      // Lanjutkan game loop dengan memanggil requestAnimationFrame lagi
      // Ini akan memanggil fungsi update lagi di frame berikutnya (sekitar 16ms kemudian untuk 60fps)
      gameLoopRef.current = requestAnimationFrame(update);
    };

    // Mulai game loop dengan memanggil requestAnimationFrame pertama kali
    gameLoopRef.current = requestAnimationFrame(update);
  };

  /**
   * Effect yang mengatur lifecycle game loop
   * Effect ini:
   * 1. Memulai game loop ketika game dimulai dan belum berakhir
   * 2. Membersihkan (cleanup) game loop ketika komponen unmount atau game berakhir
   * 
   * Dependencies: gameStarted, gameOver, bricks
   * - gameStarted: untuk memulai game loop
   * - gameOver: untuk menghentikan game loop
   * - bricks: untuk restart game loop ketika bata berubah (level naik)
   */
  useEffect(() => {
    // Jika game sudah dimulai dan belum berakhir, jalankan game loop
    if (gameStarted && !gameOver) {
      gameLoop();
    }
    
    // Cleanup function: dipanggil ketika effect di-cleanup
    // Ini penting untuk mencegah memory leak dan multiple game loops
    return () => {
      // Jika ada game loop yang sedang berjalan, cancel untuk menghentikannya
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameStarted, gameOver, bricks]);

  const renderBricks = () => {
    return bricks.map((brick) => {
      if (brick.destroyed) return null;

      return (
        <View
          key={brick.id}
          style={[
            styles.brick,
            {
              left: brick.x,
              top: brick.y,
              backgroundColor: getBrickColor(brick.id),
            },
          ]}
        />
      );
    });
  };

  const getBrickColor = (id: number): string => {
    const row = Math.floor(id / BRICK_COLS);
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7'];
    return colors[row % colors.length];
  };

  /**
   * Render utama komponen game
   * Menampilkan semua elemen UI game termasuk score, game area, dan overlay
   */
  return (
    <View 
      style={[styles.container, { paddingTop: insets.top }]}
    >
      {/* Status bar dengan style light (teks putih) */}
      <StatusBar style="light" />
      
      {/* ============================================
          TAMPILAN SKOR DAN INFORMASI GAME
          ============================================ */}
      {/* Container untuk menampilkan skor, high score, dan level */}
      <View style={styles.scoreContainer}>
        {/* Tampilkan skor saat ini */}
        <Text style={styles.scoreText}>Skor: {score}</Text>
        {/* Tampilkan skor tertinggi pemain */}
        <Text style={styles.highScoreText}>Skor Tertinggi: {highScore}</Text>
        {/* Tampilkan level saat ini */}
        <Text style={styles.levelText}>Level: {level}</Text>
      </View>

      {/* ============================================
          AREA GAME (TEMPAT BOLA, PADDLE, DAN BATA)
          ============================================ */}
      {/* View utama untuk area game dengan touch handlers */}
      <View 
        style={styles.gameArea}
        onTouchStart={handleTouchStart}  // Handler saat layar disentuh (untuk mulai game)
        onTouchMove={handleTouchMove}    // Handler saat jari digeser (untuk gerakkan paddle)
      >
        {/* Render semua bata yang belum dihancurkan */}
        {renderBricks()}

        {/* Bola yang bergerak - menggunakan Animated.View untuk animasi smooth */}
        <Animated.View
          style={[
            styles.ball,  // Style dasar bola
            {
              left: ballX,  // Posisi X dari animated value
              top: ballY,   // Posisi Y dari animated value
            },
          ]}
        />

        {/* Paddle (papan pemantul) - menggunakan Animated.View untuk animasi smooth */}
        <Animated.View
          style={[
            styles.paddle,  // Style dasar paddle
            {
              left: paddleX,                    // Posisi X dari animated value
              bottom: 30 + insets.bottom,        // Posisi Y dari bawah (30px + safe area)
            },
          ]}
        />
      </View>

      {/* ============================================
          OVERLAY MODAL (FORM, GAME OVER, START SCREEN)
          ============================================ */}
      {/* Overlay hanya ditampilkan ketika game belum dimulai */}
      {!gameStarted && (
        /* Overlay background dengan pointerEvents="box-none" agar touch event bisa melewati */
        <View style={styles.overlay} pointerEvents="box-none">
          {/* Container konten overlay dengan pointerEvents="auto" agar button bisa diklik */}
          <View style={styles.overlayContent} pointerEvents="auto">
            {/* ============================================
                KONDISI 1: FORM INPUT NAMA PEMAIN
                ============================================ */}
            {/* Tampilkan form input nama jika belum ada pemain */}
            {showPlayerForm ? (
              <>
                <Text style={styles.overlayTitle}>Pemecah Bata</Text>
                {/* Komponen form untuk input nama pemain */}
                <PlayerForm onSubmit={handlePlayerSubmit} />
              </>
            ) : 
            /* ============================================
                KONDISI 2: FORM GANTI NAMA PEMAIN
                ============================================ */
            /* Tampilkan form ganti nama jika user ingin mengubah nama */
            showChangeNameForm ? (
              <>
                <Text style={styles.overlayTitle}>Ganti Nama Pemain</Text>
                {/* Komponen form dengan nama awal yang sudah diisi */}
                <PlayerForm 
                  onSubmit={handleChangeName} 
                  onCancel={() => setShowChangeNameForm(false)}  // Handler untuk cancel
                  initialName={currentPlayer?.name}               // Nama awal untuk pre-fill
                />
              </>
            ) : 
            /* ============================================
                KONDISI 3: MODAL GAME OVER
                ============================================ */
            /* Tampilkan modal game over jika game sudah berakhir */
            gameOver ? (
              <>
                {/* Judul modal: berbeda untuk menang atau kalah */}
                <Text style={styles.overlayTitle}>
                  {gameWon ? '🎉 Selamat! Anda Menang!' : 'Permainan Berakhir!'}
                </Text>
                {/* Tampilkan skor akhir */}
                <Text style={styles.overlayScore}>Skor: {score}</Text>
                {/* Tampilkan level saat game berakhir */}
                <Text style={styles.levelText}>Level: {level}</Text>
                {/* Tampilkan pesan khusus jika pemain menang (semua bata hancur) */}
                {gameWon && (
                  <Text style={styles.winText}>Semua bata berhasil dihancurkan!</Text>
                )}
                {/* Tampilkan nama pemain jika ada */}
                {currentPlayer && (
                  <Text style={styles.playerNameText}>Pemain: {currentPlayer.name}</Text>
                )}
                {/* Tombol untuk main lagi (lanjut dari level terakhir) */}
                <TouchableOpacity style={styles.button} onPress={() => startGame(false)}>
                  <Text style={styles.buttonText}>Main Lagi</Text>
                </TouchableOpacity>
                {/* Tombol untuk mulai dari level 1 */}
                <TouchableOpacity 
                  style={[styles.button, styles.level1Button]} 
                  onPress={startFromLevel1}
                >
                  <Text style={styles.buttonText}>Mulai dari Level 1</Text>
                </TouchableOpacity>
                {/* Tombol untuk melihat leaderboard */}
                <TouchableOpacity 
                  style={[styles.button, styles.leaderboardButton]} 
                  onPress={() => router.push('/leaderboard' as any)}
                >
                  <Text style={styles.buttonText}>Lihat Leaderboard</Text>
                </TouchableOpacity>
              </>
            ) : 
            /* ============================================
                KONDISI 4: START SCREEN (SEBELUM GAME DIMULAI)
                ============================================ */
            /* Tampilkan start screen jika game belum dimulai dan belum berakhir */
            (
              <>
                <Text style={styles.overlayTitle}>Pemecah Bata</Text>
                {/* Tampilkan nama pemain dan tombol ganti nama jika ada pemain */}
                {currentPlayer && (
                  <>
                    <Text style={styles.playerNameText}>Pemain: {currentPlayer.name}</Text>
                    {/* Tombol untuk mengganti nama pemain */}
                    <TouchableOpacity 
                      style={[styles.button, styles.changeNameButton]} 
                      onPress={() => setShowChangeNameForm(true)}
                    >
                      <Text style={styles.buttonText}>Ganti Nama</Text>
                    </TouchableOpacity>
                  </>
                )}
                {/* Tombol untuk memulai game */}
                <TouchableOpacity style={styles.button} onPress={() => startGame(false)}>
                  <Text style={styles.buttonText}>Mulai Bermain</Text>
                </TouchableOpacity>
                {/* Tombol untuk melihat leaderboard */}
                <TouchableOpacity 
                  style={[styles.button, styles.leaderboardButton]} 
                  onPress={() => router.push('/leaderboard' as any)}
                >
                  <Text style={styles.buttonText}>Lihat Leaderboard</Text>
                </TouchableOpacity>
                {/* Instruksi cara bermain */}
                <Text style={styles.instructionsText}>
                  Geser untuk menggerakkan papan{'\n'}
                  Hancurkan semua bata!{'\n'}
                  Jangan biarkan bola jatuh!
                </Text>
              </>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

/**
 * StyleSheet untuk semua komponen UI dalam game
 * Menggunakan StyleSheet.create untuk optimasi performa
 */
const styles = StyleSheet.create({
  // Container utama untuk seluruh halaman game
  container: {
    flex: 1,                      // Mengisi seluruh ruang yang tersedia
    backgroundColor: '#1a1a2e', // Warna background gelap (biru tua)
  },
  
  // Container untuk menampilkan skor, high score, dan level
  scoreContainer: {
    position: 'absolute',        // Posisi absolut agar berada di atas elemen lain
    top: 60,                     // 60px dari atas
    left: 0,                     // Mulai dari kiri
    right: 0,                    // Sampai ke kanan
    alignItems: 'center',        // Tengahkan konten secara horizontal
    zIndex: 10,                  // Z-index tinggi agar selalu di atas game area
  },
  
  // Style untuk teks skor saat ini
  scoreText: {
    fontSize: 20,                // Ukuran font 20
    fontWeight: 'bold',          // Teks tebal
    color: '#fff',               // Warna putih
  },
  
  // Style untuk teks high score
  highScoreText: {
    fontSize: 14,                // Ukuran font 14
    color: '#fff',               // Warna putih
    marginTop: 4,               // Jarak atas 4px
  },
  
  // Style untuk teks level
  levelText: {
    fontSize: 14,                // Ukuran font 14
    color: '#fff',               // Warna putih
    marginTop: 4,                // Jarak atas 4px
  },
  
  // Area utama game tempat bola, paddle, dan bata berada
  gameArea: {
    flex: 1,                     // Mengisi seluruh ruang yang tersedia
    position: 'relative',        // Posisi relatif untuk absolute positioning child
  },
  
  // Style untuk bola
  ball: {
    position: 'absolute',         // Posisi absolut untuk kontrol posisi manual
    width: BALL_SIZE,            // Lebar sesuai konstanta
    height: BALL_SIZE,           // Tinggi sesuai konstanta
    backgroundColor: '#fff',     // Warna putih
    borderRadius: BALL_SIZE / 2,  // Border radius setengah ukuran untuk membuat lingkaran sempurna
    shadowColor: '#000',         // Warna shadow hitam
    shadowOffset: { width: 0, height: 2 }, // Offset shadow (ke bawah)
    shadowOpacity: 0.5,          // Opasitas shadow 50%
    shadowRadius: 4,             // Radius blur shadow
  },
  
  // Style untuk paddle (papan pemantul)
  paddle: {
    position: 'absolute',         // Posisi absolut untuk kontrol posisi manual
    width: PADDLE_WIDTH,         // Lebar sesuai konstanta
    height: PADDLE_HEIGHT,       // Tinggi sesuai konstanta
    backgroundColor: '#4ecdc4',   // Warna hijau muda/cyan
    borderRadius: 10,            // Border radius untuk sudut melengkung
    borderWidth: 2,              // Ketebalan border 2px
    borderColor: '#fff',         // Warna border putih
    shadowColor: '#000',         // Warna shadow hitam
    shadowOffset: { width: 0, height: 2 }, // Offset shadow (ke bawah)
    shadowOpacity: 0.5,          // Opasitas shadow 50%
    shadowRadius: 4,             // Radius blur shadow
  },
  
  // Style untuk bata/brick
  brick: {
    position: 'absolute',         // Posisi absolut untuk kontrol posisi manual
    width: BRICK_WIDTH,          // Lebar sesuai konstanta
    height: BRICK_HEIGHT,         // Tinggi sesuai konstanta
    borderRadius: 5,             // Border radius untuk sudut melengkung
    borderWidth: 2,              // Ketebalan border 2px
    borderColor: '#fff',         // Warna border putih
    shadowColor: '#000',         // Warna shadow hitam
    shadowOffset: { width: 0, height: 2 }, // Offset shadow (ke bawah)
    shadowOpacity: 0.3,           // Opasitas shadow 30%
    shadowRadius: 4,             // Radius blur shadow
  },
  
  // Overlay background untuk modal (form, game over, dll)
  overlay: {
    position: 'absolute',         // Posisi absolut untuk menutupi seluruh layar
    top: 0,                      // Mulai dari atas
    left: 0,                     // Mulai dari kiri
    right: 0,                    // Sampai ke kanan
    bottom: 0,                  // Sampai ke bawah
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // Background hitam dengan opasitas 80%
    justifyContent: 'center',    // Tengahkan konten secara vertikal
    alignItems: 'center',        // Tengahkan konten secara horizontal
    zIndex: 20,                  // Z-index sangat tinggi agar selalu di atas semua elemen
  },
  
  // Container konten di dalam overlay
  overlayContent: {
    backgroundColor: '#fff',     // Background putih
    padding: 30,                  // Padding 30px di semua sisi
    borderRadius: 20,          // Border radius untuk sudut melengkung
    alignItems: 'center',        // Tengahkan konten secara horizontal
    minWidth: 250,               // Lebar minimum 250px
  },
  
  // Style untuk judul overlay
  overlayTitle: {
    fontSize: 32,                // Ukuran font besar
    fontWeight: 'bold',          // Teks tebal
    color: '#ff6b6b',           // Warna merah muda
    marginBottom: 10,            // Jarak bawah 10px
  },
  
  // Style untuk teks skor di overlay
  overlayScore: {
    fontSize: 24,                // Ukuran font 24
    fontWeight: 'bold',          // Teks tebal
    color: '#333',               // Warna abu-abu gelap
    marginBottom: 10,            // Jarak bawah 10px
  },
  
  // Style untuk teks overlay umum (tidak digunakan saat ini)
  overlayText: {
    fontSize: 18,                // Ukuran font 18
    color: '#666',               // Warna abu-abu sedang
    textAlign: 'center',        // Teks rata tengah
    marginTop: 10,               // Jarak atas 10px
  },
  
  // Style untuk teks instruksi cara bermain
  instructionsText: {
    fontSize: 14,                // Ukuran font 14
    color: '#999',               // Warna abu-abu terang
    textAlign: 'center',        // Teks rata tengah
    marginTop: 20,               // Jarak atas 20px
    lineHeight: 20,              // Tinggi baris 20px untuk spacing yang nyaman
  },
  
  // Style untuk teks nama pemain
  playerNameText: {
    fontSize: 16,                // Ukuran font 16
    color: '#4ecdc4',            // Warna cyan (sama dengan paddle)
    fontWeight: 'bold',          // Teks tebal
    marginBottom: 10,            // Jarak bawah 10px
  },
  
  // Style dasar untuk semua tombol
  button: {
    backgroundColor: '#4ecdc4', // Background warna cyan
    paddingVertical: 12,         // Padding vertikal 12px
    paddingHorizontal: 30,       // Padding horizontal 30px
    borderRadius: 10,          // Border radius untuk sudut melengkung
    marginTop: 10,               // Jarak atas 10px
    minWidth: 200,               // Lebar minimum 200px
    alignItems: 'center',        // Tengahkan konten secara horizontal
  },
  
  // Style khusus untuk tombol leaderboard
  leaderboardButton: {
    backgroundColor: '#6c5ce7', // Background warna ungu
    marginTop: 10,                // Jarak atas 10px
  },
  
  // Style untuk teks di dalam tombol
  buttonText: {
    color: '#fff',               // Warna putih
    fontSize: 16,                // Ukuran font 16
    fontWeight: 'bold',          // Teks tebal
  },
  
  // Style untuk teks kemenangan
  winText: {
    fontSize: 16,                // Ukuran font 16
    color: '#fffa24',            // Warna kuning terang
    fontWeight: 'bold',          // Teks tebal
    marginTop: 10,               // Jarak atas 10px
    marginBottom: 5,             // Jarak bawah 5px
  },
  
  // Style khusus untuk tombol ganti nama
  changeNameButton: {
    backgroundColor: '#95a5a6', // Background warna abu-abu
    marginTop: 5,                 // Jarak atas 5px
    marginBottom: 5,             // Jarak bawah 5px
  },
  
  // Style khusus untuk tombol mulai dari level 1
  level1Button: {
    backgroundColor: '#f39c12',  // Background warna orange
    marginTop: 10,                // Jarak atas 10px
  },
});
