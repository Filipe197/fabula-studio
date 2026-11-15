# Fabula Studio — site + painel de administrador

## O que tem aqui

| Arquivo | Para que serve |
|---|---|
| `index.html` | O site público |
| `admin.html` | O painel onde você cadastra jogos, novidades e links |
| `config.js` | Onde você cola os dados do Supabase (único arquivo que precisa editar) |
| `js/data.js` | Faz o site e o painel conversarem com o banco |
| `schema.sql` | Cria as tabelas no Supabase |
| `img/` | Imagens iniciais do Harvest Hollow |

## Testar agora, sem configurar nada

Enquanto o `config.js` estiver vazio, tudo roda em **modo demonstração**: o painel funciona, mas salva só no seu navegador.

1. Abra a pasta no VS Code.
2. Instale a extensão **Live Server** e clique em **Go Live**. Não abra o arquivo direto com dois cliques, porque assim as imagens enviadas não funcionam.
3. Abra `admin.html`, entre com qualquer e-mail e senha, cadastre um jogo e veja ele aparecer no `index.html`.

## Colocar no ar de verdade

### 1. Supabase (banco e imagens)

1. Crie um projeto em supabase.com (o plano grátis basta).
2. No `schema.sql`, troque `SEU-EMAIL@AQUI` pelo seu e-mail.
3. No Supabase, vá em **SQL Editor > New query**, cole o arquivo inteiro e clique em **Run**.
4. Em **Authentication > Users > Add user > Create new user**, crie o usuário com o **mesmo e-mail** e uma senha forte. Marque **Auto Confirm User**.
5. Em **Authentication > Sign In / Providers**, desligue **Allow new users to sign up**. Assim ninguém mais cria conta.
6. Em **Project Settings > API**, copie a **Project URL** e a chave **anon public**.

### 2. config.js

Cole os dois valores:

```js
SUPABASE_URL: "https://xxxx.supabase.co",
SUPABASE_ANON_KEY: "eyJhbGciOi...",
```

A chave anon pode ficar no site sem problema. Quem protege os dados são as regras do banco: só o seu e-mail consegue alterar alguma coisa.

### 3. GitHub + Vercel

```
cd caminho\da\pasta\FabulaStudio-site
git init
git add .
git commit -m "Site Fabula Studio"
git branch -M main
git remote add origin https://github.com/Filipe197/fabula-studio.git
git push -u origin main
```

Na Vercel, clique em **Add New > Project**, importe o repositório e clique em **Deploy**. Não precisa configurar nada, porque é um site estático.

Depois disso:
- O site fica em `seusite.vercel.app`.
- O painel fica em `seusite.vercel.app/admin.html`.

## Lançou um jogo novo?

1. Entre no `/admin.html`.
2. Clique em **Jogos > Novo jogo**.
3. Preencha nome, resumo, modelo (Grátis, Doação ou Pago), plataformas e links. Envie a capa e as imagens.
4. Clique em **Salvar**. O jogo aparece na hora no site: na vitrine, no catálogo, nos filtros, na linha do tempo e no rodapé.

Outras coisas que dá para fazer no painel:
- **Setinhas ↑ ↓:** mudam a ordem dos jogos no site.
- **Botão de visível:** esconde um jogo sem apagar.
- **"Jogo em destaque":** coloca o jogo no topo do site e na seção grande. Só um jogo fica em destaque por vez.
- **Novidades:** as 3 mais recentes aparecem na página inicial.
- **Inscritos:** lista quem deixou o e-mail. Dá para copiar ou baixar como planilha.
- **Ajustes:** aviso do topo, link de doação, e-mail e redes sociais.

## Imagens do Harvest Hollow

As imagens iniciais ficam na pasta `img/`. As que você enviar pelo painel vão para o Supabase Storage, no bucket `midia`.
