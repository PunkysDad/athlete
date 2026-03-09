import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import {
  Card,
  Button,
  Provider as PaperProvider,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { appTheme } from '../theme/appTheme';
import { theme, commonStyles } from '../theme';
import { apiService } from '../services/apiService';
import { UserService } from '../services/userService';
import { getAuth } from 'firebase/auth';
import { RootStackParamList } from '../types/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const POSITION_ENUM_MAP: Record<string, string> = {
  'QB': 'QB', 'RB': 'RB', 'WR': 'WR', 'OL': 'OL',
  'TE': 'TE', 'LB': 'LB', 'DB': 'DB', 'DL': 'DL',
  'PG': 'PG', 'SG': 'SG', 'SF': 'SF', 'PF': 'PF', 'C': 'C',
  'Pitcher': 'PITCHER', 'Catcher': 'CATCHER', 'Infield': 'INFIELD', 'Outfield': 'OUTFIELD',
  'Goalkeeper': 'GOALKEEPER', 'Defender': 'DEFENDER', 'Midfielder': 'MIDFIELDER', 'Forward': 'FORWARD',
  'Center': 'CENTER', 'Winger': 'WINGER', 'Defenseman': 'DEFENSEMAN', 'Goalie': 'GOALIE',
};

const ENUM_POSITION_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(POSITION_ENUM_MAP).map(([display, enumVal]) => [enumVal, display])
);

const SPORTS_CONFIG: Record<string, string[]> = {
  Football:   ['QB', 'RB', 'WR', 'OL', 'TE', 'LB', 'DB', 'DL'],
  Basketball: ['PG', 'SG', 'SF', 'PF', 'C'],
  Baseball:   ['Pitcher', 'Catcher', 'Infield', 'Outfield'],
  Soccer:     ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'],
  Hockey:     ['Center', 'Winger', 'Defenseman', 'Goalie'],
};

const ENUM_SPORT_MAP: Record<string, string> = {
  FOOTBALL: 'Football', BASKETBALL: 'Basketball', BASEBALL: 'Baseball',
  SOCCER: 'Soccer', HOCKEY: 'Hockey',
};

