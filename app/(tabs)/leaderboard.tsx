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
 * FILE: app/(tabs)/leaderboard.tsx
 * DESKRIPSI: Halaman leaderboard/papan peringkat
 * 
 * Halaman ini menampilkan daftar semua pemain beserta skor tertinggi mereka.
 * Pemain dapat melihat riwayat permainan mereka dan mengubah nama mereka.
 */

import PlayerForm from '@/components/PlayerForm';
import { GameSession, getAllPlayers, getPlayerSessions, initDatabase, Player, updatePlayerName } from '@/utils/database';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChangeNameForm, setShowChangeNameForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  useEffect(() => {
    // Initialize database on mount
    const initDb = async () => {
      try {
        await initDatabase();
      } catch (error) {
        console.error('Error initializing database:', error);
      }
    };
    initDb();
    loadPlayers();
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadPlayers();
    }, [])
  );

  const loadPlayers = async () => {
    try {
      setLoading(true);
      // Ensure database is initialized
      await initDatabase();
      const allPlayers = await getAllPlayers();
      console.log('Leaderboard - Loaded players:', allPlayers.length, allPlayers);
      
      if (allPlayers.length === 0) {
        console.log('Leaderboard - No players found, checking storage...');
        // Try to check storage directly
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const rawData = await AsyncStorage.getItem('@pemecah_bata:players');
        console.log('Leaderboard - Raw storage data:', rawData);
      }
      
      setPlayers(allPlayers);
    } catch (error) {
      console.error('Error loading players:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPlayerSessions = async (player: Player) => {
    try {
      const playerSessions = await getPlayerSessions(player.id, 10);
      setSessions(playerSessions);
      setSelectedPlayer(player);
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleChangeName = async (newName: string) => {
    if (!editingPlayer) return;
    
    try {
      const updatedPlayer = await updatePlayerName(editingPlayer.id, newName);
      
      // Update in players list
      setPlayers(prev => prev.map(p => p.id === updatedPlayer.id ? updatedPlayer : p));
      
      // Update selected player if it's the same
      if (selectedPlayer?.id === updatedPlayer.id) {
        setSelectedPlayer(updatedPlayer);
      }
      
      setShowChangeNameForm(false);
      setEditingPlayer(null);
      alert('Nama berhasil diubah!');
    } catch (error: any) {
      console.error('Error changing name:', error);
      alert(error.message || 'Gagal mengubah nama. Silakan coba lagi.');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Leaderboard</Text>
      </View>

      {showChangeNameForm && editingPlayer ? (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <PlayerForm 
              onSubmit={handleChangeName} 
              onCancel={() => {
                setShowChangeNameForm(false);
                setEditingPlayer(null);
              }}
              initialName={editingPlayer.name}
            />
          </View>
        </View>
      ) : loading ? (
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Memuat data...</Text>
        </View>
      ) : players.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Belum ada data pemain</Text>
          <Text style={styles.emptySubtext}>Mulai bermain untuk melihat skor!</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Top Players */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏆 Top Pemain</Text>
            {players.slice(0, 10).map((player, index) => (
              <TouchableOpacity
                key={player.id}
                style={[
                  styles.playerCard,
                  selectedPlayer?.id === player.id && styles.selectedCard,
                ]}
                onPress={() => loadPlayerSessions(player)}
              >
                <View style={styles.rankContainer}>
                  <Text style={styles.rankText}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                  </Text>
                </View>
                <View style={styles.playerInfo}>
                  <Text style={styles.playerName}>{player.name}</Text>
                  <Text style={styles.playerStats}>
                    Skor Tertinggi: {player.highScore} | Level: {player.bestLevel} | 
                    Total Permainan: {player.totalGames}
                  </Text>
                </View>
                <View style={styles.scoreContainer}>
                  <Text style={styles.scoreText}>{player.highScore}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Player Details */}
          {selectedPlayer && (
            <View style={styles.section}>
              <View style={styles.playerHeader}>
                <Text style={styles.sectionTitle}>
                  📊 Riwayat {selectedPlayer.name}
                </Text>
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => {
                    setEditingPlayer(selectedPlayer);
                    setShowChangeNameForm(true);
                  }}
                >
                  <Text style={styles.editButtonText}>✏️ Ganti Nama</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.statsCard}>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Skor Tertinggi:</Text>
                  <Text style={styles.statValue}>{selectedPlayer.highScore}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Level Terbaik:</Text>
                  <Text style={styles.statValue}>{selectedPlayer.bestLevel}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Total Permainan:</Text>
                  <Text style={styles.statValue}>{selectedPlayer.totalGames}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Total Skor:</Text>
                  <Text style={styles.statValue}>{selectedPlayer.totalScore}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Rata-rata Skor:</Text>
                  <Text style={styles.statValue}>
                    {selectedPlayer.totalGames > 0
                      ? Math.round(selectedPlayer.totalScore / selectedPlayer.totalGames)
                      : 0}
                  </Text>
                </View>
              </View>

              {sessions.length > 0 && (
                <>
                  <Text style={styles.sectionSubtitle}>10 Permainan Terakhir</Text>
                  {sessions.map((session) => (
                    <View key={session.id} style={styles.sessionCard}>
                      <View style={styles.sessionInfo}>
                        <Text style={styles.sessionScore}>Skor: {session.score}</Text>
                        <Text style={styles.sessionLevel}>Level: {session.level}</Text>
                      </View>
                      <Text style={styles.sessionDate}>{formatDate(session.playedAt)}</Text>
                    </View>
                  ))}
                </>
              )}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    color: '#4ecdc4',
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emptySubtext: {
    color: '#999',
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4ecdc4',
    marginTop: 20,
    marginBottom: 10,
  },
  playerCard: {
    flexDirection: 'row',
    backgroundColor: '#2a2a3e',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  selectedCard: {
    backgroundColor: '#3a3a4e',
    borderWidth: 2,
    borderColor: '#4ecdc4',
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  playerInfo: {
    flex: 1,
    marginLeft: 15,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  playerStats: {
    fontSize: 12,
    color: '#999',
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4ecdc4',
  },
  statsCard: {
    backgroundColor: '#2a2a3e',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  statLabel: {
    fontSize: 14,
    color: '#999',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4ecdc4',
  },
  sessionCard: {
    backgroundColor: '#2a2a3e',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  sessionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  sessionScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  sessionLevel: {
    fontSize: 14,
    color: '#4ecdc4',
  },
  sessionDate: {
    fontSize: 12,
    color: '#999',
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  editButton: {
    backgroundColor: '#95a5a6',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    minWidth: 300,
    maxWidth: '90%',
  },
});

