import { FieldsJsonInput } from '../../components/FieldsJsonInput';
import { LessonButton } from '../../../../shared/ui/LessonPrimitives';
import type { InputEditorProps } from '../../core/lesson';
export function InputEditor({ raw, onChange }: InputEditorProps) {
  let courses: unknown = null;
  try {
    const p = JSON.parse(raw);
    courses = Array.isArray(p) ? p : p?.courses;
  } catch {
    /* Repairable in JSON mode. */
  }
  const rows =
    Array.isArray(courses) &&
    courses.length >= 1 &&
    courses.length <= 12 &&
    courses.every(
      (row) =>
        Array.isArray(row) &&
        row.length === 2 &&
        row.every((v) => typeof v === 'number' || typeof v === 'string'),
    )
      ? (courses as Array<Array<number | string>>)
      : null;
  return (
    <FieldsJsonInput raw={raw} onChange={onChange} id="course-schedule-input">
      <div className="recovery-fields">
        {rows ? (
          <>
            {rows.map((row, i) => (
              <div key={i} className="recovery-course-fields">
                {['Duration', 'Deadline'].map((label, j) => (
                  <label key={label}>
                    {label} · C{i + 1}
                    <input
                      type="text"
                      inputMode="numeric"
                      value={row[j]}
                      onChange={(e) =>
                        onChange(
                          JSON.stringify({
                            courses: rows.map((r, ri) =>
                              ri === i
                                ? r.map((v, ci) =>
                                    ci === j
                                      ? /^\d+$/.test(e.target.value)
                                        ? Number(e.target.value)
                                        : e.target.value
                                      : v,
                                  )
                                : r,
                            ),
                          }),
                        )
                      }
                    />
                  </label>
                ))}
                <LessonButton
                  className="studio-text-button"
                  disabled={rows.length <= 1}
                  onClick={() =>
                    onChange(JSON.stringify({ courses: rows.filter((_, ri) => ri !== i) }))
                  }
                  aria-label={`Remove course ${i + 1}`}
                >
                  Remove
                </LessonButton>
              </div>
            ))}
            <LessonButton
              className="studio-text-button"
              disabled={rows.length >= 12}
              onClick={() => onChange(JSON.stringify({ courses: [...rows, [1, 1]] }))}
            >
              Add course
            </LessonButton>
          </>
        ) : (
          <p>Repair courses in JSON mode to edit rows.</p>
        )}
        <p>
          1–12 courses. Duration and deadline: integers from 1–10,000. Duplicate courses are
          allowed. Build steps applies edits.
        </p>
      </div>
    </FieldsJsonInput>
  );
}
