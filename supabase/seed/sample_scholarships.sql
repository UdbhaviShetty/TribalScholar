-- SAMPLE/DEMO DATA ONLY. Fictional records; not real or verified scholarship information.
-- Idempotent: safe to run more than once (skips titles that already exist).
with v(title, provider, category, education_level, state, amount, deadline, income_limit, minimum_percentage, tribal_requirement, gender_requirement, required_documents, benefits) as (values
  ('[DEMO] Post-Matric Tribal Support', 'Demo Provider', 'Government', array['UG','PG']::text[], null::text[], 50000::numeric, current_date + 45, 250000::numeric, 50::numeric, true, null::text,
     array['Income Certificate','Tribal Certificate','Marks Card','Bank Details']::text[], 'Sample tuition support'),
  ('[DEMO] Merit Fellowship', 'Demo Foundation', 'Private', array['PG']::text[], array['Karnataka']::text[], 75000::numeric, current_date + 20, null::numeric, 75::numeric, null::boolean, null::text,
     array['Marks Card','Identity Document']::text[], 'Sample fellowship'),
  ('[DEMO] Girls in STEM Grant', 'Demo Trust', 'NGO', array['UG']::text[], null::text[], 30000::numeric, current_date + 60, 500000::numeric, 60::numeric, null::boolean, 'Female',
     array['Income Certificate','Marks Card']::text[], 'Sample grant')
)
insert into public.scholarships (title, provider, category, education_level, state, amount, deadline, status, income_limit, minimum_percentage, tribal_requirement, gender_requirement, required_documents, benefits, is_demo)
select title, provider, category, education_level, state, amount, deadline, 'published', income_limit, minimum_percentage, tribal_requirement, gender_requirement, required_documents, benefits, true
from v
where not exists (select 1 from public.scholarships s where s.title = v.title);
