import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAuth, usePermissions } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ParentDashboardWrapper from '@/components/dashboard/ParentDashboardWrapper';
import { RoleBasedHeader } from '@/components/RoleBasedHeader';
import { track } from '@/lib/analytics';
import { DesktopLayout } from '@/components/layout/DesktopLayout';

export default function ParentDashboardScreen() {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();
  const { user, profile, loading: authLoading, profileLoading } = useAuth();
  const permissions = usePermissions();
  const { ready: subscriptionReady, tier } = useSubscription();
  const isAuthMissing = !user?.id;

  // Enforce RBAC: must be parent role with dashboard access
  // Add defensive checks to handle initialization states
  const canView = permissions?.hasRole ? permissions.hasRole('parent') : false;
  const hasAccess = permissions?.can ? permissions.can('access_mobile_app') : false;

  // Features enabled based on tier (memoized to avoid effect loops)
  const featuresEnabled = React.useMemo(() => [
    'homework_help',
    'language_switching',
    ...(tier === 'pro' || tier === 'enterprise' ? ['advanced_analytics'] : []),
    ...(tier === 'free' && Platform.OS === 'android' ? ['ads'] : []),
  ], [tier]);

  // Track dashboard view - MUST be called before any early returns
  React.useEffect(() => {
    if (canView && hasAccess && subscriptionReady) {
      track('edudash.dashboard.view', {
        role: 'parent',
        user_id: user?.id,
        features_enabled: featuresEnabled,
        tier,
        platform: Platform.OS,
      });
    }
  }, [canView, hasAccess, subscriptionReady, tier, user?.id, featuresEnabled]);

  // Safe redirect effect (top-level) to avoid rule-of-hooks violations and loops
  const hasRedirectedRef = React.useRef(false);
  React.useEffect(() => {
    if (hasRedirectedRef.current) return;
    if (!authLoading && !profileLoading) {
      if (isAuthMissing) {
        hasRedirectedRef.current = true;
        track('edudash.auth.redirect_to_sign_in', {
          reason: 'missing_session',
        });
        router.replace('/sign-in');
        return;
      }
      if (!canView || !hasAccess) {
        hasRedirectedRef.current = true;
        track('edudash.dashboard.access_denied_redirect', {
          user_id: user?.id,
          role: profile?.role,
          reason: !hasAccess ? 'no_mobile_access' : 'role_mismatch',
        });
        router.replace('/profiles-gate');
      }
    }
  }, [authLoading, profileLoading, isAuthMissing, canView, hasAccess, user?.id, profile?.role]);

  // Create styles hook before any conditional returns
  const deniedStyles = React.useMemo(() => StyleSheet.create({
    deniedContainer: {
      flex: 1,
      backgroundColor: theme.background,
    },
    deniedGradient: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
    },
    deniedTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.text,
      marginTop: 24,
      marginBottom: 16,
      textAlign: 'center',
    },
    deniedText: {
      fontSize: 16,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 32,
    },
    accountButton: {
      borderRadius: 25,
      overflow: 'hidden',
    },
    accountButtonGradient: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    accountButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#000000',
      marginRight: 8,
    },
  }), [theme]);

  // Early return after all hooks are called
  if (isAuthMissing || !canView || !hasAccess) {
    const buttonAction = () => router.replace(isAuthMissing ? '/sign-in' : '/profiles-gate');
    const buttonText = isAuthMissing ? 'Go to Sign in' : 'Go to Profiles';
    const titleText = isAuthMissing ? 'Redirecting to sign in...' : 'Redirecting...';
    const subtitleText = isAuthMissing
      ? 'Your session is missing or expired'
      : 'You will be redirected shortly. If this screen stays, tap below.';

    return (
      <View style={{ flex: 1 }}>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView edges={['top']} style={deniedStyles.deniedContainer}>
          <LinearGradient
            colors={isDark 
              ? ['#0b1220', '#1a0a2e', '#16213e']
              : ['#ffffff', '#f8f9fa', '#e9ecef']
            }
            style={deniedStyles.deniedGradient}
          >
            <Ionicons name="person-add" size={64} color="#00f5ff" />
            <Text style={deniedStyles.deniedTitle}>{titleText}</Text>
            <Text style={deniedStyles.deniedText}>{subtitleText}</Text>
            <TouchableOpacity style={deniedStyles.accountButton} onPress={buttonAction}>
              <LinearGradient colors={["#00f5ff", "#0080ff"]} style={deniedStyles.accountButtonGradient}>
                <Text style={deniedStyles.accountButtonText}>{buttonText}</Text>
                <Ionicons name="chevron-forward" size={18} color="#000" />
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <DesktopLayout role="parent">
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={theme.headerBackground}
          translucent={false}
        />
        <Stack.Screen options={{ headerShown: false }} />
        <RoleBasedHeader showBackButton={false} />
        <ParentDashboardWrapper />
      </View>
    </DesktopLayout>
  );
}