function DropdownRow({
  label, value, items, onSelect,
}: {
  label: string;
  value: string;
  items: string[];
  onSelect: (item: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <TouchableOpacity style={styles.menuButton} onPress={() => setVisible(true)} activeOpacity={0.7}>
        <Text style={styles.menuLabel}>{label}</Text>
        <View style={styles.menuButtonRight}>
          <Text style={styles.menuValue}>{value}</Text>
          <Icon name="arrow-drop-down" size={24} color={appTheme.navy} />
        </View>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setVisible(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{label}</Text>
            <FlatList
              data={items}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, item === value && styles.modalItemSelected]}
                  onPress={() => { onSelect(item); setVisible(false); }}
                >
                  <Text style={[styles.modalItemText, item === value && styles.modalItemTextSelected]}>
                    {item}
                  </Text>
                  {item === value && <Icon name="check" size={20} color={appTheme.navy} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

export default function ProfileEditScreen() {
  const navigation = useNavigation<NavigationProp>();
  const auth = getAuth();
  const userService = new UserService();

  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    sport: 'Football',
    position: 'QB',
  });

  useEffect(() => {
    const resolveUser = async () => {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) return;
      const userData = await userService.checkUserExists(firebaseUser.uid);
      if (userData) setCurrentUserId(userData.id);
    };
    resolveUser();
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    const loadProfile = async () => {
      setProfileLoading(true);
      try {
        const result = await apiService.getUserProfile(currentUserId);
        if (result.success && result.data) {
          const u = result.data;
          const displaySport = u.primarySport
            ? (ENUM_SPORT_MAP[u.primarySport] ?? u.primarySport)
            : 'Football';
          const displayPosition = u.primaryPosition
            ? (ENUM_POSITION_MAP[u.primaryPosition] ?? u.primaryPosition)
            : SPORTS_CONFIG[displaySport][0];
          setFormData({ sport: displaySport, position: displayPosition });
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setProfileLoading(false);
      }
    };
    loadProfile();
  }, [currentUserId]);

  const handleSave = async () => {
    if (!currentUserId) {
      Alert.alert('Error', 'User not authenticated. Please try again.');
      return;
    }
    setIsLoading(true);
    try {
      const result = await apiService.updateUserProfile(currentUserId, {
        primarySport: formData.sport.toUpperCase(),
        primaryPosition: POSITION_ENUM_MAP[formData.position] ?? null,
      });
      if (result.success) {
        Alert.alert('Profile Updated', 'Your profile has been successfully updated.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', 'Failed to update profile. Please try again.');
      }
    } catch {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => console.log('Account deletion requested') },
      ]
    );
  };

  return (
    <PaperProvider>
      <View style={commonStyles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
            <Icon name="close" size={24} color={appTheme.navy} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={styles.headerButton}
            disabled={isLoading || profileLoading}
          >
            <Text style={[styles.headerAction, (isLoading || profileLoading) && { opacity: 0.4 }]}>
              {isLoading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        {profileLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={appTheme.navy} />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Athletic Information */}
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Athletic Information</Text>
                <DropdownRow
                  label="Sport"
                  value={formData.sport}
                  items={Object.keys(SPORTS_CONFIG)}
                  onSelect={(sport) => setFormData({
                    sport,
                    position: SPORTS_CONFIG[sport][0],
                  })}
                />
                <DropdownRow
                  label="Position"
                  value={formData.position}
                  items={SPORTS_CONFIG[formData.sport] ?? []}
                  onSelect={(position) => setFormData({ ...formData, position })}
                />
              </Card.Content>
            </Card>

            {/* Danger Zone */}
            <Card style={styles.dangerCard}>
              <Card.Content>
                <Text style={[styles.sectionTitle, { color: appTheme.red }]}>Danger Zone</Text>
                <Text style={styles.dangerBody}>
                  These actions cannot be undone. Please proceed with caution.
                </Text>
                <Button
                  mode="outlined"
                  onPress={handleDeleteAccount}
                  textColor={appTheme.red}
                  style={styles.dangerButton}
                  icon="delete-forever"
                >
                  Delete Account
                </Button>
              </Card.Content>
            </Card>
          </ScrollView>
        )}
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  // Header — white surface with navy text, matching site nav pattern
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.base,
    paddingHorizontal: theme.spacing.base,
    backgroundColor: appTheme.white,
    borderBottomWidth: 1,
    borderBottomColor: appTheme.gray,
  },
  headerButton: {
    padding: theme.spacing.sm,
    minWidth: 60,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: appTheme.navy,
  },
  headerAction: {
    fontSize: 15,
    fontWeight: '700',
    color: appTheme.navy,
  },

  content: {
    flex: 1,
    padding: theme.spacing.base,
    backgroundColor: appTheme.gray,
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appTheme.gray,
  },
  loadingText: {
    marginTop: theme.spacing.sm,
    fontSize: 13,
    color: appTheme.textLight,
  },

  // Card — white surface on gray background
  card: {
    backgroundColor: appTheme.white,
    borderRadius: theme.borderRadius.base,
    marginBottom: theme.spacing.base,
    ...theme.shadows.sm,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: appTheme.navy,
    marginBottom: theme.spacing.base,
  },

  // Dropdown row
  menuButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.base,
    paddingHorizontal: theme.spacing.sm,
    borderWidth: 1,
    borderColor: appTheme.silver,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.base,
    backgroundColor: appTheme.white,
  },
  menuLabel: {
    fontSize: 15,
    color: appTheme.text,
  },
  menuButtonRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuValue: {
    fontSize: 15,
    color: appTheme.navy,
    fontWeight: '600',
    marginRight: 2,
  },

  // Modal sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: appTheme.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: theme.spacing.base,
    paddingBottom: theme.spacing.xl,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: appTheme.navy,
    paddingHorizontal: theme.spacing.base,
    paddingBottom: theme.spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: appTheme.gray,
    marginBottom: theme.spacing.sm,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.base,
    paddingHorizontal: theme.spacing.base,
  },
  modalItemSelected: {
    backgroundColor: appTheme.navy + '10',
  },
  modalItemText: {
    fontSize: 15,
    color: appTheme.text,
  },
  modalItemTextSelected: {
    color: appTheme.navy,
    fontWeight: '700',
  },

  // Danger zone — red left border matching site .warning block style
  dangerCard: {
    backgroundColor: appTheme.white,
    borderRadius: theme.borderRadius.base,
    borderLeftWidth: 4,
    borderLeftColor: appTheme.red,
    marginBottom: theme.spacing.xl,
    ...theme.shadows.sm,
  },
  dangerBody: {
    fontSize: 14,
    color: appTheme.textLight,
    marginBottom: theme.spacing.base,
    lineHeight: 20,
  },
  dangerButton: {
    alignSelf: 'flex-start',
    borderColor: appTheme.red,
  },
});