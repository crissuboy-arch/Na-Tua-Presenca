# Na Tua Presenca - 365 Dias com Deus

Aplicacao devocional diaria com 365 reflexoes, oracoes e versiculos biblicos.

## Funcionalidades

- **Devocional Diario** - Leitura diaria com reflexao, oracao e desafio
- **Calendario** - Acompanha o teu progresso nos 365 dias
- **Diario da Alma** - Regista pensamentos e oracoes
- **Pedidos de Oracao** - Compartilha intencoes
- **Chat Espiritual** - Assistente com IA (NVIDIA Llama 3.1 70B)
- **Autenticacao** - Conta pessoal com JWT

## Tecnologias

- **Backend:** Python FastAPI + SQLAlchemy + SQLite
- **Frontend:** HTML + CSS + JavaScript (SPA vanilla)
- **Autenticacao:** JWT + bcrypt
- **IA:** NVIDIA API (Llama 3.1 70B Instruct)
- **Porta:** 9011

## Como Executar

```bash
# 1. Iniciar servidor
start-local.bat

# 2. Abrir no browser
http://localhost:9011
```

O script `start-local.bat` instala dependencias, popula a base de dados e inicia o servidor automaticamente.

## Estrutura

```
backend/
  app/              - Codigo FastAPI (models, routers, schemas)
  static/           - Frontend (HTML, CSS, JS, icons, manifest)
  seed.py           - Popula BD com 365 devocionais
  devocionais.json  - Dados extraidos do PDF
start-local.bat     - Iniciar servidor
stop-local.bat      - Parar servidor
```

## API

| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | /api/auth/register | Criar conta |
| POST | /api/auth/login | Entrar |
| GET | /api/devotionals/today | Devocional de hoje |
| GET | /api/devotionals/day/{day} | Devocional por dia |
| POST | /api/journal | Criar/editar diario |
| POST | /api/prayers | Criar pedido de oracao |
| POST | /api/progress | Marcar dia como lido |
| GET | /api/progress/stats | Estatisticas de leitura |
| POST | /api/chatbot/chat | Chat com assistente IA |

## Variaveis de Ambiente

Copia `.env.example` para `.env` e configura:

```
SECRET_KEY=chave-secreta-aqui
DATABASE_URL=sqlite:///./na_tua_presenca.db
NVIDIA_API_KEY=sua-chave-nvidia-aqui
```

## Licenca

Todos os direitos reservados.
