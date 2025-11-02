'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time?: string;
  event_type: 'class' | 'school' | 'personal' | 'homework' | 'exam';
  class_id?: string;
  preschool_id?: string;
  // Joined data
  class?: {
    name: string;
    grade_level?: string;
  };
}

/**
 * Hook to get calendar events for a child
 */
export const useChildCalendarEvents = (studentId: string | undefined, userId: string | undefined) => {
  return useQuery({
    queryKey: ['calendar', studentId, userId],
    queryFn: async (): Promise<CalendarEvent[]> => {
      if (!studentId || !userId) throw new Error('Student ID and User ID required');
      
      const client = createClient();
      
      // Get student's class_id and preschool_id
      const { data: student, error: studentError } = await client
        .from('students')
        .select('class_id, preschool_id')
        .eq('id', studentId)
        .maybeSingle();
      
      if (studentError) throw studentError;
      if (!student?.class_id && !student?.preschool_id) return [];
      
      // Get next 30 days
      const today = new Date();
      const thirtyDaysLater = new Date(today);
      thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
      
      const events: CalendarEvent[] = [];
      
      // Get class events
      if (student.class_id) {
        const { data: classEvents, error: eventsError } = await client
          .from('class_events')
          .select(`
            id,
            title,
            description,
            start_time,
            end_time,
            event_type,
            class_id,
            class:classes(name, grade_level)
          `)
          .eq('class_id', student.class_id)
          .gte('start_time', today.toISOString())
          .lte('start_time', thirtyDaysLater.toISOString())
          .order('start_time', { ascending: true });
        
        if (!eventsError && classEvents) {
          events.push(...classEvents);
        }
      }
      
      // Get homework due dates as events
      if (student.class_id) {
        const { data: homework } = await client
          .from('homework_assignments')
          .select('id, title, due_date, class_id, class:classes(name, grade_level)')
          .eq('class_id', student.class_id)
          .gte('due_date', today.toISOString().split('T')[0])
          .lte('due_date', thirtyDaysLater.toISOString().split('T')[0]);
        
        if (homework) {
          // Check which homework is not submitted
          const homeworkIds = homework.map(hw => hw.id);
          const { data: submissions } = await client
            .from('homework_submissions')
            .select('assignment_id')
            .eq('student_id', studentId)
            .in('assignment_id', homeworkIds);
          
          const submittedIds = new Set(submissions?.map(s => s.assignment_id) || []);
          
          const homeworkEvents = homework
            .filter(hw => !submittedIds.has(hw.id))
            .map(hw => ({
              id: `hw-${hw.id}`,
              title: `?? ${hw.title} (Due)`,
              description: 'Homework assignment due',
              start_time: `${hw.due_date}T23:59:00`,
              event_type: 'homework' as const,
              class_id: hw.class_id,
              class: hw.class
            }));
          
          events.push(...homeworkEvents);
        }
      }
      
      // Sort all events by start_time
      events.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
      
      return events;
    },
    enabled: !!studentId && !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
