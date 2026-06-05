export function getInstructorId(instructor) {
  if (!instructor) return null;
  if (typeof instructor === 'string') return instructor;
  return instructor._id || instructor.id || null;
}

export function isUserEnrolled(course, userId) {
  if (!course || !userId) return false;
  if (typeof course.isEnrolled === 'boolean') return course.isEnrolled;
  return course.enrolledStudents?.some((sId) => String(sId) === String(userId)) ?? false;
}

export function getEnrolledCount(course) {
  if (!course) return 0;
  if (typeof course.enrolledCount === 'number') return course.enrolledCount;
  return course.enrolledStudents?.length ?? 0;
}

export function canEditCourse(user, course) {
  if (!user || !course) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'instructor') {
    return String(getInstructorId(course.instructor)) === String(user.id);
  }
  return false;
}

export function formatPrice(price) {
  const n = Number(price);
  if (Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDuration(minutes) {
  const m = Number(minutes);
  if (Number.isNaN(m) || m <= 0) return '—';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `${h}h ${rem}m` : `${h}h`;
}

export const LEVELS = ['beginner', 'intermediate', 'advanced', 'all levels'];

export const emptyLecture = () => ({
  title: '',
  description: '',
  videoUrl: '',
  duration: '',
});

export const emptySection = () => ({
  title: '',
  lectures: [emptyLecture()],
});

export const emptyCourseForm = () => ({
  title: '',
  subtitle: '',
  description: '',
  thumbnail: '',
  price: '',
  category: '',
  level: 'beginner',
  sections: [emptySection()],
});

export function courseToFormValues(course) {
  const sections =
    course.sections?.length > 0
      ? course.sections.map((section) => ({
          title: section.title || '',
          lectures:
            section.lectures?.length > 0
              ? section.lectures.map((lecture) => ({
                  title: lecture.title || '',
                  description: lecture.description || '',
                  videoUrl: lecture.videoUrl || '',
                  duration: lecture.duration ?? '',
                }))
              : [emptyLecture()],
        }))
      : [emptySection()];

  return {
    title: course.title || '',
    subtitle: course.subtitle || '',
    description: course.description || '',
    thumbnail: course.thumbnail || '',
    price: course.price ?? '',
    category: course.category || '',
    level: course.level || 'beginner',
    sections,
  };
}

export function formValuesToPayload(values) {
  const sections = (values.sections || [])
    .filter((s) => s.title.trim())
    .map((section) => ({
      title: section.title.trim(),
      lectures: (section.lectures || [])
        .filter((l) => l.title.trim() && l.videoUrl.trim())
        .map((lecture) => {
          const duration = Number(lecture.duration);
          return {
            title: lecture.title.trim(),
            description: lecture.description?.trim() || '',
            videoUrl: lecture.videoUrl.trim(),
            duration: Number.isFinite(duration) ? duration : 0,
          };
        }),
    }));

  return {
    title: values.title.trim(),
    subtitle: values.subtitle.trim(),
    description: values.description.trim(),
    thumbnail: values.thumbnail.trim(),
    price: Number(values.price),
    category: values.category.trim(),
    level: values.level,
    sections,
  };
}

export function validateCourseForm(values) {
  const errors = {};

  if (!values.title?.trim() || values.title.trim().length < 3) {
    errors.title = 'Title must be at least 3 characters';
  } else if (values.title.trim().length > 200) {
    errors.title = 'Title must be at most 200 characters';
  }

  if (values.subtitle?.trim().length > 300) {
    errors.subtitle = 'Subtitle is too long';
  }

  if (!values.description?.trim() || values.description.trim().length < 10) {
    errors.description = 'Description must be at least 10 characters';
  }

  if (values.price === '' || Number.isNaN(Number(values.price)) || Number(values.price) < 0) {
    errors.price = 'Enter a valid non-negative price';
  }

  if (!values.category?.trim() || values.category.trim().length < 2) {
    errors.category = 'Category must be at least 2 characters';
  }

  if (!LEVELS.includes(values.level)) {
    errors.level = 'Select a valid level';
  }

  const hasValidSection = (values.sections || []).some((section) => {
    if (!section.title?.trim()) return false;
    return (section.lectures || []).some(
      (lecture) =>
        lecture.title?.trim() &&
        lecture.videoUrl?.trim() &&
        lecture.duration !== '' &&
        !Number.isNaN(Number(lecture.duration)) &&
        Number(lecture.duration) >= 0
    );
  });

  if (!hasValidSection) {
    errors.sections = 'Add at least one section with a title and one complete lecture';
  }

  (values.sections || []).forEach((section, sIdx) => {
    if (section.title.trim() && section.title.trim().length > 200) {
      errors[`sections.${sIdx}.title`] = 'Section title too long';
    }
    (section.lectures || []).forEach((lecture, lIdx) => {
      const hasContent =
        lecture.title.trim() || lecture.videoUrl.trim() || String(lecture.duration).trim();
      if (!hasContent) return;
      if (!lecture.title.trim()) {
        errors[`sections.${sIdx}.lectures.${lIdx}.title`] = 'Lecture title is required';
      }
      if (!lecture.videoUrl.trim()) {
        errors[`sections.${sIdx}.lectures.${lIdx}.videoUrl`] = 'Video URL is required';
      }
      if (lecture.duration === '' || Number.isNaN(Number(lecture.duration)) || Number(lecture.duration) < 0) {
        errors[`sections.${sIdx}.lectures.${lIdx}.duration`] = 'Valid duration required';
      }
    });
  });

  return errors;
}
