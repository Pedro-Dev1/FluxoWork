-- Suporte a "esqueci minha senha": token de uso único com expiração,
-- enviado por e-mail via Resend, para redefinir a senha sem estar logado.

-- PASSO 1 — preview: nada muda ainda
select count(*) as total_colaboradores from colaboradores;

-- PASSO 2 — aplicar a migração
alter table colaboradores
add column if not exists reset_token text,
add column if not exists reset_token_expires_at timestamptz;

create index if not exists idx_colaboradores_reset_token on colaboradores(reset_token);
