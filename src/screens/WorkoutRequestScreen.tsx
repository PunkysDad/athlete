import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getAuth } from 'firebase/auth';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Button,
  RadioButton,
  Checkbox,
  TextInput,
  Chip,
  Divider,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { appTheme } from '../theme/appTheme';
import { theme, commonStyles } from '../theme';
import { workoutApiService } from '../services/workoutApiService';
import { UserService } from '../services/userService';
import { WorkoutData, WorkoutRequest } from '../interfaces/interfaces';
import { RootStackParamList } from '../types/types';
import TrialLimitModal from '../components/TrialLimitModal';
import { useUpgrade } from '../context/UpgradeContext';

type WorkoutRequestNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const EQUIPMENT_OPTIONS = {
  'Basic':          ['Body weight only', 'Resistance bands', 'Dumbbells', 'Kettlebells'],
  'Gym Access':     ['Full gym', 'Barbells', 'Cable machine', 'Leg press'],
  'Sport Specific': ['Agility ladder', 'Cones', 'Medicine ball', 'Plyometric box'],
  'Field/Court':    ['Track access', 'Field access', 'Court access'],
};

const FOCUS_OPTIONS = {
  'Strength':          ['Upper body power', 'Lower body power', 'Core stability', 'Functional strength'],
  'Speed/Agility':     ['Linear speed', 'Change of direction', 'First step quickness', 'Reaction time'],
  'Conditioning':      ['Aerobic base', 'Anaerobic power', 'Sport-specific endurance', 'Recovery'],
  'Injury Prevention': ['Joint mobility', 'Muscle imbalances', 'Movement quality', 'Prehab exercises'],
};

const ENUM_SPORT_MAP: Record<string, string> = {
  FOOTBALL: 'Football', BASKETBALL: 'Basketball', BASEBALL: 'Baseball',
  SOCCER: 'Soccer', HOCKEY: 'Hockey',
};
const ENUM_POSITION_MAP: Record<string, string> = {
  QB: 'QB', RB: 'RB', WR: 'WR', OL: 'OL', TE: 'TE', LB: 'LB', DB: 'DB', DL: 'DL',
  PG: 'PG', SG: 'SG', SF: 'SF', PF: 'PF', C: 'C',
  PITCHER: 'Pitcher', CATCHER: 'Catcher', INFIELD: 'Infield', OUTFIELD: 'Outfield',
  GOALKEEPER: 'Goalkeeper', DEFENDER: 'Defender', MIDFIELDER: 'Midfielder', FORWARD: 'Forward',
  CENTER: 'Center', WINGER: 'Winger', DEFENSEMAN: 'Defenseman', GOALIE: 'Goalie',
};

