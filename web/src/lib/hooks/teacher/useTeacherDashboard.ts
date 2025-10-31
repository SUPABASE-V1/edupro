'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface TeacherMetrics {
  totalStudents: number;
  totalClasses: number;
  pendingGrading: number;
  upcomingLessons: number;
}

interface ClassData {
  id: string;
  name: string;
  grade: string;
  studentCount: number;
  pendingAssignments: number;
  upcomingLessons: number;
}

export function useTeacherDashboard(userId?: string) {
  const [metrics, setMetrics] = useState<TeacherMetrics>({
    totalStudents: 0,
    totalClasses: 0,
    pendingGrading: 0,
    upcomingLessons: 0,
  });
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const supabase = createClient();

      // Get teacher's profile (profiles-first architecture)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, preschool_id')
        .eq('id', userId)
        .maybeSingle();

      if (profileError || !profile) {
        throw new Error('Failed to fetch profile data');
      }

      // userId is already auth.uid() which equals profiles.id
      const teacherId = userId;
      const preschoolId = profile.preschool_id;

      // Fetch classes assigned to this teacher (defensive query)
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('id, name, grade_level')
        .eq('teacher_id', teacherId)
        .eq('preschool_id', preschoolId)
        .eq('is_active', true);

      if (classesError) {
        console.error('Error fetching classes:', classesError);
        // Don't throw - set empty data and continue
        setClasses([]);
        setMetrics({
          totalStudents: 0,
          totalClasses: 0,
          pendingGrading: 0,
          upcomingLessons: 0,
        });
        setError(null);
        setLoading(false);
        return;
      }

      // For each class, get student count and pending assignments (with error handling)
      const classesWithMetrics = await Promise.all(
        (classesData || []).map(async (cls) => {
          let studentCount = 0;
          
          // Try to get student count - handle gracefully if students table has issues
          try {
            const { count, error: countError } = await supabase
              .from('students')
              .select('*', { count: 'exact', head: true })
              .eq('class_id', cls.id)
              .eq('preschool_id', preschoolId);
            
            if (!countError && count !== null) {
              studentCount = count;
            }
          } catch (err) {
            console.log('Could not fetch student count for class:', cls.id);
          }

          // Get pending assignments count (simplified - would need proper assignment tracking)
          const pendingAssignments = 0; // Placeholder - implement based on your schema
          const upcomingLessons = 0; // Placeholder - implement based on your schema

          return {
            id: cls.id,
            name: cls.name,
            grade: cls.grade_level || cls.grade || 'N/A',
            studentCount,
            pendingAssignments,
            upcomingLessons,
          };
        })
      );

      setClasses(classesWithMetrics);

      // Calculate aggregate metrics
      const totalStudents = classesWithMetrics.reduce((sum, cls) => sum + cls.studentCount, 0);
      const totalClasses = classesWithMetrics.length;
      const pendingGrading = classesWithMetrics.reduce((sum, cls) => sum + cls.pendingAssignments, 0);
      const upcomingLessons = classesWithMetrics.reduce((sum, cls) => sum + cls.upcomingLessons, 0);

      setMetrics({
        totalStudents,
        totalClasses,
        pendingGrading,
        upcomingLessons,
      });

      setError(null);
    } catch (err) {
      console.error('Error fetching teacher dashboard data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [userId]);

  return {
    metrics,
    classes,
    loading,
    error,
    refetch: fetchDashboardData,
  };
}
