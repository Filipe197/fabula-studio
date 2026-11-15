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

## Harvest Hollow no site

O jogo fica em `jogar/harvest-hollow/`, e o endereço é `seusite.vercel.app/jogar/harvest-hollow/`.
No painel, edite o Harvest Hollow e coloque `/jogar/harvest-hollow/` no campo **Jogar no navegador**.

## Login com Google (jogadores)

- **No jogo:** em ☰ Menu → **Entrar com Google**, o progresso passa a ser salvo na nuvem a cada 15 segundos e quando a aba é fechada. Em outro aparelho, o jogador entra com a mesma conta e continua de onde parou. Se os dois aparelhos tiverem progressos diferentes, o jogo pergunta qual manter.
- **No site:** o botão **Entrar** no topo mostra o nível e as moedas salvas.
- **No painel:** só entra o e-mail que está na tabela `admins`. Qualquer outra conta, Google ou não, é barrada.
- **No APK:** o Google não permite login dentro do app Android desse tipo, então lá o botão não aparece e o save continua só no aparelho.

### Configurar (uma vez só)

1. No Supabase, vá em **SQL Editor** e rode o arquivo `schema-login.sql`.
2. No **Google Cloud Console** (console.cloud.google.com):
   1. Crie um projeto chamado `Fabula Studio`.
   2. Em **APIs e serviços → Tela de permissão OAuth** (ou "Google Auth Platform"), escolha **Externo**, coloque o nome do app `Fabula Studio` e o seu e-mail, salve e clique em **Publicar app**.
   3. Em **Credenciais → Criar credenciais → ID do cliente OAuth**, escolha o tipo **Aplicativo da Web**. Em **URIs de redirecionamento autorizados**, coloque `https://wvusptxwvcevswyvnhiz.supabase.co/auth/v1/callback`.
   4. Copie o **ID do cliente** e a **Chave secreta do cliente**.
3. No Supabase, em **Authentication → Sign In / Providers → Google**, ligue a opção, cole o ID e a chave e clique em **Save**.
4. No Supabase, em **Authentication → Sign In / Providers**, ligue de novo **Allow new users to sign up**. Sem isso, os jogadores não conseguem criar conta. O painel continua protegido pela tabela `admins`.
5. No Supabase, em **Authentication → URL Configuration**:
   - Em **Site URL**, coloque `https://fabula-studio-theta.vercel.app`.
   - Em **Redirect URLs**, adicione `https://fabula-studio-theta.vercel.app/**`.
