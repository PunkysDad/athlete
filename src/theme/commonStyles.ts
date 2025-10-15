import { StyleSheet } from 'react-native';
import { colors } from './colors';
import { spacing } from './spacing';
import { borderRadius } from './borderRadius';
import { shadows } from './shadows';
import { typography } from './typography';

export const commonStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  containerPadded: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.base,
  },
  
  // Card styles
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.base,
    padding: spacing.base,
    marginBottom: spacing.base,
    ...shadows.base,
  },
  
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  
  // Text styles
  heading1: {
    ...typography.heading1,
    color: colors.text,
  },
  
  heading2: {
    ...typography.heading2,
    color: colors.text,
  },
  
  heading3: {
    ...typography.heading3,
    color: colors.text,
  },
  
  body: {
    ...typography.body,
    color: colors.text,
  },
  
  bodySecondary: {
    ...typography.body,
    color: colors.textSecondary,
  },
  
  caption: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  
  // Layout styles
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Button styles
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.base,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.base,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  
  // Performance stat colors
  performanceExcellent: {
    color: colors.performance.excellent,
  },
  
  performanceGood: {
    color: colors.performance.good,
  },
  
  performanceAverage: {
    color: colors.performance.average,
  },
  
  performanceNeedsWork: {
    color: colors.performance.needsWork,
  },
  
  performancePoor: {
    color: colors.performance.poor,
  },
});

// Helper function to get performance color based on score
export const getPerformanceColor = (score: number): string => {
  if (score >= 90) return colors.performance.excellent;
  if (score >= 80) return colors.performance.good;
  if (score >= 70) return colors.performance.average;
  if (score >= 60) return colors.performance.needsWork;
  return colors.performance.poor;
};

// Helper function to get performance level text
export const getPerformanceLevel = (score: number): string => {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Good';
  if (score >= 70) return 'Average';
  if (score >= 60) return 'Needs Work';
  return 'Poor';
};