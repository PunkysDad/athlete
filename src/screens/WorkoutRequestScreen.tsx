import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
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
import { theme, commonStyles } from '../theme';
import { workoutApiService, WorkoutRequest as ApiWorkoutRequest, WorkoutPlan } from '../services/workoutApiService';

// Types
interface WorkoutRequest {
  sport: string;
  position: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  trainingPhase: 'off-season' | 'pre-season' | 'in-season' | 'post-season';
  equipment: string[];
  timeAvailable: number; // minutes
  trainingFocus: string[];
  specialRequests?: string;
}

interface WorkoutResponse {
  success: boolean;
  data?: WorkoutPlan;
  error?: string;
  cost?: number;
}

// Equipment options by category
const EQUIPMENT_OPTIONS = {
  'Basic': ['Body weight only', 'Resistance bands', 'Dumbbells'],
  'Gym Access': ['Full gym', 'Barbells', 'Cable machine', 'Leg press'],
  'Sport Specific': ['Agility ladder', 'Cones', 'Medicine ball', 'Plyometric box'],
  'Field/Court': ['Track access', 'Field access', 'Court access']
};

// Training focus options by position type
const FOCUS_OPTIONS = {
  'Strength': ['Upper body power', 'Lower body power', 'Core stability', 'Functional strength'],
  'Speed/Agility': ['Linear speed', 'Change of direction', 'First step quickness', 'Reaction time'],
  'Conditioning': ['Aerobic base', 'Anaerobic power', 'Sport-specific endurance', 'Recovery'],
  'Injury Prevention': ['Joint mobility', 'Muscle imbalances', 'Movement quality', 'Prehab exercises']
};

// Mock user data (in production, get from auth context)
const mockUser = {
  sport: 'Football',
  position: 'Wide Receiver'
};

