# Momentum — Deploy no Netlify + Firebase

## Arquivos do projeto

```
momentum/
├── firebase-config.js          ← configurar antes de subir
├── login.html
├── momentum-dashboard-v2.html  ← dashboard PT
├── momentum-cliente-soares.html ← dashboard aluno
├── momentum-landing-v4.html    ← landing page
├── momentum-exercises.json     ← importar no Firestore
├── momentum-students.json      ← importar no Firestore
└── momentum-sessions.json      ← importar no Firestore
```

---

## PASSO 1 — Criar projeto no Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. **Add project** → dê um nome (ex: `momentum-pt`)
3. Desative o Google Analytics (não precisa)
4. No menu lateral: **Build → Authentication**
   - **Get started** → ative **Email/Password**
5. No menu lateral: **Build → Firestore Database**
   - **Create database** → escolha **Production mode** → selecione região (ex: `southamerica-east1`)
6. No menu lateral: **Project Settings** (ícone de engrenagem)
   - Role até **Your apps** → clique em **</>** (Web)
   - Registre o app (nome: `momentum-web`)
   - Copie o objeto `firebaseConfig` que aparecer

---

## PASSO 2 — Preencher firebase-config.js

Abra o arquivo `firebase-config.js` e substitua os valores:

```js
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSy...",        // ← do Firebase Console
  authDomain:        "momentum-pt.firebaseapp.com",
  projectId:         "momentum-pt",
  storageBucket:     "momentum-pt.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123:web:abc"
};

const ADMIN_EMAIL = "seu@email.com";    // ← seu email de PT
```

---

## PASSO 3 — Criar seu usuário PT no Firebase

1. No Console Firebase → **Authentication → Users → Add user**
2. Email: mesmo que você colocou em `ADMIN_EMAIL`
3. Senha: escolha uma senha forte

Para cada aluno, crie também um usuário aqui.
O `uid` gerado será a chave no Firestore (`students/{uid}`).

---

## PASSO 4 — Importar dados no Firestore

### Opção A — Manual (rápido para poucos registros)
1. Firestore → **Start collection** → nome: `exercises`
2. Para cada exercício do `momentum-exercises.json`, clique **Add document**

### Opção B — Script de importação (recomendado)
Instale o Firebase CLI:
```bash
npm install -g firebase-tools
firebase login
firebase init firestore
```

Crie um script `import.js`:
```js
const admin = require('firebase-admin');
const exercises = require('./momentum-exercises.json');
const students = require('./momentum-students.json');
const sessions = require('./momentum-sessions.json');

admin.initializeApp({ credential: admin.credential.applicationDefault() });
const db = admin.firestore();

async function run() {
  // Exercícios
  for(const ex of exercises.exercises || exercises) {
    await db.collection('exercises').doc(ex.id).set(ex);
    console.log('ex:', ex.id);
  }
  // Alunos
  for(const s of students.students || students) {
    await db.collection('students').doc(s.id).set(s);
    console.log('student:', s.id);
  }
  // Sessões
  for(const sess of sessions.sessions || sessions) {
    await db.collection('sessions').doc(sess.id).set(sess);
    console.log('session:', sess.id);
  }
  console.log('Done!');
}
run();
```

```bash
GOOGLE_APPLICATION_CREDENTIALS="serviceAccount.json" node import.js
```
*(O `serviceAccount.json` baixa em: Project Settings → Service accounts → Generate new private key)*

---

## PASSO 5 — Regras de segurança do Firestore

No Console → **Firestore → Rules**, cole:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Exercícios: qualquer usuário autenticado lê, só admin escreve
    match /exercises/{id} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.email == "SEU@EMAIL.COM";
    }

    // Alunos: cada aluno lê só o próprio, PT lê todos
    match /students/{studentId} {
      allow read: if request.auth.uid == studentId
                  || request.auth.token.email == "SEU@EMAIL.COM";
      allow write: if request.auth.token.email == "SEU@EMAIL.COM";

      match /mesociclos/{mesoId} {
        allow read: if request.auth.uid == studentId
                    || request.auth.token.email == "SEU@EMAIL.COM";
        allow write: if request.auth.token.email == "SEU@EMAIL.COM";
      }
    }

    // Sessões: aluno lê as próprias, PT lê/escreve todas
    match /sessions/{sessionId} {
      allow read: if request.auth.uid == resource.data.student_id
                  || request.auth.token.email == "SEU@EMAIL.COM";
      allow write: if request.auth.token.email == "SEU@EMAIL.COM";
    }
  }
}
```
*(Substitua `SEU@EMAIL.COM` pelo seu email de PT)*

---

## PASSO 6 — Deploy no Netlify

### Via arrastar e soltar (mais fácil)
1. Acesse [app.netlify.com](https://app.netlify.com)
2. **Add new site → Deploy manually**
3. Arraste a pasta do projeto para a área indicada
4. Pronto — Netlify gera uma URL tipo `momentum-abc123.netlify.app`

### Via GitHub (recomendado para atualizações automáticas)
1. Suba os arquivos em um repositório GitHub (privado)
2. No Netlify: **Add new site → Import from Git**
3. Conecte o repositório
4. Build settings: deixe em branco (site estático)
5. A cada `git push`, Netlify faz redeploy automático

---

## PASSO 7 — Netlify Analytics (rastreamento de visitas)

1. No painel do site no Netlify → **Analytics**
2. Clique **Enable analytics** (~$9/mês — vale para dados reais)

O que você ganha **sem código nenhum**:
- Pageviews por dia/hora
- IPs e países de origem
- Dispositivos e navegadores
- Páginas mais visitadas
- Referrers (de onde vieram)
- Tempo no site

O tracker de seções que já está na landing (`Section Analytics Tracker`) complementa com: qual seção visitou + tempo gasto em cada uma. Esses dados ficam no `sessionStorage` do visitante — não é invasivo, não precisa de aviso de cookies.

---

## Domínio customizado (opcional)

Em **Site settings → Domain management → Add custom domain**:
→ `momentum.seudominio.com.br`

---

## Resumo rápido

```
1. Firebase Console → criar projeto → copiar config
2. Preencher firebase-config.js
3. Criar usuário PT no Firebase Auth
4. Importar JSON no Firestore
5. Configurar regras de segurança
6. Arrastar pasta para netlify.com
7. Ativar Netlify Analytics
```

**Tempo estimado: 30–45 minutos.**
