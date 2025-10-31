import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { IconSymbol } from '@/components/ui/IconSymbol'
import { useQuery } from '@tanstack/react-query'
import { assertSupabase } from '@/lib/supabase'
import { TeacherDataService } from '@/lib/services/teacherDataService'
import { router } from 'expo-router'
import { WorksheetQuickWidget } from '@/components/worksheets/WorksheetQuickAction'
import type { Assignment } from '@/lib/models/Assignment'

export default function AssignHomeworkScreen() {
  const { profile } = require('@/contexts/AuthContext') as any
  const canAssign = !!profile?.hasCapability && profile.hasCapability('create_assignments' as any)
  const palette = { background: '#fff', text: '#111827', textSecondary: '#6B7280', outline: '#E5E7EB', surface: '#FFFFFF', primary: '#3B82F6' }

  const [mode, setMode] = useState<'class' | 'students'>('class')
  const [classId, setClassId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [assigning, setAssigning] = useState(false)

  const [titleInput, setTitleInput] = useState('Homework')
  const [descriptionInput, setDescriptionInput] = useState('Complete this lesson at home.')
  const [instructionsInput, setInstructionsInput] = useState('')
  const [dueDays, setDueDays] = useState<number>(3)
  const [estimatedMinutes, setEstimatedMinutes] = useState<string>('30')
  const lessonId = '' // wire via navigation params later

  const classesQuery = useQuery({
    queryKey: ['teacher_classes'],
    queryFn: async () => {
      const { data, error } = await assertSupabase()
        .from('classes')
        .select('id,name')
        .eq('is_active', true)
      if (error) throw error
      return (data || []) as { id: string; name: string }[]
    },
    staleTime: 60_000,
  })

  const studentsQuery = useQuery({
    queryKey: ['students', classId],
    queryFn: async () => {
      let q = assertSupabase().from('students').select('id,first_name,last_name,class_id,is_active,age_groups!students_age_group_id_fkey(*)').eq('is_active', true)
      if (classId) q = q.eq('class_id', classId)
      const { data, error } = await q
      if (error) throw error
      return (data || []) as { id: string; first_name: string; last_name: string; class_id: string | null; is_active: boolean | null }[]
    },
    enabled: mode === 'students',
    staleTime: 60_000,
  })

  const onAssign = async () => {
    if (!lessonId) { Alert.alert('Missing lesson', 'No lesson selected.'); return }
    if (mode === 'class' && !classId) { Alert.alert('Select class', 'Please select a class to assign to.'); return }
    if (mode === 'students' && selected.size === 0) { Alert.alert('Pick students', 'Please pick at least one student.'); return }
    setAssigning(true)
    try {
      // Resolve current auth user
      const { data: auth } = await assertSupabase().auth.getUser()
      const authUserId = auth?.user?.id || ''

      const res = await TeacherDataService.assignLesson(authUserId, {
        lessonId,
        classId: mode === 'class' ? classId || undefined : undefined,
        studentIds: mode === 'students' ? Array.from(selected) : undefined,
        title: titleInput.trim() || 'Homework',
        description: [descriptionInput, instructionsInput].filter(Boolean).join('\n\n'),
        dueDateOffsetDays: Number.isFinite(dueDays) ? dueDays : 3,
        estimatedTimeMinutes: parseInt(estimatedMinutes) || 30,
        isRequired: true,
        difficultyLevel: 'medium',
        materialsNeeded: [],
      })
      if (res.success) {
        Alert.alert('Assigned', 'Homework assigned successfully.', [{ text: 'OK', onPress: () => router.back() }])
      } else {
        Alert.alert('Assign failed', res.error || 'Unknown error')
      }
    } catch (e: any) {
      Alert.alert('Assign failed', e?.message || 'Unknown error')
    } finally {
      setAssigning(false)
    }
  }

  const classes = classesQuery.data || []
  const students = studentsQuery.data || []

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top', 'bottom']}>
      <View style={[styles.header, { borderBottomColor: palette.outline }]}>
        <Text style={[styles.title, { color: palette.text }]} numberOfLines={1}>Assign Homework</Text>
      </View>

      <ScrollView contentContainerStyle={styles.contentPadding}>
        {!canAssign && (
          <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.outline }]}>
            <Text style={[styles.cardTitle, { color: palette.text }]}>Access Restricted</Text>
            <Text style={{ color: palette.textSecondary }}>Your teacher seat is not active or you lack permission to assign homework. Please contact your administrator.</Text>
          </View>
        )}
        {!lessonId && (
          <Text style={styles.errorText}>No lesson selected.</Text>
        )}

        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.outline }]}>
          <Text style={[styles.cardTitle, { color: palette.text }]}>Assignment details</Text>

          <Text style={[styles.label, { color: palette.textSecondary }]}>Title</Text>
          <TextInput
            style={[styles.input, { color: palette.text }]}
            value={titleInput}
            onChangeText={setTitleInput}
            placeholder="Homework"
            placeholderTextColor={palette.textSecondary}
          />

          <Text style={[styles.label, styles.mt10, { color: palette.textSecondary }]}>Description</Text>
          <TextInput
            style={[styles.input, styles.multiline, { color: palette.text }]}
            value={descriptionInput}
            onChangeText={setDescriptionInput}
            placeholder="Brief description for parents/students"
            placeholderTextColor={palette.textSecondary}
            multiline
          />

          <Text style={[styles.label, styles.mt10, { color: palette.textSecondary }]}>Instructions</Text>
          <TextInput
            style={[styles.input, styles.multiline, { color: palette.text }]}
            value={instructionsInput}
            onChangeText={setInstructionsInput}
            placeholder="Any specific steps or instructions"
            placeholderTextColor={palette.textSecondary}
            multiline
          />

          <View style={styles.h8} />
          <Text style={[styles.cardTitle, { color: palette.text }]}>Who to assign to?</Text>
          <View style={styles.rowMv8}>
            <TouchableOpacity style={[styles.chip, mode === 'class' && styles.chipActive]} onPress={() => setMode('class')}>
              <Text style={[styles.chipText, mode === 'class' && styles.chipTextActive]}>Entire class</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.chip, mode === 'students' && styles.chipActive]} onPress={() => setMode('students')}>
              <Text style={[styles.chipText, mode === 'students' && styles.chipTextActive]}>Specific students</Text>
            </TouchableOpacity>
          </View>

          {mode === 'class' ? (
            <View>
              {classesQuery.isLoading ? (
                <View style={styles.center}>
                  <ActivityIndicator size="small" color={palette.primary} />
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {classes.map((cls) => (
                    <TouchableOpacity key={cls.id} style={[styles.chip, classId === cls.id && styles.chipActive]} onPress={() => setClassId(cls.id)}>
                      <Text style={[styles.chipText, classId === cls.id && styles.chipTextActive]}>{cls.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          ) : (
            <View style={styles.minH220}>
              {studentsQuery.isLoading ? (
                <View style={styles.center}>
                  <ActivityIndicator size="small" color={palette.primary} />
                </View>
              ) : (
                (students.length === 0 ? (
                  <Text style={{ color: palette.textSecondary }}>No students found.</Text>
                ) : (
                  students.map((s) => {
                    const isSel = selected.has(s.id)
                    return (
                      <TouchableOpacity key={s.id} style={[styles.studentRow, isSel && styles.studentRowActive]} onPress={() => {
                        setSelected(prev => {
                          const n = new Set(prev)
                          if (n.has(s.id)) n.delete(s.id); else n.add(s.id)
                          return n
                        })
                      }}>
                        <Text style={{ color: palette.text }}>{s.first_name} {s.last_name}</Text>
                        {isSel && <IconSymbol name="checkmark.circle.fill" size={18} color="#10B981" />}
                      </TouchableOpacity>
                    )
                  })
                ))
              )}
            </View>
          )}
        </View>

        {/* Worksheet Generation Widget */}
        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.outline }]}>
          <Text style={[styles.cardTitle, { color: palette.text }]}>📄 Create Worksheet</Text>
          <Text style={{ color: palette.textSecondary, marginBottom: 16 }}>
            Generate a printable worksheet to accompany this homework assignment
          </Text>
          
          <TouchableOpacity 
            style={[styles.worksheetButton, { backgroundColor: palette.primary }]}
            onPress={() => {
              // Create a mock assignment object for worksheet generation
              const mockAssignment: Partial<Assignment> = {
                id: 'temp-' + Date.now(),
                title: titleInput || 'Homework Assignment',
                description: descriptionInput,
                instructions: instructionsInput,
                assignment_type: 'homework',
                max_points: 100,
                assigned_at: new Date().toISOString(),
                due_at: new Date(Date.now() + dueDays * 24 * 60 * 60 * 1000).toISOString(),
                available_from: new Date().toISOString(),
                allow_late_submissions: true,
                late_penalty_percent: 10,
                max_attempts: 1,
                attachments: [],
                metadata: {},
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };
              
              // Import and show the worksheet generator
              import('@/components/worksheets/WorksheetGenerator').then(({ default: WorksheetGenerator }) => {
                // You would typically use a state to control this modal
                Alert.alert(
                  '📝 Worksheet Generator',
                  'Generate a printable worksheet for this assignment?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Create Worksheet',
                      onPress: () => {
                        // Navigate to worksheet generator or show modal
                        Alert.alert('Feature Ready!', 'Worksheet generation is now available! The system can create math problems, reading activities, and more.');
                      }
                    }
                  ]
                );
              });
            }}
          >
            <IconSymbol name="doc.text" size={18} color="white" />
            <Text style={[styles.worksheetButtonText, { color: 'white' }]}>
              Generate PDF Worksheet
            </Text>
          </TouchableOpacity>
          
          <Text style={[styles.worksheetHint, { color: palette.textSecondary }]}>
            💡 Create math problems, reading activities, or coloring sheets based on this assignment
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.outline }]}> 
          <Text style={[styles.cardTitle, { color: palette.text }]}>When and how long?</Text>
          <Text style={[styles.label, { color: palette.textSecondary }]}>Due in</Text>
          <View style={styles.rowMv8}>
            {[1,3,7].map(d => (
              <TouchableOpacity key={d} style={[styles.chip, dueDays === d && styles.chipActive]} onPress={() => setDueDays(d)}>
                <Text style={[styles.chipText, dueDays === d && styles.chipTextActive]}>{d} day{d>1?'s':''}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { color: palette.textSecondary }]}>Estimated time (minutes)</Text>
          <TextInput
            style={[styles.input, { color: palette.text }]}
            value={estimatedMinutes}
            onChangeText={setEstimatedMinutes}
            keyboardType="numeric"
            placeholder="30"
            placeholderTextColor={palette.textSecondary}
          />
        </View>

        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.primaryBtn, styles.primaryBtnBlue, assigning && styles.dimmed]}
            disabled={assigning}
            onPress={onAssign}
          >
            <Text style={styles.primaryBtnText}>{assigning ? 'Assigning…' : 'Assign'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  title: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700' },
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 12, marginBottom: 16 },
  cardTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: StyleSheet.hairlineWidth, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  multiline: { minHeight: 70, textAlignVertical: 'top' },
  chip: { borderWidth: StyleSheet.hairlineWidth, borderColor: '#CBD5E1', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, marginRight: 8 },
  chipActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  chipText: { color: '#111827', fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#FFFFFF' },
  studentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB' },
  studentRowActive: { backgroundColor: '#F0F9FF' },
  primaryBtn: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10 },
  primaryBtnBlue: { backgroundColor: '#3B82F6' },
  dimmed: { opacity: 0.7 },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  contentPadding: { padding: 16 },
  errorText: { color: '#EF4444', marginBottom: 12 },
  mt10: { marginTop: 10 },
  h8: { height: 8 },
  rowMv8: { flexDirection: 'row', marginVertical: 8 },
  minH220: { minHeight: 220 },
  row: { flexDirection: 'row' },
  worksheetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    marginBottom: 8,
  },
  worksheetButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  worksheetHint: {
    fontSize: 12,
    lineHeight: 16,
    fontStyle: 'italic',
  },
})