export default function WorkoutRequestScreen() {
  const navigation = useNavigation<WorkoutRequestNavigationProp>();
  const userService = new UserService();

  const [userSport, setUserSport] = useState('');
  const [userPosition, setUserPosition] = useState('');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [formData, setFormData] = useState<WorkoutRequest>({
    sport: '',
    position: '',
    experienceLevel: 'intermediate',
    trainingPhase: 'off-season',
    equipment: [],
    timeAvailable: 60,
    trainingFocus: [],
    specialRequests: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [trialLimitVisible, setTrialLimitVisible] = useState(false);
  const [modalType, setModalType] = useState<'trial' | 'budgetBasic' | 'budgetPremium'>('trial');
  const [userSubscriptionTier, setUserSubscriptionTier] = useState<string | undefined>();
  const { onUpgradePress } = useUpgrade();

  useFocusEffect(
    useCallback(() => {
      const loadUserProfile = async () => {
        setProfileLoading(true);
        try {
          const firebaseUser = getAuth().currentUser;
          if (!firebaseUser) return;
          const userData = await userService.checkUserExists(firebaseUser.uid);
          if (userData) {
            const displaySport = ENUM_SPORT_MAP[userData.primarySport] ?? userData.primarySport ?? '';
            const displayPosition = ENUM_POSITION_MAP[userData.primaryPosition] ?? userData.primaryPosition ?? '';
            setCurrentUserId(userData.id);
            setUserSport(displaySport);
            setUserPosition(displayPosition);
            setUserSubscriptionTier(userData.subscriptionTier);
            setFormData(prev => ({ ...prev, sport: displaySport, position: displayPosition }));
          }
        } catch (err) {
          console.error('Failed to load user profile:', err);
        } finally {
          setProfileLoading(false);
        }
      };
      loadUserProfile();
    }, [])
  );

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (formData.equipment.length === 0) newErrors.equipment = 'Please select at least one equipment option';
    if (formData.trainingFocus.length === 0) newErrors.trainingFocus = 'Please select at least one training focus';
    if (formData.timeAvailable < 15) newErrors.timeAvailable = 'Minimum workout time is 15 minutes';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitRequest = async () => {
    if (!validateForm()) {
      Alert.alert('Form Error', 'Please fix the highlighted fields');
      return;
    }
    let resolvedUserId = currentUserId;
    if (!resolvedUserId) {
      try {
        const firebaseUser = getAuth().currentUser;
        if (!firebaseUser) throw new Error('Not authenticated');
        const userResponse = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/v1/users/firebase/${firebaseUser.uid}`
        );
        const userData = await userResponse.json();
        resolvedUserId = userData.id;
        setCurrentUserId(resolvedUserId);
      } catch (error) {
        const message = error instanceof Error ? error.message : '';
        if (message.includes('Monthly AI budget reached')) {
          if (userSubscriptionTier === 'PREMIUM') {
            setModalType('budgetPremium');
          } else {
            setModalType('budgetBasic');
          }
          setTrialLimitVisible(true);
        } else if (
          message.includes('Trial') || message.includes('trial') ||
          message.includes('limit reached') || message.includes('budget reached') ||
          message.includes('subscription')
        ) {
          setModalType('trial');
          setTrialLimitVisible(true);
        } else {
          Alert.alert('Error', message || 'Failed to generate workout. Please try again.');
        }
      }
    }
    setIsLoading(true);
    try {
      const response = await workoutApiService.generateWorkout(formData, resolvedUserId!);
      if (response.success && response.data) {
        const workoutData: WorkoutData = {
          ...response.data,
          sport: formData.sport,
          position: formData.position,
        };
        Alert.alert(
          'Workout Generated!',
          `Your ${formData.position} workout is ready. Duration: ${response.data.estimatedDuration} minutes`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'View Workout', onPress: () => navigation.navigate('WorkoutDisplay', { workoutData }) },
          ]
        );
      } else {
        throw new Error(response.error || 'Failed to generate workout');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message.includes('Monthly AI budget reached')) {
        if (userSubscriptionTier === 'PREMIUM') {
          setModalType('budgetPremium');
        } else {
          setModalType('budgetBasic');
        }
        setTrialLimitVisible(true);
      } else if (
        message.includes('Trial') || message.includes('trial') ||
        message.includes('limit reached') || message.includes('budget reached') ||
        message.includes('subscription')
      ) {
        setModalType('trial');
        setTrialLimitVisible(true);
      } else {
        Alert.alert('Error', message || 'Failed to generate workout. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleEquipment = (item: string) => {
    const updated = formData.equipment.includes(item)
      ? formData.equipment.filter(e => e !== item)
      : [...formData.equipment, item];
    setFormData({ ...formData, equipment: updated });
    if (errors.equipment) setErrors({ ...errors, equipment: '' });
  };

  const toggleFocus = (item: string) => {
    const updated = formData.trainingFocus.includes(item)
      ? formData.trainingFocus.filter(f => f !== item)
      : [...formData.trainingFocus, item];
    setFormData({ ...formData, trainingFocus: updated });
    if (errors.trainingFocus) setErrors({ ...errors, trainingFocus: '' });
  };

  const renderEquipmentSection = () => (
    <Card style={[styles.card, errors.equipment && styles.errorCard]}>
      <Card.Content>
        <Text style={styles.sectionTitle}>Available Equipment</Text>
        {errors.equipment && <Text style={styles.errorText}>{errors.equipment}</Text>}
        {Object.entries(EQUIPMENT_OPTIONS).map(([category, items]) => (
          <View key={category} style={styles.optionGroup}>
            <Text style={styles.categoryLabel}>{category}</Text>
            {items.map(item => (
              <TouchableOpacity
                key={item}
                style={styles.checkboxRow}
                onPress={() => toggleEquipment(item)}
                activeOpacity={0.7}
              >
                <Checkbox
                  status={formData.equipment.includes(item) ? 'checked' : 'unchecked'}
                  onPress={() => toggleEquipment(item)}
                  color={appTheme.red}
                />
                <Text style={styles.optionLabel}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </Card.Content>
    </Card>
  );

  const renderFocusSection = () => (
    <Card style={[styles.card, errors.trainingFocus && styles.errorCard]}>
      <Card.Content>
        <Text style={styles.sectionTitle}>Training Focus</Text>
        {errors.trainingFocus && <Text style={styles.errorText}>{errors.trainingFocus}</Text>}
        {Object.entries(FOCUS_OPTIONS).map(([category, items]) => (
          <View key={category} style={styles.optionGroup}>
            <Text style={styles.categoryLabel}>{category}</Text>
            <View style={styles.chipContainer}>
              {items.map(item => (
                <Chip
                  key={item}
                  mode={formData.trainingFocus.includes(item) ? 'flat' : 'outlined'}
                  selected={formData.trainingFocus.includes(item)}
                  onPress={() => toggleFocus(item)}
                  style={[styles.chip, formData.trainingFocus.includes(item) && styles.chipSelected]}
                  selectedColor={appTheme.red}
                  textStyle={{ fontSize: 12, color: formData.trainingFocus.includes(item) ? appTheme.white : appTheme.textMuted }}
                >
                  {item}
                </Chip>
              ))}
            </View>
          </View>
        ))}
      </Card.Content>
    </Card>
  );

  return (
    <View style={commonStyles.container}>
      <TrialLimitModal
        visible={trialLimitVisible}
        limitType="workout"
        modalType={modalType}
        onDismiss={() => setTrialLimitVisible(false)}
        onUpgrade={() => {
          setTrialLimitVisible(false);
          onUpgradePress();
        }}
      />

      <View style={styles.header}>
        <Icon name="fitness-center" size={22} color={appTheme.neonGreen} />
        <Text style={styles.headerTitle}>Generate Workout</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        <Card style={styles.card}>
          <Card.Content>
            <View style={commonStyles.rowBetween}>
              <View>
                <Text style={styles.sectionTitle}>Training For</Text>
                {profileLoading ? (
                  <ActivityIndicator size="small" color={appTheme.red} style={{ marginTop: 4 }} />
                ) : (
                  <Text style={styles.trainingForText}>
                    {userSport || '—'} • {userPosition || '—'}
                  </Text>
                )}
              </View>
              <Icon name="sports" size={32} color={appTheme.neonGreen} />
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Experience Level</Text>
            <RadioButton.Group
              onValueChange={(v) => setFormData({ ...formData, experienceLevel: v as any })}
              value={formData.experienceLevel}
            >
              {[
                { value: 'beginner',     label: 'Beginner (0–1 years)' },
                { value: 'intermediate', label: 'Intermediate (2–4 years)' },
                { value: 'advanced',     label: 'Advanced (5+ years)' },
              ].map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={styles.radioRow}
                  onPress={() => setFormData({ ...formData, experienceLevel: opt.value as any })}
                  activeOpacity={0.7}
                >
                  <RadioButton value={opt.value} color={appTheme.red} />
                  <Text style={styles.optionLabel}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </RadioButton.Group>

            <Divider style={styles.divider} />

            <Text style={styles.sectionTitle}>Training Phase</Text>
            <RadioButton.Group
              onValueChange={(v) => setFormData({ ...formData, trainingPhase: v as any })}
              value={formData.trainingPhase}
            >
              {[
                { value: 'off-season',  label: 'Off-season (Skill building)' },
                { value: 'pre-season',  label: 'Pre-season (Peak preparation)' },
                { value: 'in-season',   label: 'In-season (Maintenance)' },
                { value: 'post-season', label: 'Post-season (Recovery)' },
              ].map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={styles.radioRow}
                  onPress={() => setFormData({ ...formData, trainingPhase: opt.value as any })}
                  activeOpacity={0.7}
                >
                  <RadioButton value={opt.value} color={appTheme.red} />
                  <Text style={styles.optionLabel}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </RadioButton.Group>
          </Card.Content>
        </Card>

        <Card style={[styles.card, errors.timeAvailable && styles.errorCard]}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Time Available (minutes)</Text>
            {errors.timeAvailable && <Text style={styles.errorText}>{errors.timeAvailable}</Text>}
            <TextInput
              mode="outlined"
              value={formData.timeAvailable.toString()}
              onChangeText={(text) => {
                const minutes = parseInt(text) || 0;
                setFormData({ ...formData, timeAvailable: minutes });
                if (errors.timeAvailable && minutes >= 15) setErrors({ ...errors, timeAvailable: '' });
              }}
              keyboardType="numeric"
              placeholder="e.g., 60"
              style={styles.textInput}
              outlineColor={appTheme.border}
              activeOutlineColor={appTheme.red}
              textColor={appTheme.text}
              placeholderTextColor={appTheme.textMuted}
            />
            <View style={styles.chipContainer}>
              {[30, 45, 60, 90].map(t => (
                <Chip
                  key={t}
                  mode={formData.timeAvailable === t ? 'flat' : 'outlined'}
                  onPress={() => setFormData({ ...formData, timeAvailable: t })}
                  style={[styles.chip, formData.timeAvailable === t && styles.chipSelected]}
                  selectedColor={appTheme.red}
                  textStyle={{ fontSize: 12, color: formData.timeAvailable === t ? appTheme.white : appTheme.textMuted }}
                >
                  {t}min
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>

        {renderEquipmentSection()}
        {renderFocusSection()}

        {/* <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Special Requests (Optional)</Text>
            <TextInput
              mode="outlined"
              value={formData.specialRequests}
              onChangeText={(text) => setFormData({ ...formData, specialRequests: text })}
              placeholder="Any specific needs, injuries to work around, or goals?"
              multiline
              numberOfLines={3}
              style={styles.textInput}
              outlineColor={appTheme.border}
              activeOutlineColor={appTheme.red}
              textColor={appTheme.text}
              placeholderTextColor={appTheme.textMuted}
            />
          </Card.Content>
        </Card> */}

        <Button
          mode="contained"
          onPress={handleSubmitRequest}
          loading={isLoading}
          disabled={isLoading}
          style={styles.generateButton}
          buttonColor={appTheme.red}
          textColor={appTheme.white}
          contentStyle={styles.buttonContent}
          theme={{ colors: { onSurfaceDisabled: appTheme.white } }}
        >
          {isLoading ? 'Generating workout...' : 'Generate My Workout'}
        </Button>

        <Card style={styles.costCard}>
          <Card.Content>
            <View style={styles.costRow}>
              <Icon name="info" size={16} color={appTheme.red} />
              <Text style={styles.costText}>
                AI-generated workouts are personalised for your position and goals.
              </Text>
            </View>
          </Card.Content>
        </Card>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.base,
    backgroundColor: appTheme.navyDark,
    borderBottomWidth: 1,
    borderBottomColor: appTheme.border,
  },
  headerTitle: {
    marginLeft: theme.spacing.sm,
    fontSize: 17,
    fontWeight: '700',
    color: appTheme.white,
  },
  content: {
    flex: 1,
    padding: theme.spacing.base,
    backgroundColor: appTheme.bg,
  },
  card: {
    backgroundColor: appTheme.bgCard,
    borderRadius: theme.borderRadius.base,
    marginBottom: theme.spacing.base,
    borderWidth: 1,
    borderColor: appTheme.border,
    ...theme.shadows.sm,
  },
  errorCard: {
    borderLeftWidth: 4,
    borderLeftColor: appTheme.red,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: appTheme.white,
    marginBottom: theme.spacing.base,
  },
  trainingForText: {
    fontSize: 15,
    color: appTheme.textMuted,
    marginTop: 4,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: appTheme.textMuted,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  optionGroup: {
    marginBottom: theme.spacing.md,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.xs,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.xs,
  },
  optionLabel: {
    marginLeft: theme.spacing.sm,
    fontSize: 15,
    color: appTheme.text,
    flex: 1,
  },
  divider: {
    marginVertical: theme.spacing.md,
    backgroundColor: appTheme.border,
  },
  textInput: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    backgroundColor: appTheme.bgElevated,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  chip: {
    marginBottom: theme.spacing.xs,
    borderColor: appTheme.border,
  },
  chipSelected: {
    backgroundColor: appTheme.red + '25',
    borderColor: appTheme.red,
  },
  errorText: {
    color: appTheme.red,
    fontSize: 12,
    marginBottom: theme.spacing.sm,
  },
  generateButton: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.base,
  },
  buttonContent: {
    paddingVertical: theme.spacing.sm,
  },
  costCard: {
    backgroundColor: appTheme.bgCard,
    borderRadius: theme.borderRadius.base,
    borderLeftWidth: 4,
    borderLeftColor: appTheme.red,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: appTheme.border,
    ...theme.shadows.sm,
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  costText: {
    marginLeft: theme.spacing.sm,
    flex: 1,
    fontSize: 12,
    color: appTheme.textMuted,
    lineHeight: 18,
  },
});