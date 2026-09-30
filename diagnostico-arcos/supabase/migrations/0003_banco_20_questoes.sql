-- Troca o banco de 15 questões pelo de 20 (documento "Banco de 20 exercícios diagnósticos").
-- D1 = Q1–Q5, D2 = Q6–Q10, D3 = Q11–Q15, D4 = Q16–Q20 (a D5 do documento foi incorporada à D4).
--
-- ATENÇÃO: os ids Q1–Q15 passam a significar outras questões, então respostas gravadas com o banco
-- antigo não fazem mais sentido. Esta migração APAGA todas as tentativas, respostas e autoavaliações.
-- Só rode antes de haver dados reais (no banco de produção havia apenas uma tentativa de teste).

delete from public.attempts;   -- answers e self_assessment saem junto (on delete cascade)
delete from public.gabarito;

insert into public.gabarito (question_id, skill, tipo, opcoes, correta) values
  ('Q1',  'D1', 'multipla', array['Reta','Semirreta','Segmento de reta','Circunferência'], 'Segmento de reta'),
  ('Q2',  'D1', 'multipla', array['Corda','Raio','Diâmetro','Arco'], 'Raio'),
  ('Q3',  'D1', 'multipla', array['9 cm','18 cm','36 cm','324 cm'], '36 cm'),
  ('Q4',  'D1', 'multipla', array['10 cm','15 cm','30 cm','60 cm'], '15 cm'),
  ('Q5',  'D1', 'multipla', array['Raio','Corda','Arco','Tangente'], 'Corda'),
  ('Q6',  'D2', 'multipla', array['O círculo','A circunferência','O raio','O centro'], 'A circunferência'),
  ('Q7',  'D2', 'multipla', array['Uma circunferência','Um raio','Um círculo','Uma corda'], 'Um círculo'),
  ('Q8',  'D2', 'multipla', array['Toda corda é um diâmetro','Todo raio é uma corda','Todo diâmetro é uma corda','Todo diâmetro é um raio'], 'Todo diâmetro é uma corda'),
  ('Q9',  'D2', 'multipla', array['Corda','Secante','Tangente','Diâmetro'], 'Tangente'),
  ('Q10', 'D2', 'multipla', array['Tangente','Secante','Raio','Arco'], 'Secante'),
  ('Q11', 'D3', 'multipla', array['Agudo','Reto','Obtuso','Raso'], 'Agudo'),
  ('Q12', 'D3', 'multipla', array['45°','90°','135°','180°'], '135°'),
  ('Q13', 'D3', 'multipla', array['90°','180°','270°','360°'], '360°'),
  ('Q14', 'D3', 'numerica', null, '180'),
  ('Q15', 'D3', 'numerica', null, '90'),
  ('Q16', 'D4', 'multipla', array['90°','120°','180°','240°'], '120°'),
  ('Q17', 'D4', 'numerica', null, '60'),
  ('Q18', 'D4', 'numerica', null, '270'),
  ('Q19', 'D4', 'multipla', array['1/2','1/3','1/4','3/4'], '1/4'),
  ('Q20', 'D4', 'multipla', array['75°','80°','85°','95°'], '85°');
