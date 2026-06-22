UPDATE public.student_results
SET theory_marks = round(theory_marks),
    practical_marks = round(practical_marks),
    theory_grace = round(theory_grace),
    practical_grace = round(practical_grace),
    marks_obtained = round(marks_obtained),
    grace_marks = round(grace_marks),
    total_marks = round(total_marks),
    theory_total = round(theory_total),
    practical_total = round(practical_total);