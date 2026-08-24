-- Cria uma segunda conta Super Admin (techdeze@gmail.com), independente da
-- simpleqia.oficial@gmail.com. Senha já hasheada com bcrypt (custo 10, mesmo
-- padrão de bcrypt.hash(senha, 10) usado em app/actions/colaboradores.ts) —
-- a senha em texto puro nunca chega a ficar armazenada em lugar nenhum.

-- PASSO 1 — preview: confirma que esse e-mail ainda não existe
select id, email, is_super_admin from colaboradores where email = 'techdeze@gmail.com';

-- PASSO 2 — aplicar (só rode se o PASSO 1 acima não retornou nenhuma linha)
insert into colaboradores (
  nome_completo, email, senha_hash, tipo_acesso, salario,
  tenant_id, is_super_admin, ativo
) values (
  'Super Admin',
  'techdeze@gmail.com',
  '$2b$10$JOLv4dW7iOyB9vnkXGmHv.kb/XOcqkUzheGb7cz6gZGylrayyXGke',
  'Adm',
  0,
  null,
  true,
  true
);
