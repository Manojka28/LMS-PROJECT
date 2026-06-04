import React from 'react';
import MagneticButton from './MagneticButton';
import { LEVELS, emptyLecture, emptySection } from '../utils/courseHelpers';

function fieldError(errors, key) {
  return errors[key] ? <span className="field-error">{errors[key]}</span> : null;
}

export default function CourseForm({
  values,
  errors,
  onChange,
  onSubmit,
  submitting,
  submitLabel,
  formError,
}) {
  const update = (field, value) => onChange({ ...values, [field]: value });

  const updateSection = (sIdx, field, value) => {
    const sections = [...values.sections];
    sections[sIdx] = { ...sections[sIdx], [field]: value };
    update('sections', sections);
  };

  const updateLecture = (sIdx, lIdx, field, value) => {
    const sections = [...values.sections];
    const lectures = [...sections[sIdx].lectures];
    lectures[lIdx] = { ...lectures[lIdx], [field]: value };
    sections[sIdx] = { ...sections[sIdx], lectures };
    update('sections', sections);
  };

  const addSection = () => update('sections', [...values.sections, emptySection()]);

  const removeSection = (sIdx) => {
    if (values.sections.length <= 1) return;
    update(
      'sections',
      values.sections.filter((_, i) => i !== sIdx)
    );
  };

  const addLecture = (sIdx) => {
    const sections = [...values.sections];
    sections[sIdx] = {
      ...sections[sIdx],
      lectures: [...sections[sIdx].lectures, emptyLecture()],
    };
    update('sections', sections);
  };

  const removeLecture = (sIdx, lIdx) => {
    const sections = [...values.sections];
    if (sections[sIdx].lectures.length <= 1) return;
    sections[sIdx] = {
      ...sections[sIdx],
      lectures: sections[sIdx].lectures.filter((_, i) => i !== lIdx),
    };
    update('sections', sections);
  };

  return (
    <form className="course-form" onSubmit={onSubmit} noValidate>
      {formError && <div className="form-alert form-alert-error">{formError}</div>}

      <div className="course-form-panel">
        <h2>Basic information</h2>
        <div className="form-group">
          <label htmlFor="course-title">Title *</label>
          <input
            id="course-title"
            value={values.title}
            onChange={(e) => update('title', e.target.value)}
            className={errors.title ? 'input-error' : ''}
            placeholder="Full Stack Web Development"
          />
          {fieldError(errors, 'title')}
        </div>
        <div className="form-group">
          <label htmlFor="course-subtitle">Subtitle</label>
          <input
            id="course-subtitle"
            value={values.subtitle}
            onChange={(e) => update('subtitle', e.target.value)}
            className={errors.subtitle ? 'input-error' : ''}
            placeholder="From zero to production"
          />
          {fieldError(errors, 'subtitle')}
        </div>
        <div className="form-group">
          <label htmlFor="course-description">Description *</label>
          <textarea
            id="course-description"
            rows={5}
            value={values.description}
            onChange={(e) => update('description', e.target.value)}
            className={errors.description ? 'input-error' : ''}
            placeholder="What students will learn..."
          />
          {fieldError(errors, 'description')}
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="course-price">Price (INR) *</label>
            <input
              id="course-price"
              type="number"
              min="0"
              step="0.01"
              value={values.price}
              onChange={(e) => update('price', e.target.value)}
              className={errors.price ? 'input-error' : ''}
            />
            {fieldError(errors, 'price')}
          </div>
          <div className="form-group">
            <label htmlFor="course-category">Category *</label>
            <input
              id="course-category"
              value={values.category}
              onChange={(e) => update('category', e.target.value)}
              className={errors.category ? 'input-error' : ''}
              placeholder="Development"
            />
            {fieldError(errors, 'category')}
          </div>
          <div className="form-group">
            <label htmlFor="course-level">Level *</label>
            <select
              id="course-level"
              value={values.level}
              onChange={(e) => update('level', e.target.value)}
              className={errors.level ? 'input-error' : ''}
            >
              {LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
            {fieldError(errors, 'level')}
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="course-thumbnail">Thumbnail URL</label>
          <input
            id="course-thumbnail"
            value={values.thumbnail}
            onChange={(e) => update('thumbnail', e.target.value)}
            placeholder="https://example.com/image.jpg"
          />
        </div>
      </div>

      <div className="course-form-panel">
        <div className="course-form-panel-header">
          <h2>Curriculum</h2>
          <button type="button" className="text-btn green" onClick={addSection}>
            + Add section
          </button>
        </div>

        {values.sections.map((section, sIdx) => (
          <div key={sIdx} className="course-form-section">
            <div className="course-form-section-header">
              <h3>Section {sIdx + 1}</h3>
              {values.sections.length > 1 && (
                <button type="button" className="text-btn danger" onClick={() => removeSection(sIdx)}>
                  Remove section
                </button>
              )}
            </div>
            <div className="form-group">
              <label htmlFor={`section-title-${sIdx}`}>Section title</label>
              <input
                id={`section-title-${sIdx}`}
                value={section.title}
                onChange={(e) => updateSection(sIdx, 'title', e.target.value)}
                className={errors[`sections.${sIdx}.title`] ? 'input-error' : ''}
                placeholder="Getting started"
              />
              {fieldError(errors, `sections.${sIdx}.title`)}
            </div>

            {section.lectures.map((lecture, lIdx) => (
              <div key={lIdx} className="course-form-lecture">
                <div className="course-form-section-header">
                  <h4>Lecture {lIdx + 1}</h4>
                  {section.lectures.length > 1 && (
                    <button
                      type="button"
                      className="text-btn danger"
                      onClick={() => removeLecture(sIdx, lIdx)}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor={`lecture-title-${sIdx}-${lIdx}`}>Title</label>
                  <input
                    id={`lecture-title-${sIdx}-${lIdx}`}
                    value={lecture.title}
                    onChange={(e) => updateLecture(sIdx, lIdx, 'title', e.target.value)}
                    className={errors[`sections.${sIdx}.lectures.${lIdx}.title`] ? 'input-error' : ''}
                  />
                  {fieldError(errors, `sections.${sIdx}.lectures.${lIdx}.title`)}
                </div>
                <div className="form-group">
                  <label htmlFor={`lecture-desc-${sIdx}-${lIdx}`}>Description</label>
                  <textarea
                    id={`lecture-desc-${sIdx}-${lIdx}`}
                    rows={2}
                    value={lecture.description}
                    onChange={(e) => updateLecture(sIdx, lIdx, 'description', e.target.value)}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor={`lecture-video-${sIdx}-${lIdx}`}>Video URL</label>
                    <input
                      id={`lecture-video-${sIdx}-${lIdx}`}
                      value={lecture.videoUrl}
                      onChange={(e) => updateLecture(sIdx, lIdx, 'videoUrl', e.target.value)}
                      className={
                        errors[`sections.${sIdx}.lectures.${lIdx}.videoUrl`] ? 'input-error' : ''
                      }
                    />
                    {fieldError(errors, `sections.${sIdx}.lectures.${lIdx}.videoUrl`)}
                  </div>
                  <div className="form-group">
                    <label htmlFor={`lecture-duration-${sIdx}-${lIdx}`}>Duration (min)</label>
                    <input
                      id={`lecture-duration-${sIdx}-${lIdx}`}
                      type="number"
                      min="0"
                      value={lecture.duration}
                      onChange={(e) => updateLecture(sIdx, lIdx, 'duration', e.target.value)}
                      className={
                        errors[`sections.${sIdx}.lectures.${lIdx}.duration`] ? 'input-error' : ''
                      }
                    />
                    {fieldError(errors, `sections.${sIdx}.lectures.${lIdx}.duration`)}
                  </div>
                </div>
              </div>
            ))}

            <button type="button" className="text-btn" onClick={() => addLecture(sIdx)}>
              + Add lecture
            </button>
          </div>
        ))}
      </div>

      <MagneticButton type="submit" className="green-btn check-btn ripple-btn" disabled={submitting}>
        {submitting ? 'Saving...' : submitLabel}
      </MagneticButton>
    </form>
  );
}
