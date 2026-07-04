import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

export type LearnLinkCourseSummary = {
  id: string;
  canvasCourseId: number;
  name: string;
  courseCode: string | null;
  workflowState: string | null;
  startAt: string | null;
  endAt: string | null;
  termName: string | null;
  termStartAt: string | null;
  termEndAt: string | null;
  assignmentCount: number;
  moduleCount: number;
  fileCount: number;
};

export type LearnLinkAssignment = {
  id: string;
  canvasAssignmentId: number;
  courseId: string;
  name: string;
  description: string | null;
  dueAt: string | null;
  htmlUrl: string | null;
};

export type LearnLinkModule = {
  id: string;
  canvasModuleId: number;
  courseId: string;
  name: string;
  position: number | null;
};

export type LearnLinkCourseFile = {
  id: string;
  canvasFileId: number;
  courseId: string;
  filename: string;
  contentType: string | null;
  url: string | null;
  size: number | null;
  updatedAt: string | null;
};

export type LearnLinkCourseWithMaterials = Omit<
  LearnLinkCourseSummary,
  'assignmentCount' | 'moduleCount' | 'fileCount'
> & {
  assignments: LearnLinkAssignment[];
  modules: LearnLinkModule[];
  files: LearnLinkCourseFile[];
};

export const learnLinkBaseUrl = (
  import.meta.env.VITE_LEARNLINK_CANVAS_SERVICE_URL || 'http://localhost:3333'
).replace(/\/+$/, '');

async function fetchLearnLink<T>(path: string): Promise<T> {
  const response = await fetch(`${learnLinkBaseUrl}${path}`);

  if (!response.ok) {
    throw new Error(`LearnLink request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function useCurrentCoursesQuery(): UseQueryResult<LearnLinkCourseSummary[]> {
  return useQuery<LearnLinkCourseSummary[]>(
    ['learnlink', 'current-courses', learnLinkBaseUrl],
    () => fetchLearnLink<LearnLinkCourseSummary[]>('/api/learnlink/courses/current'),
    {
      staleTime: 30000,
      cacheTime: 300000,
      retry: 1,
    },
  );
}

export function useCourseMaterialsQuery(
  canvasCourseId: number | null,
): UseQueryResult<LearnLinkCourseWithMaterials | undefined> {
  return useQuery<LearnLinkCourseWithMaterials[], Error, LearnLinkCourseWithMaterials | undefined>(
    ['learnlink', 'course-materials', learnLinkBaseUrl],
    () => fetchLearnLink<LearnLinkCourseWithMaterials[]>('/api/learnlink/courses'),
    {
      staleTime: 300000,
      cacheTime: 600000,
      retry: 1,
      enabled: canvasCourseId != null,
      select: (courses) => courses.find((course) => course.canvasCourseId === canvasCourseId),
    },
  );
}