export default function WorkoutRequestScreen() {
  const navigation = useNavigation();
  
  // Form state
  const [formData, setFormData] = useState<WorkoutRequest>({
    sport: mockUser.sport,
    position: mockUser.position,
    experienceLevel: 'intermediate',
    trainingPhase: 'off-season',
    equipment: [],
    timeAvailable: 60,
    trainingFocus: [],
    specialRequests: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (formData.equipment.length === 0) {
      newErrors.equipment = 'Please select at least one equipment option';
    }
    
    if (formData.trainingFocus.length === 0) {
      newErrors.trainingFocus = 'Please select at least one training focus';
    }
    
    if (formData.timeAvailable < 15) {
      newErrors.timeAvailable = 'Minimum workout time is 15 minutes';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit workout request
  const handleSubmitRequest = async () => {
    if (!validateForm()) {
      Alert.alert('Form Error', 'Please fix the highlighted fields');
      return;
    }

    setIsLoading(true);
    
    try {
      // Call your actual API endpoint
      const response = await workoutApiService.generateWorkout(formData);
      
      if (response.success && response.data) {
        const costText = response.cost ? ` (Cost: ${response.cost.toFixed(3)})` : '';
        
        Alert.alert(
          'Workout Generated!',
          `Your ${formData.position} workout is ready. Duration: ${response.data.estimatedDuration} minutes${costText}`,
        //   [
        //     { text: 'Cancel', style: 'cancel' },
        //     { 
        //       text: 'View Workout', 
        //       onPress: () => {
        //         navigation.navigate('WorkoutDisplay', { 
        //           workoutData: response.data 
        //         });
        //       }
        //     }
        //   ]
        );
      } else {
        throw new Error(response.error || 'Failed to generate workout');
      }
      
    } catch (error) {
      console.error('Workout generation error:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to generate workout. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Equipment selection
  const toggleEquipment = (equipment: string) => {
    const current = formData.equipment;
    const updated = current.includes(equipment)
      ? current.filter(item => item !== equipment)
      : [...current, equipment];
    
    setFormData({ ...formData, equipment: updated });
    
    if (errors.equipment) {
      setErrors({ ...errors, equipment: '' });
    }
  };

  // Focus selection
  const toggleFocus = (focus: string) => {
    const current = formData.trainingFocus;
    const updated = current.includes(focus)
      ? current.filter(item => item !== focus)
      : [...current, focus];
    
    setFormData({ ...formData, trainingFocus: updated });
    
    if (errors.trainingFocus) {
      setErrors({ ...errors, trainingFocus: '' });
    }
  };

  const renderEquipmentSection = () => (
    <Card style={[commonStyles.card, errors.equipment && styles.errorCard]}>
      <Card.Content>
        <Text style={commonStyles.heading3}>Available Equipment</Text>
        {errors.equipment && (
          <Text style={styles.errorText}>{errors.equipment}</Text>
        )}
        
        {Object.entries(EQUIPMENT_OPTIONS).map(([category, items]) => (
          <View key={category} style={styles.equipmentCategory}>
            <Text style={[commonStyles.body, styles.categoryLabel]}>{category}</Text>
            {items.map((equipment) => (
              <View key={equipment} style={styles.checkboxRow}>
                <Checkbox
                  status={formData.equipment.includes(equipment) ? 'checked' : 'unchecked'}
                  onPress={() => toggleEquipment(equipment)}
                  color={theme.colors.primary}
                />
                <Text 
                  style={[commonStyles.body, styles.checkboxLabel]}
                  onPress={() => toggleEquipment(equipment)}
                >
                  {equipment}
                </Text>
              </View>
            ))}
          </View>
        ))}
      </Card.Content>
    </Card>
  );

  const renderFocusSection = () => (
    <Card style={[commonStyles.card, errors.trainingFocus && styles.errorCard]}>
      <Card.Content>
        <Text style={commonStyles.heading3}>Training Focus</Text>
        {errors.trainingFocus && (
          <Text style={styles.errorText}>{errors.trainingFocus}</Text>
        )}
        
        {Object.entries(FOCUS_OPTIONS).map(([category, items]) => (
          <View key={category} style={styles.focusCategory}>
            <Text style={[commonStyles.body, styles.categoryLabel]}>{category}</Text>
            <View style={styles.chipContainer}>
              {items.map((focus) => (
                <Chip
                  key={focus}
                  mode={formData.trainingFocus.includes(focus) ? 'flat' : 'outlined'}
                  selected={formData.trainingFocus.includes(focus)}
                  onPress={() => toggleFocus(focus)}
                  style={[
                    styles.focusChip,
                    formData.trainingFocus.includes(focus) && {
                      backgroundColor: theme.colors.primary + '20'
                    }
                  ]}
                  textStyle={{ fontSize: 12 }}
                >
                  {focus}
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
      {/* Header */}
      <View style={styles.header}>
        <Icon name="fitness-center" size={24} color={theme.colors.primary} />
        <Text style={[commonStyles.heading2, styles.headerText]}>Generate Workout</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Position Info Card */}
        <Card style={commonStyles.card}>
          <Card.Content>
            <View style={commonStyles.rowBetween}>
              <View>
                <Text style={commonStyles.heading3}>Training For</Text>
                <Text style={[commonStyles.body, { marginTop: theme.spacing.xs }]}>
                  {formData.sport} • {formData.position}
                </Text>
              </View>
              <Icon name="sports-football" size={32} color={theme.colors.primary} />
            </View>
          </Card.Content>
        </Card>

        {/* Experience & Phase */}
        <Card style={commonStyles.card}>
          <Card.Content>
            <Text style={commonStyles.heading3}>Experience Level</Text>
            <RadioButton.Group 
              onValueChange={(value) => setFormData({ ...formData, experienceLevel: value as any })}
              value={formData.experienceLevel}
            >
              {[
                { value: 'beginner', label: 'Beginner (0-1 years)' },
                { value: 'intermediate', label: 'Intermediate (2-4 years)' },
                { value: 'advanced', label: 'Advanced (5+ years)' }
              ].map(option => (
                <View key={option.value} style={styles.radioRow}>
                  <RadioButton value={option.value} color={theme.colors.primary} />
                  <Text style={commonStyles.body}>{option.label}</Text>
                </View>
              ))}
            </RadioButton.Group>

            <Divider style={styles.divider} />

            <Text style={commonStyles.heading3}>Training Phase</Text>
            <RadioButton.Group 
              onValueChange={(value) => setFormData({ ...formData, trainingPhase: value as any })}
              value={formData.trainingPhase}
            >
              {[
                { value: 'off-season', label: 'Off-season (Skill building)' },
                { value: 'pre-season', label: 'Pre-season (Peak preparation)' },
                { value: 'in-season', label: 'In-season (Maintenance)' },
                { value: 'post-season', label: 'Post-season (Recovery)' }
              ].map(option => (
                <View key={option.value} style={styles.radioRow}>
                  <RadioButton value={option.value} color={theme.colors.primary} />
                  <Text style={commonStyles.body}>{option.label}</Text>
                </View>
              ))}
            </RadioButton.Group>
          </Card.Content>
        </Card>

        {/* Time Available */}
        <Card style={[commonStyles.card, errors.timeAvailable && styles.errorCard]}>
          <Card.Content>
            <Text style={commonStyles.heading3}>Time Available (minutes)</Text>
            {errors.timeAvailable && (
              <Text style={styles.errorText}>{errors.timeAvailable}</Text>
            )}
            <TextInput
              mode="outlined"
              value={formData.timeAvailable.toString()}
              onChangeText={(text) => {
                const minutes = parseInt(text) || 0;
                setFormData({ ...formData, timeAvailable: minutes });
                if (errors.timeAvailable && minutes >= 15) {
                  setErrors({ ...errors, timeAvailable: '' });
                }
              }}
              keyboardType="numeric"
              placeholder="e.g., 60"
              style={styles.timeInput}
              outlineColor={theme.colors.border}
              activeOutlineColor={theme.colors.primary}
            />
            <View style={styles.timePresets}>
              {[30, 45, 60, 90].map(time => (
                <Chip
                  key={time}
                  mode={formData.timeAvailable === time ? 'flat' : 'outlined'}
                  onPress={() => setFormData({ ...formData, timeAvailable: time })}
                  style={styles.timeChip}
                  textStyle={{ fontSize: 12 }}
                >
                  {time}min
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Equipment Selection */}
        {renderEquipmentSection()}

        {/* Training Focus */}
        {renderFocusSection()}

        {/* Special Requests */}
        <Card style={commonStyles.card}>
          <Card.Content>
            <Text style={commonStyles.heading3}>Special Requests (Optional)</Text>
            <TextInput
              mode="outlined"
              value={formData.specialRequests}
              onChangeText={(text) => setFormData({ ...formData, specialRequests: text })}
              placeholder="Any specific needs, injuries to work around, or goals?"
              multiline
              numberOfLines={3}
              style={styles.specialRequestsInput}
              outlineColor={theme.colors.border}
              activeOutlineColor={theme.colors.primary}
            />
          </Card.Content>
        </Card>

        {/* Generate Button */}
        <Button
          mode="contained"
          onPress={handleSubmitRequest}
          loading={isLoading}
          disabled={isLoading}
          style={styles.generateButton}
          buttonColor={theme.colors.primary}
          contentStyle={styles.generateButtonContent}
        >
          {isLoading ? (
            <View style={styles.loadingContent}>
              <ActivityIndicator size="small" color="white" />
              <Text style={styles.loadingText}>Generating workout...</Text>
            </View>
          ) : (
            'Generate My Workout'
          )}
        </Button>

        {/* Cost Info */}
        <Card style={[commonStyles.card, styles.costCard]}>
          <Card.Content>
            <View style={styles.costInfo}>
              <Icon name="info" size={16} color={theme.colors.primary} />
              <Text style={[commonStyles.caption, styles.costText]}>
                AI-generated workouts are personalized for your position and goals. 
                This will use ~$0.07 of your monthly AI quota.
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
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerText: {
    marginLeft: theme.spacing.sm,
  },
  content: {
    flex: 1,
    padding: theme.spacing.base,
  },
  errorCard: {
    borderLeftWidth: 4,
    borderLeftColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.xs,
  },
  divider: {
    marginVertical: theme.spacing.md,
  },
  timeInput: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  timePresets: {
    flexDirection: 'row',
    marginTop: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  timeChip: {
    marginRight: theme.spacing.sm,
  },
  equipmentCategory: {
    marginBottom: theme.spacing.md,
  },
  categoryLabel: {
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.sm,
    color: theme.colors.primary,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.xs,
  },
  checkboxLabel: {
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  focusCategory: {
    marginBottom: theme.spacing.md,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  focusChip: {
    marginBottom: theme.spacing.xs,
  },
  specialRequestsInput: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  generateButton: {
    marginVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.base,
  },
  generateButtonContent: {
    paddingVertical: theme.spacing.sm,
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginLeft: theme.spacing.sm,
  },
  costCard: {
    backgroundColor: theme.colors.primaryLight + '10',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    marginBottom: theme.spacing.xl,
  },
  costInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  costText: {
    marginLeft: theme.spacing.sm,
    flex: 1,
    lineHeight: 16,
  },
});