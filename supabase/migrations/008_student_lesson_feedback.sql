-- Tutor student management: status + optional per-lesson feedback

alter table public.students
  add column if not exists status text not null default 'active',
  add column if not exists archived_at timestamptz;

alter table public.students
  drop constraint if exists students_status_check;

alter table public.students
  add constraint students_status_check
  check (status in ('active', 'archived'));

create index if not exists students_tutor_status_idx
  on public.students (tutor_id, status);

alter table public.bookings
  add column if not exists tutor_lesson_feedback text,
  add column if not exists lesson_rating smallint;

alter table public.bookings
  drop constraint if exists bookings_lesson_rating_check;

alter table public.bookings
  add constraint bookings_lesson_rating_check
  check (lesson_rating is null or (lesson_rating >= 1 and lesson_rating <= 5));

notify pgrst, 'reload schema';
