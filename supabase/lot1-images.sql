-- La belle appli — lot 1 : grandes images des fiches (23/11/2026)
-- À coller dans Supabase › SQL Editor, puis « Run ». Ne contient aucun code ni clé.
-- Sans risque pour l'existant : nouvelle table à part, xp_list et xp_since ne sont pas modifiées
-- (les grandes images ne passent donc jamais par la synchronisation toutes les 5 s).
-- La vignette reste dans la collection « portraits » comme aujourd'hui ; la grande image n'est lue qu'à l'ouverture.

-- 1. Table des grandes images (identifiant = celui de la vignette, ex. ill-fiche-f-xxxx)
create table if not exists public.images (
  id text primary key,
  data text not null,
  updated_at timestamptz not null default now()
);
alter table public.images enable row level security;  -- aucun accès direct : seulement via les fonctions

-- 2. Enregistrer une grande image
create or replace function public.xp_img_set(p_code text, p_id text, p_data text)
returns void language plpgsql security definer as $$
begin
  if not public.xp_ok(p_code) then raise exception 'code invalide' using errcode = '28000'; end if;
  insert into public.images (id, data, updated_at) values (p_id, p_data, now())
  on conflict (id) do update set data = excluded.data, updated_at = now();
end $$;

-- 3. Lire une grande image (null si absente)
create or replace function public.xp_img_get(p_code text, p_id text)
returns text language plpgsql security definer as $$
begin
  if not public.xp_ok(p_code) then raise exception 'code invalide' using errcode = '28000'; end if;
  return (select i.data from public.images i where i.id = p_id);
end $$;

-- 4. Retirer une grande image
create or replace function public.xp_img_del(p_code text, p_id text)
returns void language plpgsql security definer as $$
begin
  if not public.xp_ok(p_code) then raise exception 'code invalide' using errcode = '28000'; end if;
  delete from public.images where id = p_id;
end $$;

grant execute on function public.xp_img_set(text, text, text) to anon, authenticated;
grant execute on function public.xp_img_get(text, text) to anon, authenticated;
grant execute on function public.xp_img_del(text, text) to anon, authenticated;
