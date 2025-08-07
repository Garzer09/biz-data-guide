alter table public.company_profiles
  alter column estructura_accionarial type text using estructura_accionarial::text,
  alter column organigrama type text using organigrama::text;