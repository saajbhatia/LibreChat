import { memo, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, BookOpen, ChevronDown, RefreshCw } from 'lucide-react';
import { Constants } from 'librechat-data-provider';
import { Spinner, TooltipAnchor } from '@librechat/client';
import { useLocalStorage } from '~/hooks';
import { cn } from '~/utils';

type LearnLinkCourseSummary = {
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

type CoursesSectionProps = {
  toggleNav: () => void;
};

const courseColors = [
  { background: '#0f9f6e', foreground: '#ffffff' },
  { background: '#3f8f9c', foreground: '#ffffff' },
  { background: '#6b8f59', foreground: '#ffffff' },
  { background: '#c23b4b', foreground: '#ffffff' },
  { background: '#7b5ab6', foreground: '#ffffff' },
  { background: '#b76b2b', foreground: '#ffffff' },
  { background: '#316b83', foreground: '#ffffff' },
  { background: '#a43f75', foreground: '#ffffff' },
];

const iconButtonClassName =
  'flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-text-secondary outline-none transition-colors hover:bg-surface-active-alt hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-black dark:focus-visible:ring-white';

const learnLinkBaseUrl = (
  import.meta.env.VITE_LEARNLINK_CANVAS_SERVICE_URL || 'http://localhost:3333'
).replace(/\/+$/, '');

async function fetchCurrentCourses(): Promise<LearnLinkCourseSummary[]> {
  const response = await fetch(`${learnLinkBaseUrl}/api/learnlink/courses/current`);

  if (!response.ok) {
    throw new Error(`LearnLink courses request failed: ${response.status}`);
  }

  return response.json();
}

function getCourseInitial(name: string): string {
  const firstWord = name.trim().split(/\s+/)[0] ?? '';
  return firstWord.charAt(0).toUpperCase() || 'C';
}

function getDisplayCourseName(name: string): string {
  return name
    .replace(/\s+(?:20)?\d{2}\s*[-–]\s*(?:20)?\d{2}\s*$/u, '')
    .replace(/\s+\(?\d{4}\)?\s*$/u, '')
    .trim();
}

function getCoursePrompt(course: LearnLinkCourseSummary): string {
  return [
    `Current Canvas course: ${course.name}`,
    course.courseCode ? `Course code: ${course.courseCode}` : '',
    'Help me with this course. First ask what assignment, topic, or file I want to work on.',
  ]
    .filter(Boolean)
    .join('\n');
}

function CoursesSection({ toggleNav }: CoursesSectionProps) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useLocalStorage('learnlinkCoursesExpanded', true);
  const {
    data: courses = [],
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useQuery(['learnlink', 'current-courses', learnLinkBaseUrl], fetchCurrentCourses, {
    staleTime: 30000,
    cacheTime: 300000,
    retry: 1,
  });

  const sortedCourses = useMemo(
    () => [...courses].sort((a, b) => a.name.localeCompare(b.name)),
    [courses],
  );

  const openCourseChat = useCallback(
    (course: LearnLinkCourseSummary) => {
      const prompt = encodeURIComponent(getCoursePrompt(course));
      navigate(`/c/${Constants.NEW_CONVO}?prompt=${prompt}`, { state: { focusChat: true } });
      toggleNav();
    },
    [navigate, toggleNav],
  );

  const renderBody = () => {
    if (isLoading) {
      return (
        <div className="flex justify-start py-2 pl-2">
          <Spinner className="h-4 w-4 text-text-secondary" />
        </div>
      );
    }

    if (isError) {
      return (
        <div className="flex items-start gap-2 rounded-lg px-2 py-1.5 text-xs text-text-secondary">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0">Canvas courses unavailable</span>
        </div>
      );
    }

    if (sortedCourses.length === 0) {
      return <div className="px-2 py-1.5 text-xs text-text-secondary">No current courses</div>;
    }

    return (
      <ul className="m-0 list-none p-0">
        {sortedCourses.map((course, index) => {
          const color = courseColors[index % courseColors.length];
          const displayName = getDisplayCourseName(course.name);
          return (
            <li key={course.id} className="list-none">
              <button
                type="button"
                onClick={() => openCourseChat(course)}
                className="group flex h-9 w-full min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-text-primary outline-none transition-colors hover:bg-surface-active-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-black dark:focus-visible:ring-white"
              >
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-xs font-bold"
                  style={{ backgroundColor: color.background, color: color.foreground }}
                  aria-hidden="true"
                >
                  {getCourseInitial(displayName)}
                </span>
                <span className="min-w-0 flex-1 truncate leading-5">{displayName}</span>
              </button>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="flex shrink-0 flex-col border-t border-border-light px-3 pb-2 pt-1 text-sm">
      <div className="flex h-8 w-full items-center gap-0.5 pr-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="group flex min-w-0 flex-1 items-center gap-1 rounded-lg px-1 py-2 text-xs font-bold text-text-secondary outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-black dark:focus-visible:ring-white"
          type="button"
          aria-expanded={isExpanded}
        >
          <span className="select-none truncate">Courses</span>
          <ChevronDown
            className={cn(
              'h-3 w-3 shrink-0 transition-transform duration-200',
              isExpanded ? '' : '-rotate-90',
            )}
            aria-hidden="true"
          />
        </button>
        <BookOpen className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
        <TooltipAnchor
          description="Refresh Canvas courses"
          render={
            <button
              type="button"
              aria-label="Refresh Canvas courses"
              className={iconButtonClassName}
              onClick={() => refetch()}
            >
              <RefreshCw
                className={cn('h-4 w-4', isFetching && !isLoading && 'animate-spin')}
                aria-hidden="true"
              />
            </button>
          }
        />
      </div>

      {isExpanded && (
        <div className="scrollbar-gutter-stable max-h-[30vh] overflow-y-auto">{renderBody()}</div>
      )}
    </div>
  );
}

CoursesSection.displayName = 'CoursesSection';

export default memo(CoursesSection);
