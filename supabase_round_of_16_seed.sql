-- ============================================
-- SEED: OCTAVOS DE FINAL (Round of 16) — Mundial 2026
-- Ejecutar en el editor SQL de Supabase.
-- Idempotente: cada INSERT solo se aplica si el partido no existe ya
-- (misma pareja de equipos y fase), asi que es seguro correrlo mas de una vez.
-- Horas en UTC. Ecuador = UTC-5.
-- ============================================

-- Paraguay vs Francia
INSERT INTO matches (group_name, phase, team1, team2, team1_code, team2_code, stadium, city, match_datetime, status, team1_score, team2_score, betting_closed)
SELECT NULL,'round_of_16','Paraguay','Francia','py','fr','MetLife Stadium','East Rutherford','2026-07-04 20:00:00+00','upcoming',0,0,false
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE phase='round_of_16' AND team1='Paraguay' AND team2='Francia');

-- Canada vs Marruecos (en vivo 0-2)
INSERT INTO matches (group_name, phase, team1, team2, team1_code, team2_code, stadium, city, match_datetime, status, team1_score, team2_score, betting_closed)
SELECT NULL,'round_of_16','Canada','Marruecos','ca','ma','BC Place','Vancouver','2026-07-04 23:00:00+00','live',0,2,true
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE phase='round_of_16' AND team1='Canada' AND team2='Marruecos');

-- Brasil vs Noruega
INSERT INTO matches (group_name, phase, team1, team2, team1_code, team2_code, stadium, city, match_datetime, status, team1_score, team2_score, betting_closed)
SELECT NULL,'round_of_16','Brasil','Noruega','br','no','Hard Rock Stadium','Miami Gardens','2026-07-05 20:00:00+00','upcoming',0,0,false
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE phase='round_of_16' AND team1='Brasil' AND team2='Noruega');

-- Mexico vs Inglaterra
INSERT INTO matches (group_name, phase, team1, team2, team1_code, team2_code, stadium, city, match_datetime, status, team1_score, team2_score, betting_closed)
SELECT NULL,'round_of_16','Mexico','Inglaterra','mx','gb-eng','Estadio Azteca','Ciudad de Mexico','2026-07-05 23:00:00+00','upcoming',0,0,false
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE phase='round_of_16' AND team1='Mexico' AND team2='Inglaterra');

-- Portugal vs Espana
INSERT INTO matches (group_name, phase, team1, team2, team1_code, team2_code, stadium, city, match_datetime, status, team1_score, team2_score, betting_closed)
SELECT NULL,'round_of_16','Portugal','Espana','pt','es','AT&T Stadium','Arlington','2026-07-06 20:00:00+00','upcoming',0,0,false
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE phase='round_of_16' AND team1='Portugal' AND team2='Espana');

-- Estados Unidos vs Belgica
INSERT INTO matches (group_name, phase, team1, team2, team1_code, team2_code, stadium, city, match_datetime, status, team1_score, team2_score, betting_closed)
SELECT NULL,'round_of_16','Estados Unidos','Belgica','us','be','SoFi Stadium','Inglewood','2026-07-06 23:00:00+00','upcoming',0,0,false
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE phase='round_of_16' AND team1='Estados Unidos' AND team2='Belgica');

-- Argentina vs Egipto
INSERT INTO matches (group_name, phase, team1, team2, team1_code, team2_code, stadium, city, match_datetime, status, team1_score, team2_score, betting_closed)
SELECT NULL,'round_of_16','Argentina','Egipto','ar','eg','Arrowhead Stadium','Kansas City','2026-07-07 20:00:00+00','upcoming',0,0,false
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE phase='round_of_16' AND team1='Argentina' AND team2='Egipto');

-- Suiza vs Colombia
INSERT INTO matches (group_name, phase, team1, team2, team1_code, team2_code, stadium, city, match_datetime, status, team1_score, team2_score, betting_closed)
SELECT NULL,'round_of_16','Suiza','Colombia','ch','co','Lumen Field','Seattle','2026-07-07 23:00:00+00','upcoming',0,0,false
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE phase='round_of_16' AND team1='Suiza' AND team2='Colombia');
