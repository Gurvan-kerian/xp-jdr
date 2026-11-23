-- La belle appli — lot 0 : chargement des données par différences (23/11/2026)
-- À coller dans Supabase › SQL Editor, puis « Run ». Ne contient aucun code ni clé.
-- Sans risque pour l'existant : xp_list est inchangée (utilisée aussi par la fonction de notifications),
-- et l'appli revient d'elle-même au rechargement complet tant que xp_since n'est pas installée.

-- 1. Trace des suppressions (pour que les autres appareils voient qu'une ligne a disparu)
create table if not exists public.docs_supprimes (
  coll text not null,
  id text not null,
  deleted_at timestamptz not null default now(),
  primary key (coll, id)
);
alter table public.docs_supprimes enable row level security;  -- aucun accès direct : seulement via les fonctions

-- 2. Index pour retrouver vite les lignes modifiées
create index if not exists docs_updated_at_idx on public.docs (updated_at);
create index if not exists docs_supprimes_deleted_at_idx on public.docs_supprimes (deleted_at);

-- 3. xp_set : identique, et efface la trace si une ligne supprimée est recréée
create or replace function public.xp_set(p_code text, p_coll text, p_id text, p_data jsonb)
returns void language plpgsql security definer as $$
begin
  if not public.xp_ok(p_code) then raise exception 'code invalide' using errcode = '28000'; end if;
  insert into public.docs (coll, id, data, updated_at) values (p_coll, p_id, p_data, now())
  on conflict (coll, id) do update set data = excluded.data, updated_at = now();
  delete from public.docs_supprimes where coll = p_coll and id = p_id;
end $$;

-- 4. xp_delete : identique, et garde une trace de la suppression (les traces de plus de 30 jours sont effacées)
create or replace function public.xp_delete(p_code text, p_coll text, p_id text)
returns void language plpgsql security definer as $$
begin
  if not public.xp_ok(p_code) then raise exception 'code invalide' using errcode = '28000'; end if;
  delete from public.docs where coll = p_coll and id = p_id;
  insert into public.docs_supprimes (coll, id, deleted_at) values (p_coll, p_id, now())
  on conflict (coll, id) do update set deleted_at = now();
  delete from public.docs_supprimes where deleted_at < now() - interval '30 days';
end $$;

-- 5. xp_since : seulement ce qui a changé depuis p_depuis (avec 15 s de marge), hors portraits, + l'heure du serveur
create or replace function public.xp_since(p_code text, p_depuis timestamptz)
returns json language plpgsql security definer as $$
declare
  t timestamptz := now();
  b timestamptz := p_depuis - interval '15 seconds';
begin
  if not public.xp_ok(p_code) then raise exception 'code invalide' using errcode = '28000'; end if;
  return json_build_object(
    'now', t,
    'rows', coalesce((select json_agg(json_build_object('coll', d.coll, 'id', d.id, 'data', d.data, 'updated_at', d.updated_at))
                      from public.docs d where d.coll <> 'portraits' and d.updated_at > b), '[]'::json),
    'del',  coalesce((select json_agg(json_build_object('coll', s.coll, 'id', s.id))
                      from public.docs_supprimes s where s.coll <> 'portraits' and s.deleted_at > b), '[]'::json)
  );
end $$;
grant execute on function public.xp_since(text, timestamptz) to anon, authenticated;
