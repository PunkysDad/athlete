import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { 
  Card, 
  TextInput, 
  Button,
  Provider as PaperProvider
} from 'react-native-paper';
import {
  Modal,
  FlatList,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { theme, commonStyles } from '../theme';
import { apiService } from '../services/apiService';
import { UserService } from '../services/userService';
import { getAuth } from 'firebase/auth';

type RootStackParamList = {
  ProfileEdit: { userId: string };
  MainTabs: undefined;
};

type ProfileEditRouteProp = RouteProp<RootStackParamList, 'ProfileEdit'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Display label → backend enum value
const POSITION_ENUM_MAP: Record<string, string> = {
  // Football
  'QB': 'QB', 'RB': 'RB', 'WR': 'WR', 'OL': 'OL',
  'TE': 'TE', 'LB': 'LB', 'DB': 'DB', 'DL': 'DL',
  // Basketball
  'PG': 'PG', 'SG': 'SG', 'SF': 'SF', 'PF': 'PF', 'C': 'C',
  // Baseball
  'Pitcher': 'PITCHER', 'Catcher': 'CATCHER', 'Infield': 'INFIELD', 'Outfield': 'OUTFIELD',
  // Soccer
  'Goalkeeper': 'GOALKEEPER', 'Defender': 'DEFENDER', 'Midfielder': 'MIDFIELDER', 'Forward': 'FORWARD',
  // Hockey
  'Center': 'CENTER', 'Winger': 'WINGER', 'Defenseman': 'DEFENSEMAN', 'Goalie': 'GOALIE',
};

const SPORTS_CONFIG = {
  Football:   ['QB', 'RB', 'WR', 'OL', 'TE', 'LB', 'DB', 'DL'],
  Basketball: ['PG', 'SG', 'SF', 'PF', 'C'],
  Baseball:   ['Pitcher', 'Catcher', 'Infield', 'Outfield'],
  Soccer:     ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'],
  Hockey:     ['Center', 'Winger', 'Defenseman', 'Goalie'],
};

const GRADUATION_YEARS = Array.from(
  { length: 10 }, 
  (_, i) => (new Date().getFullYear() + i).toString()
);

// Reusable dropdown row component
function DropdownRow({
  label,
  value,
  items,
  onSelect,
}: {
  label: string;
  value: string;
  items: string[];
  onSelect: (item: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={commonStyles.body}>{label}</Text>
        <View style={styles.menuButtonRight}>
          <Text style={[commonStyles.body, { color: theme.colors.primary }]}>
            {value}
          </Text>
          <Icon name="arrow-drop-down" size={24} color={theme.colors.primary} />
        </View>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View style={styles.modalSheet}>
            <Text style={[commonStyles.heading3, styles.modalTitle]}>{label}</Text>
            <FlatList
              data={items}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    item === value && styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    onSelect(item);
                    setVisible(false);
                  }}
                >
                  <Text
                    style={[
                      commonStyles.body,
                      item === value && { color: theme.colors.primary, fontWeight: 'bold' },
                    ]}
                  >
                    {item}
                  </Text>
                  {item === value && (
                    <Icon name="check" size={20} color={theme.colors.primary} />
                  )}
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
  const route = useRoute<ProfileEditRouteProp>();
  const auth = getAuth();
  const userService = new UserService();
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Mirror the same pattern used in HomeScreen
  useEffect(() => {
    const resolveUser = async () => {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) return;
      const userData = await userService.checkUserExists(firebaseUser.uid);
      if (userData) setCurrentUserId(userData.id);
    };
    resolveUser();
  }, []);
  
  const [formData, setFormData] = useState({
    name: 'Jordan Thompson',
    email: 'jordan.thompson@email.com',
    sport: 'Football',
    position: 'Wide Receiver',
    school: 'Central High School',
    graduationYear: '2025',
  });

  const [preferences, setPreferences] = useState({
    notifications: true,
    emailUpdates: false,
    socialSharing: true,
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!currentUserId) {
      Alert.alert('Error', 'User not authenticated. Please try again.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiService.updateUserProfile(currentUserId, {
        primarySport: formData.sport ? formData.sport.toUpperCase() : null,
        primaryPosition: formData.position ? POSITION_ENUM_MAP[formData.position] ?? null : null,
      });

      if (result.success) {
        Alert.alert('Profile Updated', 'Your profile has been successfully updated.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', 'Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => navigation.goBack();

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

  const renderBasicInfoSection = () => (
    <Card style={commonStyles.card}>
      <Card.Content>
        <Text style={[commonStyles.heading3, styles.sectionTitle]}>Basic Information</Text>
        <TextInput
          label="Full Name"
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          mode="outlined"
          style={styles.input}
        />
        <TextInput
          label="Email"
          value={formData.email}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />
        <TextInput
          label="School"
          value={formData.school}
          onChangeText={(text) => setFormData({ ...formData, school: text })}
          mode="outlined"
          style={styles.input}
        />
      </Card.Content>
    </Card>
  );

  const renderAthleticInfoSection = () => (
    <Card style={commonStyles.card}>
      <Card.Content>
        <Text style={[commonStyles.heading3, styles.sectionTitle]}>Athletic Information</Text>

        <DropdownRow
          label="Sport"
          value={formData.sport}
          items={Object.keys(SPORTS_CONFIG)}
          onSelect={(sport) =>
            setFormData({
              ...formData,
              sport,
              position: SPORTS_CONFIG[sport as keyof typeof SPORTS_CONFIG][0],
            })
          }
        />

        <DropdownRow
          label="Position"
          value={formData.position}
          items={SPORTS_CONFIG[formData.sport as keyof typeof SPORTS_CONFIG] ?? []}
          onSelect={(position) => setFormData({ ...formData, position })}
        />

        <DropdownRow
          label="Graduation Year"
          value={formData.graduationYear}
          items={GRADUATION_YEARS}
          onSelect={(graduationYear) => setFormData({ ...formData, graduationYear })}
        />
      </Card.Content>
    </Card>
  );

  const renderDangerZone = () => (
    <Card style={[commonStyles.card, styles.dangerCard]}>
      <Card.Content>
        <Text style={[commonStyles.heading3, styles.sectionTitle, { color: '#dc3545' }]}>
          Danger Zone
        </Text>
        <Text style={[commonStyles.bodySecondary, { marginBottom: theme.spacing.base }]}>
          These actions cannot be undone. Please proceed with caution.
        </Text>
        <Button
          mode="outlined"
          onPress={handleDeleteAccount}
          textColor="#dc3545"
          style={[styles.dangerButton, { borderColor: '#dc3545' }]}
          icon="delete-forever"
        >
          Delete Account
        </Button>
      </Card.Content>
    </Card>
  );

  return (
    <PaperProvider>
      <View style={commonStyles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
            <Icon name="close" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={commonStyles.heading2}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave} style={styles.headerButton} disabled={isLoading}>
            <Text style={[commonStyles.body, { color: theme.colors.primary, fontWeight: 'bold' }]}>
              {isLoading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* {renderBasicInfoSection()} */}
          {renderAthleticInfoSection()}
          {renderDangerZone()}
        </ScrollView>
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.base,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerButton: {
    padding: theme.spacing.sm,
    minWidth: 60,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: theme.spacing.base,
  },
  sectionTitle: {
    marginBottom: theme.spacing.base,
    color: theme.colors.primary,
  },
  input: {
    marginBottom: theme.spacing.base,
  },
  menuButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.base,
    paddingHorizontal: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.base,
  },
  menuButtonRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: theme.spacing.base,
    paddingBottom: theme.spacing.xl,
    maxHeight: '60%',
  },
  modalTitle: {
    paddingHorizontal: theme.spacing.base,
    paddingBottom: theme.spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
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
    backgroundColor: `${theme.colors.primary}10`,
  },
  dangerCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
    marginBottom: theme.spacing.xl,
  },
  dangerButton: {
    alignSelf: 'flex-start',
  },
});